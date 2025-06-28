import path from 'path'
import fs from 'fs'
import { initializeDOM } from './dom.js'
import { loadComponent } from './loader.js'

const { document } = initializeDOM()

// global component directories for resolution
let componentDirs = ['components', 'views']

export async function renderComponent(filePath, data = {}, options = {}) {
  const component = await loadComponent(filePath)
  
  // create a component instance with the provided data
  const instance = new component.ComponentClass()
  
  // set SSR context flag
  instance.$ssr = true
  
  // merge data into instance
  Object.assign(instance, data)
  
  // run SSR lifecycle method if it exists
  if (typeof instance.ssr === 'function') {
    await instance.ssr()
  }
  
  // run initialize lifecycle method if it exists
  if (typeof instance.initialize === 'function') {
    instance.initialize()
  }
  
  // create the template element
  const template = document.createElement('div')
  template.innerHTML = component.template
  
  // set component directories if provided
  if (options.componentDirs) {
    componentDirs = options.componentDirs
  }
  
  // render the component with SSR context
  // Use instance as the data context since it now contains all the properties
  const rendered = await renderSSR(template, instance, instance)
  
  // generate scoped styles
  const styles = component.style ? generateScopedStyles(component.style, component.tagName) : ''
  
  return {
    html: rendered.outerHTML,
    styles,
    tagName: component.tagName
  }
}

async function renderCustomComponent(el, contextData) {
  const tagName = el.tagName.toLowerCase()
  
  // try to find the component file
  let componentPath = null
  
  // first try direct path resolution
  for (const dir of componentDirs) {
    const possiblePath = path.resolve(dir, `${tagName}.html`)
    try {
      fs.accessSync(possiblePath)
      componentPath = possiblePath
      break
    } catch (e) {
      // File doesn't exist, continue
    }
  }
  
  if (!componentPath) {
    console.warn(`[peak-ssr] Component not found: ${tagName}`)
    return
  }
  
  // extract attributes as props
  const props = {}
  for (const attr of [...(el.attributes || [])]) {
    if (attr.name.startsWith(':')) {
      // dynamic attribute
      const propName = attr.name.slice(1)
      props[propName] = evalInSSRContext({}, attr.value, contextData)
    } else {
      // static attribute - don't include if it's an object string
      if (attr.value !== '[object Object]') {
        props[attr.name] = attr.value
      }
    }
  }
  
  // capture slot content (innerHTML of the custom element)
  const slotContent = el.innerHTML.trim()

  // render the component with props and slot content
  const componentData = { 
    ...contextData, 
    ...props,
    _slotContent: slotContent 
  }
  const result = await renderComponent(componentPath, componentData)

  // parse the rendered HTML to get the actual component element
  const tempDiv = document.createElement('div')
  tempDiv.innerHTML = result.html

  // get the first real element inside the wrapper div (skip text nodes)
  let componentEl = null
  for (const child of tempDiv.firstChild?.childNodes || []) {
    if (child.nodeType === 1) { // Element node
      componentEl = child
      break
    }
  }
  
  if (componentEl && el.parentNode) {
    // replace the custom element with the actual component element
    el.parentNode.replaceChild(componentEl, el)
  } else {
    el.innerHTML = componentEl.outerHTML
  }
}

