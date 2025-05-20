import Alpine from './alpine.js'
const parser = new DOMParser
window.Alpine = Alpine
Alpine.start()

Alpine.store('global', {})
export const store = Alpine.store('global')

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
  const template = doc.querySelector('template')?.innerHTML
  const style = doc.querySelector('style')?.textContent
  const script = doc.querySelector('script')?.textContent 
  const _class = await loadModule(script, path)

  const key = tagName.replace(/\W/g, '_')

  Alpine.data(key, () => {
    const instance = new (_class || new Function)
    return instance
  })

  class _constructor extends HTMLElement {
    constructor() {
      super()
      this.innerHTML = template
      this.setAttribute('x-data', key)
    }
  }

  customElements.define(tagName, _constructor)

  const scopedStyle = `
    <style>
      @layer ${tagName} {
        ${style};
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
      // Named imports
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
