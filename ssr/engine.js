import path from 'path'
import { renderComponent } from './render.js'

export function createPeakTemplateEngine(options = {}) {
  const {
    componentsDir = 'components',
    viewsDir = 'views',
    cache = process.env.NODE_ENV === 'production',
  } = options
  
  // template engine function that Express will call
  return async function peakTemplateEngine(filePath, templateData, callback) {
    try {
      const absolutePath = path.resolve(filePath)
      const result = await renderComponent(absolutePath, templateData, {
        componentDirs: [componentsDir, viewsDir].filter(Boolean)
      })
      
      let html = result.html
      html = result.styles + '\n' + html
      callback(null, html)
    } catch (error) {
      console.error('[peak-ssr] Template render error:', error)
      callback(error)
    }
  }
}

// helper function to register the Peak template engine with Express
export function registerPeakEngine(app, options = {}) {
  const engine = createPeakTemplateEngine(options)
  
  // register the template engine for .html files
  app.engine('html', engine)
  
  // set the view engine to html if not already set
  if (!app.get('view engine')) {
    app.set('view engine', 'html')
  }
  
  return engine
}

// express middleware to add Peak-specific helpers to response
export function peakMiddleware(options = {}) {
  return function(req, res, next) {
    // add a helper method for rendering Peak components
    res.renderPeak = function(componentPath, data = {}, callback) {
      // merge request data with component data
      const renderData = {
        ...data,
        req,
        res,
        query: req.query,
        params: req.params,
        body: req.body,
        user: req.user
      }
      
      return this.render(componentPath, renderData, callback)
    }
    
    next()
  }
}