async function renderSSR(template, ctx, data) {
  const root = template.cloneNode(true)
  
  async function _render(el, state = {}, contextData = data) {
    if (!el || el.nodeType !== 1) return el
    
    // Handle x-text directive
    if (el.hasAttribute?.('x-text') && !el.hasAttribute?.('x-for')) {
      const expr = el.getAttribute('x-text')
      const value = evalInSSRContext(ctx, expr, contextData)
      el.textContent = String(value ?? '')
      el.removeAttribute('x-text')
    }
    
    // Handle x-html directive
    if (el.hasAttribute?.('x-html') && !el.hasAttribute?.('x-for')) {
      const expr = el.getAttribute('x-html')
      const value = evalInSSRContext(ctx, expr, contextData)
      el.innerHTML = String(value ?? '')
      el.removeAttribute('x-html')
    }
    
    // Handle x-if directive
    if (el.hasAttribute?.('x-if')) {
      const expr = el.getAttribute('x-if')
      const shouldRender = Boolean(evalInSSRContext(ctx, expr, contextData))
      state.pass = shouldRender
      el.removeAttribute('x-if')
      
      if (!shouldRender) {
        el.remove()
        return null
      }
      
      if (el.tagName === 'TEMPLATE') {
        const rendered = await renderSSR(el.content, ctx, data)
        el.replaceWith(rendered)
        return rendered
      }
    }
    
    // Handle x-else-if directive
    if (el.hasAttribute?.('x-else-if')) {
      if (state.pass === undefined) {
        console.warn('[peak-ssr] Invalid x-else-if without preceding x-if')
      }
      
      if (state.pass) {
        el.remove()
        return null
      }
      
      const expr = el.getAttribute('x-else-if')
      const shouldRender = Boolean(evalInSSRContext(ctx, expr, contextData))
      state.pass = shouldRender
      el.removeAttribute('x-else-if')
      
      if (!shouldRender) {
        el.remove()
        return null
      }
      
      if (el.tagName === 'TEMPLATE') {
        const rendered = await renderSSR(el.content, ctx, data)
        el.replaceWith(rendered)
        return rendered
      }
    }
    
    // Handle x-else directive
    if (el.hasAttribute?.('x-else')) {
      if (state.pass === undefined || el.getAttribute('x-else')) {
        console.warn('[peak-ssr] Invalid x-else')
      }
      
      if (state.pass) {
        el.remove()
        return null
      }
      
      if (el.tagName === 'TEMPLATE') {
        const rendered = await renderSSR(el.content, ctx, data)
        el.replaceWith(rendered)
        return rendered
      }
    }
    
    // Handle x-for directive
    if (el.hasAttribute?.('x-for')) {
      const expression = el.getAttribute('x-for')
      const match = expression.match(/^\s*(\w+)\s+in\s+(.+)$/)
      
      if (!match) {
        console.warn(`[peak-ssr] Invalid x-for syntax: ${expression}`)
        return el
      }
      
      const [, itemName, itemsExpr] = match
      const items = evalInSSRContext(ctx, itemsExpr, contextData)
      
      const fragment = document.createDocumentFragment()
      
      if (Array.isArray(items)) {
        for (const [index, item] of items.entries()) {
          const clone = document.createElement('template')
          
          if (el.tagName === 'TEMPLATE') {
            clone.innerHTML = el.innerHTML
          } else {
            clone.innerHTML = el.outerHTML
            clone.content.children[0]?.removeAttribute('x-for')
          }
          
          const itemCtx = Object.create(ctx)
          itemCtx[itemName] = item
          itemCtx.index = index
          
          const itemData = { ...data, [itemName]: item, index }
          
          // Render directly instead of recursing
          const tempElement = clone.content.children[0]?.cloneNode(true) || clone.content.cloneNode(true)
          await _render(tempElement, {}, itemData)
          
          // Process any custom components within this loop item with the correct context
          await processCustomComponents(tempElement, itemData)
          
          fragment.appendChild(tempElement)
        }
      }
      
      el.replaceWith(fragment)
      return fragment
    }
    
    // Handle x-show directive (convert to style)
    if (el.hasAttribute?.('x-show')) {
      const expr = el.getAttribute('x-show')
      const shouldShow = Boolean(evalInSSRContext(ctx, expr, contextData))
      
      if (!shouldShow) {
        const currentStyle = el.getAttribute('style') || ''
        el.setAttribute('style', currentStyle + (currentStyle ? '; ' : '') + 'display: none')
      }
      
      el.removeAttribute('x-show')
    }
    
    // Handle attribute bindings
    const attrs = [...(el.attributes || [])]
    for (const attr of attrs) {
      const { name, value } = attr
      
      // Handle :attribute bindings
      if (name.startsWith(':')) {
        const attrName = name.slice(1)
        let attrValue = evalInSSRContext(ctx, value, contextData)
        
        if (attrName === 'class' && typeof attrValue !== 'string') {
          attrValue = clsx(attrValue)
        }
        
        if (typeof attrValue === 'boolean') {
          if (attrValue) {
            el.setAttribute(attrName, attrName) // Boolean attribute
          } else {
            el.removeAttribute(attrName)
          }
        } else if (attrValue != null) {
          el.setAttribute(attrName, String(attrValue))
        }
        
        el.removeAttribute(name)
      }
      
      // Remove event handlers (they won't work in SSR)
      if (name.startsWith('@')) {
        el.removeAttribute(name)
      }
    }
    
    if (el.tagName === 'SLOT') {
      const slottedContent = ctx._slotContent || ''
      if (slottedContent) {
        const tempDiv = document.createElement('div')
        tempDiv.innerHTML = slottedContent

        if (el.parentNode && tempDiv.childNodes.length > 0) {
          for (const child of [...tempDiv.childNodes]) {
            el.parentNode.insertBefore(child, el)
          }
          el.remove()
        }
      }
    }

    // Recursively render children
    const children = [...(el.children || [])]
    const childState = {}
    
    for (const child of children) {
      await _render(child, childState, contextData)
    }
    
    return el
  }
  
  await _render(root, {})
  await processCustomComponents(root, data)
  
  return root
}

async function processCustomComponents(root, contextData) {
  // Find all custom components in the rendered tree
  const customElements = []
  
  function findCustomElements(el) {
    if (el.nodeType === 1 && el.tagName && (el.tagName.startsWith('X-') || el.tagName.includes('-'))) {
      customElements.push(el)
    }
    for (const child of el.children || []) {
      findCustomElements(child)
    }
  }
  
  findCustomElements(root)
  
  // Process each custom component
  for (const el of customElements) {
    await renderCustomComponent(el, contextData)
  }
}

function evalInSSRContext(element, code, data = {}) {
  if (!code) return undefined
  
  try {
    // safe evaluation context
    const context = {
      ...data,
      Math,
      Date,
      String,
      Number,
      Object,
      Array,
      Boolean,
      JSON,
      console,
      clsx
    }
    
    // Create the function with all context properties as parameters
    const contextKeys = Object.keys(context)
    const contextValues = Object.values(context)
    
    const func = new Function(...contextKeys, `return ${code}`)
    return func(...contextValues)
  } catch (error) {
    console.warn(`[peak-ssr] Evaluation error in "${code}":`, error.message)
    return undefined
  }
}

function generateScopedStyles(styleContent, tagName) {
  if (!styleContent.trim()) return ''
  
  return `
    <style data-peak-component="${tagName}">
      @layer ${tagName} {
        ${tagName} {
          ${styleContent}
        }
        ${tagName} [x-scope],
        ${tagName} [x-scope] * {
          all: revert-layer;
        }
      }
    </style>
  `
}

// utility function for class name concatenation
function clsx(...args) {
  const classes = []
  
  for (const arg of args) {
    if (!arg) continue
    
    if (typeof arg === 'string' || typeof arg === 'number') {
      classes.push(String(arg))
    } else if (Array.isArray(arg)) {
      classes.push(clsx(...arg))
    } else if (typeof arg === 'object') {
      for (const [key, value] of Object.entries(arg)) {
        if (value) classes.push(key)
      }
    }
  }

  return classes.join(' ')
}
