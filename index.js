const parser = new DOMParser
const contexts = new WeakMap
const handlers = {}
const instances = {}
const objs = new WeakMap

export const route = {}

export const router = Object.assign(new EventTarget, {
  _route: route,
  routes: [],
  route(pattern, tagName) {
    const params = []
    const regex = new RegExp('^' + pattern.replace(/\/:([^\/]+)/g, (_, key) => params.push(key) && '/([^/]+)') + '$')
    this.routes.push({ pattern, tagName, regex, params })
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

  const src = await fetch(path).then(r => r.text())
  const doc = parser.parseFromString(src, 'text/html')
  const _template = doc.querySelector('template')
  const template = document.createElement('div')
  template.innerHTML = `${_template.innerHTML}`
  const style = doc.querySelector('style')?.textContent
  const script = doc.querySelector('script')?.textContent 
  const _class = await loadModule(script, path)

  const instance = new (_class || new Function)

  class _constructor extends HTMLElement {
    constructor() {
      super()
      this._pk = Math.random().toString().slice(2)
      instances[this._pk] = this
      this._state = Object.create(null)
      this.initialize?.()
    }
    connectedCallback() {
      for (const key of Object.keys(this)) {
        this._defineReactiveProperty(key, this[key])
      }
      this.render()
      this.mounted?.()
    }
    disconnectedCallback() {
      delete(instances[this._pk]) 
      this.destroyed?.()
    }
    render() {
      _contextId = this._pk
      const rendered = render(template, this)
      morph(this, rendered)
    }
    _defineReactiveProperty(prop, initialValue) {
      if ((prop in this._state) || prop.startsWith('_')) return

      _contextId = this._pk
      this._state[prop] = observable(initialValue)

      Object.defineProperty(this, prop, {
        configurable: true,
        enumerable: true,
        get: () => this._state[prop],
        set: (val) => {
          this._state[prop] = val;
          this.render();
        }
      })
    }
  }

  Object.getOwnPropertyNames(_class.prototype)
    .filter(n => n != 'constructor')
    .forEach(n => Object.defineProperty(_constructor.prototype, n,
      Object.getOwnPropertyDescriptor(_class.prototype, n)))

  customElements.define(tagName, _constructor)

  const scopedStyle = `
    <style>
      @layer ${tagName} {
        ${tagName} {
          ${style};
        }
        ${tagName} [x-data],
        ${tagName} [x-data] * {
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
  route() {
    const { route, params } = this.match() || {}
    if (!route) {
      console.warn("[peak] no route found:", window.location.pathname)
      router.emit('notFound', { url: window.location.pathname })
      return
    }
    const query = Object.fromEntries(new URLSearchParams(location.search));
    const { tagName } = route
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
      // Default import
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
  function _render(el) {
    if (!el.children.length && el.hasAttribute('x-text')) {
      el.textContent = evalInContext(ctx, el.getAttribute('x-text'))
      el.removeAttribute('x-text')
    }
    if (!el.children.length && el.hasAttribute('x-html')) {
      el.innerHTML = evalInContext(ctx, el.getAttribute('x-html'))
      el.removeAttribute('x-html')
    }
    if (el.hasAttribute('x-if')) {
      const shouldRender = evalInContext(ctx, el.getAttribute('x-if'))
      if (!shouldRender) return
    }
    if (el.hasAttribute('x-for')) {
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
        const clone = document.createElement('div')
        clone.innerHTML = `${el.innerHTML}`
        const itemCtx = Object.create(ctx)
        itemCtx[itemName] = item
        itemCtx.index = index
        const rendered = render(clone, itemCtx)
        for (const c of rendered.children) {
          fragment.append(c)
        }
      })

      el.replaceWith(fragment)
      return
    }
    if (el.hasAttribute('x-ref')) {
      ctx.$refs ||= {}
      ctx.$refs[el.getAttribute('x-ref')] = el
    }
    if (el.hasAttribute('x-show')) {
      const shouldShow = evalInContext(ctx, el.getAttribute('x-show'))
      el.style.display = shouldShow ? null : 'none'
    }

    const attrs = []
    for (const a of el.attributes) {
      attrs.push({ name: a.name, value: a.value })
    }

    for (const a of attrs) {
      if (a.name.startsWith(':')) {
        const name = a.name.slice(1)
        const value = evalInContext(ctx, a.value)
        if (typeof value != 'object') {
          el.setAttribute(name, value)
        } else {
          const objId = getObjId(value)
          el.setAttribute(name, `:${objId}`)
          console.log("SETVAL", el, name, value)
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
    for (const c of [...el.children]) {
      if (!_render(c)) moribund.push(c)
    }
    moribund.forEach(c => c.remove())
    return el
  }
  return _render(root)
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
      try {
        if (value in ctx) value += '()'
        evalInContext(ctx, value, event)
        if (event.defaultPrevented || event.cancelBubble) break
      } catch (err) {
        console.error(err)
      }
    }
    target = target.parentElement
  }
}


function morph(l, r, attr) {
  let ls = 0, rs = 0, le = l.childNodes.length, re = r.childNodes.length
  const lc = [...l.childNodes], rc = [...r.childNodes]
  const content = e => {
    if (e.nodeType == 3) return e.textContent
    if (isCustom(e)) {
      return `<${e.tagName} ${[...e.attributes].map(x => `${x.name}=${x.value}`).join(' ')} />` 
    } 
    return e.outerHTML
  }

  const isCustom = e => customElements.get(e.tagName?.toLowerCase())
  const key = e => isCustom(e) ? `${e.tagName}:${e.getAttribute('key')}` : NaN;

  if (attr) {
    for (const a of [...r.attributes || []])
      if (l.getAttribute(a.name) != a.value) l.setAttribute(a.name, a.value)

    for (const a of [...l.attributes || []])
      if (!r.hasAttribute(a.name)) l.removeAttribute(a.name)
  }

  while (ls < le || rs < re)
    if (ls == le) {
      //console.log("LOUT")
      l.insertBefore(lc.find(c => key(c) == key(rc[rs])) || rc[rs], lc[ls]) && rs++
    }
    else if (rs == re) {
      //console.log("ROUT")
      l.removeChild(lc[ls++])
    }
    else if (content(lc[ls]) == content(rc[rs])) {
      //console.log("CMATCH", content(lc[ls]))
      ls++ & rs++
    }
    else if (content(lc[le - 1]) == content(rc[re - 1])) {
      //console.log("CMATCH REVERSE", content(lc[le - 1]))
      le-- & re--
    }
    else if (lc[ls] && rc[rs].children && lc[ls].tagName == rc[rs].tagName) {
      //console.log("MORPH", content(lc[ls]), content(rc[rs]))
      rc[rs].render?.()
      morph(lc[ls++], rc[rs++], true)
    }
    else {
      //console.log("REPLACE")
      lc[ls++].replaceWith(rc[rs++].cloneNode(true))
    }
} 

function evalInContext(element, code, ...args) {

  if (!code.match(/[\`\"\'\{\$]/)) { //`
    code = code.replace(
      /(?<![\w$.])\b([a-zA-Z_$][a-zA-Z0-9_$]*)\b(?=\s*(?:[^\w$\s]|$))/g,
      (match, identifier) => {
        const keywords = [ 'true', 'false', 'null', 'undefined', 'NaN', 'Infinity', 'Math', 'Date', 'String', 'Number', 'Object', 'Array', 'console', 'window', 'document', 'JSON', 'new', 'typeof', 'instanceof', 'this', 'event' ]
        if (keywords.includes(identifier)) return match
        return `this.${identifier}`
      }
    )
  }

  try {
    return new Function(`return ${code}`).call(element, ...args);
  } catch(e) { console.warn(e) }
}

let _contextId
const deps = {}

function notify(path) {
  for (const id in deps[path] || {}) {
    setTimeout(_ => deps[path][id]())
  }
}

function dep(path) {
  dep._path = !_contextId && path
  if (!_contextId) return true
  const contextId = _contextId
  deps[path] ||= {}
  return deps[path][_contextId] = () => {
    instances[contextId]?.render()
  }
}

function observable(x, path = Math.random().toString(36).slice(2)) {
  if ((typeof x != 'object' || x === null) && dep(path)) return x
  return new Proxy(x, {
    set(x, key) {
      return notify(path + '/' + key) || Reflect.set(...arguments);
    },
    get(x, key) {
      return x.__target__ ? x[key]
        : typeof key == "symbol" ? Reflect.get(...arguments)
        : (key in x.constructor.prototype && dep(path + '/' + key)) ? x[key]
        : (key == '__target__') ? x
        : observable(x[key], path + '/' + key);
    }
  });
}

function getObjId(o) {
  o = o.__target__ || o
  if (!objs.has(o)) {
    console.log("NO", o)
    objs.set(o, Math.random().toString(36).slice(2))
  }
  return objs.get(o)
}

window.getObjId = getObjId
