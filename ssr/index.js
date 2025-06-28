import { createPeakTemplateEngine, registerPeakEngine, peakMiddleware } from './engine.js'

export { initializeDOM, createDocument } from './dom.js'
export { loadComponent, parseComponent, clearComponentCache } from './loader.js'
export { renderComponent } from './render.js'

// quick setup function for common use cases
export function setupPeakSSR(app, options = {}) {
  const {
    viewsDir = 'views',
    componentsDir = 'components',
    layout = null,
    cache = process.env.NODE_ENV === 'production',
    middleware = true
  } = options
  
  // set up views directory
  if (viewsDir) {
    app.set('views', viewsDir)
  }
  
  // register the template engine
  const engine = registerPeakEngine(app, {
    componentsDir,
    viewsDir,
    layout,
    cache
  })
  
  // add middleware if requested
  if (middleware) {
    app.use(peakMiddleware(options))
  }
  
  return engine
}

export default setupPeakSSR

export { 
  createPeakTemplateEngine, 
  registerPeakEngine, 
  peakMiddleware 
}

