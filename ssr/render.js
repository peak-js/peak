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

  // run initialize lifecycle method first to set defaults
  if (typeof instance.initialize === 'function') {
    instance.initialize()
  }

  // merge data into instance AFTER running initialize()
  // This ensures props override defaults set in initialize()
  for (const [key, value] of Object.entries(data)) {
    instance[key] = value
  }

  // run SSR lifecycle method if it exists
  if (typeof instance.ssr === 'function') {
    await instance.ssr()
  }

  // detect if this is a full HTML document (contains <html> tag)
  const isFullDocument = component.template.includes('<html')

  // detect if the top-level element is a layout component
  const layoutMatch = component.template.trim().match(/^\s*<(x-[^>\s]+)/i)
  const isLayoutWrapper = layoutMatch && layoutMatch[1].includes('layout')

  if (isLayoutWrapper) {
    // this view wraps a layout component - render the layout directly
    const layoutTagName = layoutMatch[1]
    return await renderLayoutWrapper(component, instance, data, layoutTagName, options)
  }

  let rendered, styles

  if (isFullDocument) {
    // for full HTML documents, we need to parse the entire document differently
    // create a document fragment to hold the HTML
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = component.template

    // find the html element
    const htmlEl = tempDiv.querySelector('html')

    if (htmlEl) {
      // set component directories if provided
      if (options.componentDirs) {
        componentDirs = options.componentDirs
      }

      // render the HTML element directly
      rendered = await renderSSR(htmlEl, instance, instance)

      // for full documents, inject styles into the head if they exist
      if (component.style) {
        const head = rendered.querySelector('head')
        if (head) {
          const styleEl = document.createElement('style')
          styleEl.setAttribute('data-peak-component', component.tagName)
          styleEl.textContent = component.style
          head.appendChild(styleEl)
        }
      }

      // return the full HTML document as a string (no wrapper div)
      return {
        html: `<!DOCTYPE html>\n${rendered.outerHTML}`,
        styles: '', // styles already injected
        tagName: component.tagName,
        isFullDocument: true,
        instance
      }
    }
  }

  // for regular components, extract content from template element
  const templateWrapper = document.createElement('div')
  templateWrapper.innerHTML = component.template

  // get the actual template content (skip the <template> wrapper)
  const templateEl = templateWrapper.querySelector('template')
  const template = document.createElement('div')
  if (templateEl && templateEl.content) {
    // clone the template content
    template.appendChild(templateEl.content.cloneNode(true))
  } else {
    // fallback if no template wrapper
    template.innerHTML = component.template
  }

  // set component directories if provided
  if (options.componentDirs) {
    componentDirs = options.componentDirs
  }


  // render the component with SSR context
  rendered = await renderSSR(template, instance, instance)

  // generate scoped styles for regular components
  styles = component.style ? generateScopedStyles(component.style, component.tagName) : ''

  return {
    html: rendered.outerHTML,
    styles,
    tagName: component.tagName,
    instance
  }
}

async function renderLayoutWrapper(component, instance, data, layoutTagName, options) {
  // set component directories if provided
  if (options.componentDirs) {
    componentDirs = options.componentDirs
  }

  // find the layout component file
  let layoutPath = null
  for (const dir of componentDirs) {
    const possiblePath = path.resolve(dir, `${layoutTagName}.html`)
    try {
      fs.accessSync(possiblePath)
      layoutPath = possiblePath
      break
    } catch (e) {
      // File doesn't exist, continue
    }
  }

  if (!layoutPath) {
    console.warn(`[peak-ssr] Layout component not found: ${layoutTagName}`)
    return { html: '', styles: '', tagName: component.tagName }
  }

  // parse the view template to extract slot content and layout props
  const tempDiv = document.createElement('div')
  tempDiv.innerHTML = component.template

  const layoutElement = tempDiv.querySelector(layoutTagName)
  if (!layoutElement) {
    console.warn(`[peak-ssr] Layout element not found in template`)
    return { html: '', styles: '', tagName: component.tagName }
  }

  // extract attributes as props for the layout
  const layoutProps = {}
  for (const attr of [...(layoutElement.attributes || [])]) {
    if (attr.name.startsWith(':')) {
      // dynamic attribute
      const propName = attr.name.slice(1)
      layoutProps[propName] = evalInSSRContext(instance, attr.value, data)
    } else {
      // static attribute
      if (attr.value !== '[object Object]') {
        layoutProps[attr.name] = attr.value
      }
    }
  }

  // capture slot content from inside the layout element and render it
  const slotContent = layoutElement.innerHTML.trim()

  // render the slot content with the view's context first
  const tempSlotDiv = document.createElement('div')
  tempSlotDiv.innerHTML = slotContent
  const renderedSlotDiv = await renderSSR(tempSlotDiv, instance, data)

  const namedSlots = parseNamedSlots(renderedSlotDiv.innerHTML)

  // render the layout component with the view's data and slot content
  const layoutData = {
    ...data,
    ...layoutProps,
    _slotContent: namedSlots.default || '',
    _namedSlots: namedSlots
  }

  return await renderComponent(layoutPath, layoutData, options)
}

