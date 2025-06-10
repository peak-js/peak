const parser = new DOMParser
const contexts = new WeakMap
const handlers = {}
const instances = {}
const objs = new WeakMap

export const route = {}

export const router = Object.assign(new EventTarget, {
  _route: route,
  routes: [],
  route(pattern, path) {
    const tagName = `${slugify(path.replace(/^[^a-z]+|[^a-z]+$|\.html$/g, ''))}-${hsh(path)}`
    const params = []
    const regex = new RegExp('^' + pattern.replace(/\/:([^\/]+)/g, (_, key) => params.push(key) && '/([^/]+)') + '$')
    const loadingPromise = new Promise(async (resolve, reject) => {
      await component(tagName, path)
      resolve()
    })
    this.routes.push({ pattern, tagName, regex, params, loadingPromise })
  },
  push(url, state={}) {
    history.pushState(state, "", url)
  },
  replace(url, state={}) {
    history.replaceState(state, "", url)
  },
  emit(name, detail) {
    this.dispatchEvent(new CustomEvent(name, { detail }))
  },
  on(name, handler) {
    return this.addEventListener(name, handler)
  }
})

export const component = async (tagName, path) => {

  if (!path.startsWith('/')) path = '/' + path
  
  // Use the vite-html-slurper if available
  const slurper = window.getComponentHTML ? window : { getComponentHTML: p => window.__pkcache?.[p] }
  
  const src = slurper.getComponentHTML?.(path) || await fetch(path).then(r => r.text())
  const doc = parser.parseFromString(src, 'text/html')
  const _template = doc.querySelector('template')
  const template = document.createElement('div')
  template.innerHTML = `${_template?.innerHTML || ''}`
  const style = doc.querySelector('style')?.textContent
  const script = doc.querySelector('script')?.textContent
  
  // Use the getComponentClass helper if available
  const _class = window.getComponentClass 
    ? await window.getComponentClass(path, script)
    : (await loadModule(script, path)) || new Function

  const instance = new _class

  class _constructor extends HTMLElement {
    constructor() {
      super()
      this._pk = rand()
      instances[this._pk] = this
      this._state = Object.create(null)
      this._watchers = []
      this.initialize?.()
      this.$emit('initialize')
      for (const key of Object.keys(this)) {
        this._defineReactiveProperty(key, this[key])
      }
      this._initialized = true
      this.setAttribute('x-scope', true);
      
      // Register instance for HMR if the function exists
      if (window.registerComponentInstance) {
        window.registerComponentInstance(this, this.tagName.toLowerCase())
      }
    }
    connectedCallback() {
      for (const [expr, fn] of this._watchers) {
        this.$watch(expr, fn, true)
      }
      this.$render()
      this.$refs = this._refs
      this.mounted?.()
      this.$emit('mounted')
    }
    disconnectedCallback() {
      delete(instances[this._pk])
      this._pkUnregister?.() // Clean up HMR registration if exists
      this.teardown?.()
      this.$emit('teardown')
    }
    $emit(eventType, detail) {
      this.dispatchEvent(new CustomEvent(eventType, { detail, bubbles: true }))
    }
    $on(eventType, handler) {
      this.addEventListener(eventType, handler)
    }
    $watch(expr, fn, deferred) {
      if (!this._initialized || !deferred) {
        this._watchers.push([expr, fn])
      }
      if (this._initialized) {
        _contextId = rand()
        instances[_contextId] = { $render() { fn() } }
        evalInContext(this, expr)
        _contextId = null
      }
    }
    $defer() {
      this._queued ||= requestAnimationFrame(_ => this.$render() || delete this._queued)
    }
    $render() {
      _contextId = this._pk
      this._refs = {}
      const rendered = render(template, this)
      morph(this, rendered)
      _contextId = null
    }
    _defineReactiveProperty(prop, initialValue) {
      if ((prop in this._state) || prop.startsWith('_')) return

      this._state[prop] = observable(initialValue)
      const path = `${this.tagName}/${this._pk}/${prop}`

      Object.defineProperty(this, prop, {
        configurable: true,
        enumerable: true,
        get: () => dep(path) && this._state[prop],
        set: (val) => notify(path) || (this._state[prop] = val)
      })
    }
  }

  Object.getOwnPropertyNames(_class.prototype)
    .filter(n => n != 'constructor')
    .forEach(n => Object.defineProperty(_constructor.prototype, n,
      Object.getOwnPropertyDescriptor(_class.prototype, n)))

  customElements.define(tagName, _constructor)

  const scopedStyle = `
    <style data-peak-component="${tagName}">
      @layer ${tagName} {
        ${tagName} {
          ${style};
        }
        ${tagName} [x-scope],
        ${tagName} [x-scope] * {
          all: revert-layer;
        }
      }
    </style>
  `
  document.head.insertAdjacentHTML('afterbegin', scopedStyle)
}

