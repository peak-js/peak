import { parseHTML } from 'linkedom'

let domSetup = null

export function initializeDOM() {
  if (domSetup) return domSetup

  // create a linkedom document
  const { window, document, customElements, HTMLElement, CustomEvent, Event } = parseHTML(`
    <!doctype html><html><head></head><body></body></html>
  `)

  // DOMParser polyfill
  class DOMParser {
    parseFromString(string, type) {
      return parseHTML(string).document
    }
  }

  // set up global environment
  const globals = { window, document, customElements, HTMLElement, CustomEvent, Event, DOMParser: new DOMParser(), requestAnimationFrame: (cb) => setTimeout(cb, 16), addEventListener: () => {}, history: { pushState: () => {}, replaceState: () => {}, }, location: { pathname: '/', search: '', href: 'http://localhost/' }, console, Math, Date, String, Number, Object, Array, Boolean, JSON, setTimeout, clearTimeout, setInterval, clearInterval }

  // globals expected by peak
  if (!window.__peak) window.__peak = {}
  if (!window.customElements) window.customElements = customElements
  if (!window.HTMLElement) window.HTMLElement = HTMLElement
  if (!window.CustomEvent) window.CustomEvent = CustomEvent
  if (!window.Event) window.Event = Event
  if (!window.DOMParser) window.DOMParser = DOMParser
  if (!window.requestAnimationFrame) window.requestAnimationFrame = globals.requestAnimationFrame
  if (!window.addEventListener) window.addEventListener = globals.addEventListener
  if (!window.history) window.history = globals.history
  if (!window.location) window.location = globals.location
  if (!window.console) window.console = console
  if (!window.Math) window.Math = Math
  if (!window.Date) window.Date = Date
  if (!window.String) window.String = String
  if (!window.Number) window.Number = Number
  if (!window.Object) window.Object = Object
  if (!window.Array) window.Array = Array
  if (!window.Boolean) window.Boolean = Boolean
  if (!window.JSON) window.JSON = JSON
  if (!window.setTimeout) window.setTimeout = setTimeout
  if (!window.clearTimeout) window.clearTimeout = clearTimeout
  if (!window.setInterval) window.setInterval = setInterval
  if (!window.clearInterval) window.clearInterval = clearInterval

  domSetup = { window, document, customElements, HTMLElement, CustomEvent, Event, DOMParser, globals }

  return domSetup
}

export function createDocument(htmlString) {
  return parseHTML(htmlString || `<!doctype html><html><head></head><body></body></html>`).document
}