function parseNamedSlots(html) {
  const tempDiv = document.createElement('div')
  tempDiv.innerHTML = html

  const slots = {
    default: ''
  }

  const defaultContent = []

  // Process all child nodes
  for (const child of [...tempDiv.childNodes]) {
    if (child.nodeType === 1 && child.tagName === 'TEMPLATE' && child.hasAttribute('slot')) {
      // This is a named slot
      const slotName = child.getAttribute('slot')
      slots[slotName] = child.innerHTML
    } else {
      // This is default slot content
      defaultContent.push(child.outerHTML || child.textContent)
    }
  }

  slots.default = defaultContent.join('')
  return slots
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
      props[propName] = evalInSSRContext(contextData, attr.value, contextData)
    } else {
      // static attribute - skip object strings that can't be parsed
      if (attr.value === '[object Object]') {
        continue // skip unparseable object strings
      }
      props[attr.name] = attr.value
    }
  }

  // capture slot content (innerHTML of the custom element)
  const slotContent = el.innerHTML.trim()

  // parse named slots from the slot content
  const namedSlots = parseNamedSlots(slotContent)

  // render the component with props and slot content
  const componentData = {
    ...contextData,
    ...props,
    _slotContent: namedSlots.default || '',
    _namedSlots: namedSlots
  }


  const result = await renderComponent(componentPath, componentData)

  // parse the rendered HTML to get the actual component element
  const tempDiv = document.createElement('div')
  tempDiv.innerHTML = result.html

  // get the first real element inside the wrapper div (skip text nodes)
  let componentEl = null

  if (result.isFullDocument) {
    // for full documents, we can't embed them in other components
    console.warn(`[peak-ssr] Cannot embed full document component ${tagName} inside another component`)
    return
  }

  for (const child of tempDiv.firstChild?.childNodes || []) {
    if (child.nodeType === 1) { // Element node
      componentEl = child
      break
    }
  }

  if (componentEl) {
    // add hydration data to the original custom element, not the rendered content
    const hydrationData = serializeComponentState(result.instance, componentData)
    if (hydrationData) {
      el.setAttribute('data-peak-ssr', hydrationData)
    }

    // add the original tag name for client-side component registration  
    el.setAttribute('data-peak-component', tagName)

    // replace the content of the custom element with the rendered content
    // but preserve the custom element itself
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

          // Process template directives, then handle custom components with loop context
          await _render(tempElement, {}, itemData)
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
          if (typeof attrValue === 'object') {
            // for objects, don't set as attributes since they'll be available in hydration data
            // just skip setting the attribute to avoid [object Object] strings
          } else {
            el.setAttribute(attrName, String(attrValue))
          }
        }

        el.removeAttribute(name)
      }

      // Remove event handlers (they won't work in SSR)
      if (name.startsWith('@')) {
        el.removeAttribute(name)
      }
    }

    if (el.tagName === 'SLOT') {
      const slotName = el.getAttribute('name') || 'default'
      let slottedContent = ''

      if (slotName === 'default') {
        slottedContent = ctx._slotContent || ''
      } else {
        slottedContent = ctx._namedSlots?.[slotName] || ''
      }

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
      // Skip elements that were already processed (marked with a flag)
      if (!el.hasAttribute('data-ssr-processed')) {
        customElements.push(el)
      }
    }
    for (const child of el.children || []) {
      findCustomElements(child)
    }
  }

  findCustomElements(root)

  // Process each custom component
  for (const el of customElements) {
    el.setAttribute('data-ssr-processed', 'true')
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
    // Filter to only valid JavaScript identifiers and avoid duplicates
    const validKeys = []
    const validValues = []
    const usedKeys = new Set()

    for (const [key, value] of Object.entries(context)) {
      if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) && !usedKeys.has(key)) {
        validKeys.push(key)
        validValues.push(value)
        usedKeys.add(key)
      }
    }

    const func = new Function(...validKeys, `return ${code}`)
    return func(...validValues)
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

function serializeComponentState(instance, componentData) {
  if (!instance) return null

  // collect all component state that should be hydrated
  const state = {}

  // get all enumerable properties from the instance
  for (const key in instance) {
    if (key.startsWith('_') || key.startsWith('$') || typeof instance[key] === 'function') {
      continue // skip private properties, methods, and framework internals
    }

    // skip attributes that are clearly from processing or passed down context
    if (key === 'data-ssr-processed' || key === 'settings' || key === 'cache' || 
        key === 'index' || key === 'todos' || key === 'title') {
      continue
    }

    try {
      // only serialize JSON-serializable values
      const value = instance[key]
      if (value !== undefined && value !== null) {
        JSON.stringify(value) // test if serializable
        state[key] = value
      }
    } catch (e) {
      // skip non-serializable values
      continue
    }
  }

  // only return data if there's something to serialize
  if (Object.keys(state).length === 0) return null

  try {
    return JSON.stringify(state)
  } catch (e) {
    console.warn('[peak-ssr] Failed to serialize component state:', e)
    return null
  }
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