class routerView extends HTMLElement {
  match() {
    for (const route of router.routes) {
      const match = window.location.pathname.match(route.regex)
      if (!match) continue
      const params = route.params.map((k, i) => [k, match[i + 1]])
      return { route, params: Object.fromEntries(params) }
    }
  }
  async route() {
    const { route, params } = this.match() || {}
    if (!route) {
      console.warn("[peak] no route found:", window.location.pathname)
      router.emit('notFound', { url: window.location.pathname })
      return
    }
    const query = Object.fromEntries(new URLSearchParams(location.search));
    const { tagName, loadingPromise } = route
    await loadingPromise
    for (let k in router._route) delete router.route[k]
    Object.assign(router._route, route, { params, query, path: location.pathname })
    this.innerHTML = `<${tagName}></${tagName}>`
    router.emit('navigation', { url: window.location.pathname })
  }
  handleClick(e) {
    const anchor = e.target.closest('a')
    if (!anchor || anchor.target === '_blank') return
    const url = anchor.getAttribute('href')
    if (!url) return
    if (url.match(/^(http|\/\/|#)/)) return
    if (!this.match(url)) return
    e.preventDefault()
    router.push(url)
  }
  connectedCallback() {
    const _pushState = history.pushState
    const _replaceState = history.replaceState
    history.pushState = (...args) => {
      _pushState.apply(history, args)
      this.route()
    }
    history.replaceState = (...args) => {
      _replaceState.apply(history, args)
      this.route()
    }
    addEventListener('load', _ => this.route())
    addEventListener('popstate', _ => this.route())
    addEventListener('click', this.handleClick.bind(this))
  }
}

customElements.define('x-router-view', routerView)

async function loadModule(source='', url) {
  const baseUrl = new URL(url, window.location.href).href;
  const importStatements = [];
  const importRegex = /import\s+(.+?)\s+from\s+['"](.+?)['"];?/g;

  let match;
  while ((match = importRegex.exec(source))) {
    const [, specifiers, importPath] = match;
    const resolvedPath = new URL(importPath, baseUrl).href;
    importStatements.push({ specifiers, path: resolvedPath });
  }

  const injectedVars = [];
  const injectedValues = [];

  for (const { specifiers, path } of importStatements) {
    const mod = await import(path);

    if (!specifiers.startsWith('{')) {
      injectedVars.push(specifiers.trim());
      injectedValues.push(mod.default);
    } else {
      const names = specifiers
        .replace(/[{}]/g, '')
        .split(',')
        .map(s => s.trim());

      for (const item of names) {
        if (item.includes(' as ')) {
          const [original, alias] = item.split(' as ').map(s => s.trim());
          injectedVars.push(alias);
          injectedValues.push(mod[original]);
        } else {
          injectedVars.push(item);
          injectedValues.push(mod[item]);
        }
      }
    }
  }

  const strippedSource = source.replace(importRegex, '');
  const rewrittenSource = strippedSource.replace(
    /export\s+default\s+class/,
    'return class'
  );

  const factory = new Function(...injectedVars, rewrittenSource);
  return factory(...injectedValues);
}

function render(template, ctx) {
  const root = template.cloneNode(true)
  function _render(el, state) {
    if (el.hasAttribute?.('x-text') && !el.hasAttribute?.('x-for')) {
      el.textContent = evalInContext(ctx, el.getAttribute('x-text'))
      el.removeAttribute('x-text')
    }
    if (el.hasAttribute?.('x-html') && !el.hasAttribute?.('x-for')) {
      el.innerHTML = evalInContext(ctx, el.getAttribute('x-html'))
      el.removeAttribute('x-html')
    }
    if (state.pass !== undefined) {
      if (!el.hasAttribute?.('x-else-if') && !el.hasAttribute?.('x-else')) {
        delete state.pass
      }
    }
    if (el.hasAttribute?.('x-if')) {
      const shouldRender = evalInContext(ctx, el.getAttribute('x-if'))
      state.pass = Boolean(shouldRender)
      el.removeAttribute('x-if')
      if (!shouldRender) return
      if (el.tagName == 'TEMPLATE') {
        el.replaceWith(render(el.content, ctx))
      }
    }
    if (el.hasAttribute?.('x-else-if')) {
      if (state.pass === undefined) console.warn('invalid x-else-if', el)
      if (state.pass) return
      const shouldRender = evalInContext(ctx, el.getAttribute('x-else-if'))
      state.pass = Boolean(shouldRender)
      el.removeAttribute('x-else-if')
      if (!shouldRender) return
      if (el.tagName == 'TEMPLATE') {
        el.replaceWith(render(el.content, ctx))
      }
    }
    if (el.hasAttribute?.('x-else')) {
      if (state.pass === undefined || el.getAttribute('x-else')) {
        console.warn('invalid x-else', el)
      }
      if (state.pass) return
      if (el.tagName == 'TEMPLATE') {
        el.replaceWith(render(el.content, ctx))
      }
    }
    if (el.hasAttribute?.('x-for')) {
      const expression = el.getAttribute('x-for')
      const match = expression.match(/^\s*(\w+)\s+in\s+(.+)$/)
      if (!match) {
        console.warn(`[peak] Invalid x-for syntax: ${expression}`)
        return
      }
      const [, itemName, itemsExpr] = match
      const items = evalInContext(ctx, itemsExpr)

      const fragment = document.createDocumentFragment()

      items.forEach((item, index) => {
        const clone = document.createElement('template')
        if (el.tagName == 'TEMPLATE') {
          clone.innerHTML = el.innerHTML
        } else {
          clone.innerHTML = el.outerHTML
          clone.content.children[0].removeAttribute('x-for')
        }
        const itemCtx = Object.create(ctx)
        itemCtx[itemName] = item
        itemCtx.index = index
        const rendered = render(clone.content, itemCtx)
        for (const c of rendered.children) {
          fragment.append(c)
        }
      })

      el.replaceWith(fragment)
      return
    }
    if (el.hasAttribute?.('x-ref')) {
      ctx._refs[el.getAttribute('x-ref')] = el
    }
    if (el.hasAttribute?.('x-show')) {
      const shouldShow = evalInContext(ctx, el.getAttribute('x-show'))
      el.style.display = shouldShow ? null : 'none'
    }

    const attrs = []
    for (const a of el.attributes || []) {
      attrs.push({ name: a.name, value: a.value })
    }

    for (const a of attrs) {
      if (a.name.startsWith(':')) {
        const name = a.name.slice(1)
        const expr = name == 'class' ? `_pk_clsx(${a.value})` : a.value
        let value = evalInContext(ctx, expr)
        if (typeof value == 'boolean' && isBoolAttr(el, name) && !value) {
          el.removeAttribute(name)
        } else if (typeof value != 'object') {
          if (name == 'class') {
            value = (value || '') + (el.className ? ' ' + el.className : '')
          }
          el.setAttribute(name, value)
        } else {
          const objId = getObjId(value)
          el.setAttribute(name, `$${objId}`)
        }
        el[name] = value
        //el.removeAttribute(a.name)
      }
      if (a.name.startsWith('@')) {
        const eventName = a.name.slice(1)
        listen(eventName, el, ctx)
      }
    }
    const moribund = []
    const _state = {}
    for (const c of [...el.children]) {
      if (!_render(c, _state)) moribund.push(c)
    }
    moribund.forEach(c => c.remove())
    return el
  }
  return _render(root, {})
}

function listen(eventType, el, ctx) {
  contexts.set(el, ctx)
  if (handlers[eventType]) return
  const handler = (e) => handleEvent(e, eventType)
  handlers[eventType] = true
  document.addEventListener(eventType, handler, true)
}

function handleEvent(event, eventType) {
  let target = event.target

  while (target && target !== document) {
    const ctx = contexts.get(target)
    let value = target.getAttribute(`@${eventType}`)

    if (ctx && value) {
      ctx.$event = event
      try {
        if (value in ctx) value += '(event)'
        evalInContext(ctx, value, event)
        if (event.defaultPrevented || event.cancelBubble) break
      } catch (err) {
        console.error(err)
      } finally {
        delete ctx.$event
      }
    }
    target = target.parentElement
  }
}


export function morph(l, r, attr) {
  let ls = 0, rs = 0, le = l.childNodes.length, re = r.childNodes.length
  const lc = [...l.childNodes], rc = [...r.childNodes]
  const content = e => {
    if (e.nodeType == 3) return e.textContent
    if (isCustom(e)) {
      return `<${e.tagName} ${[...e.attributes].filter(x => x.name != 'x-scope').map(x => `${x.name}=${x.value}`).join(' ')} />` 
    } 
    return e.outerHTML
  }

  const isCustom = e => customElements.get(e.tagName?.toLowerCase())
  const key = e => isCustom(e) ? `${e.tagName}:${e.getAttribute('key')}` : NaN
  const compat = e => isCustom(e) ? `${e.tagName}:${e.getAttribute('key')}` : e.tagName
  const render = e => isCustom(e) && customElements.upgrade(e) || e.$render?.()

  if (attr) {
    for (const a of [...r.attributes || []]) {
      if (l.getAttribute(a.name) != a.value) {
        l.setAttribute(a.name, a.value)
        if (isBoolAttr(l, a.name)) l[a.name] = true
      }
    }

    for (const a of [...l.attributes || []]) {
      if (!r.hasAttribute(a.name)) {
        l.removeAttribute(a.name)
        if (isBoolAttr(l, a.name)) l[a.name] = false
      }
    }
  }

  while (ls < le || rs < re) {
    if (ls == le) {
      //console.log("LOUT")
      let match = lc.find((c, i) => key(c) === key(rc[rs]) && i > ls)
      match ||= (match = rc[rs]) || render(rc[rs])
      l.insertBefore(match, lc[ls])
      rs++
    }
    else if (rs == re) {
      //console.log("ROUT")
      l.removeChild(lc[ls++])
    }
    else if (content(lc[ls]) == content(rc[rs])) {
      //console.log("CMATCH")
      ls++ & rs++
    }
    else if (content(lc[le - 1]) == content(rc[re - 1])) {
      //console.log("CMATCH REVERSE")
      le-- & re--
    }
    else if (lc[ls] && rc[rs].children && compat(lc[ls]) == compat(rc[rs])) {
      //console.log("MORPH")
      render(rc[rs])
      morph(lc[ls++], rc[rs++], true)
    }
    else {
      //console.log("REPLACE")
      lc[ls++].replaceWith(rc[rs++].cloneNode(true))
    }
  }
} 

function evalInContext(element, code, ...args) {

  if (!code.match(/[\`\"\'\{\$]/)) { //`
    code = code.replace(
      /(?<![\w$.])\b([a-zA-Z_$][a-zA-Z0-9_$]*)\b(?=\s*(?:[^\w$\s]|$))/g,
      (match, identifier) => {
        const keywords = [ 'true', 'false', 'null', 'undefined', 'NaN', 'Infinity', 'Math', 'Date', 'String', 'Number', 'Object', 'Array', 'Boolean', 'console', 'window', 'document', 'JSON', 'new', 'typeof', 'instanceof', 'this', 'event', '_pk_clsx' ]
        if (keywords.includes(identifier)) return match
        return `this.${identifier}`
      }
    )
  }

  try {
    return new Function('event', '_pk_clsx', `return ${code}`).call(element, args[0], clsx);
  } catch(e) {
    try { var tagName = element.tagName } catch(e) {}
    console.warn(element, tagName, code, e) 
  }
}

let _contextId
const deps = {}

function notify(path) {
  for (const id in deps[path] || {}) {
    setTimeout(_ => deps[path][id]())
  }
}

function dep(path) {
  if (!_contextId) return true
  const contextId = _contextId
  deps[path] ||= {}
  return deps[path][_contextId] = () => {
    instances[contextId]?.$defer?.()
  }
}

function observable(x, path = rand()) {
  if ((typeof x != 'object' || x === null) && dep(path)) return x
  return new Proxy(x, {
    set(x, key) {
      return notify(path + '/' + key) || Reflect.set(...arguments)
    },
    get(x, key) {
      return x.__target__ ? x[key]
        : typeof key == "symbol" ? Reflect.get(...arguments)
        : (key in x.constructor.prototype && dep(path + '/' + key)) ? x[key]
        : (key == '__target__') ? x
        : observable(x[key], path + '/' + key)
    }
  });
}

function clsx() {
  var i=0, tmp, x, str='', len=arguments.length;
  for (; i < len; i++) {
    if (tmp = arguments[i]) {
      if (x = clsxToVal(tmp)) {
        str && (str += ' ');
        str += x
      }
    }
  }
  return str;
}

function clsxToVal(mix) {
  var k, y, str='';

  if (typeof mix === 'string' || typeof mix === 'number') {
    str += mix;
  } else if (typeof mix === 'object') {
    if (Array.isArray(mix)) {
      var len=mix.length;
      for (k=0; k < len; k++) {
        if (mix[k]) {
          if (y = clsxToVal(mix[k])) {
            str && (str += ' ');
            str += y;
          }
        }
      }
    } else {
      for (y in mix) {
        if (mix[y]) {
          str && (str += ' ');
          str += y;
        }
      }
    }
  }

  return str;
}

function getObjId(o) {
  o = o.__target__ || o
  if (!objs.has(o)) objs.set(o, rand())
  return objs.get(o)
}

function rand() {
  return Math.random().toString(36).slice(2)
}

function slugify(str) {
  return str.toLowerCase().replace(/[^\w\-]+/g, '-')
}

function isBoolAttr(el, name) {
  return el.constructor.prototype.hasOwnProperty(name) && typeof el[name] == 'boolean'
}

function hsh(str) {
  return str.split('').reduce((a, b) => (a << 5) - a + b.charCodeAt(0)|0, 0)
}

// Initialize an empty cache if it doesn't exist yet
window.__pkcache = window.__pkcache || {}

export const store = observable({})
