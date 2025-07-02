# Build & Deploy

While Peak.js works great without any build step, you may want to use build tools for production optimizations, bundling, or integration with existing workflows. This guide covers various deployment strategies and build tool integrations.

## No-Build Deployment

### Simple Static Hosting

The simplest way to deploy a Peak.js app is as static files:

```
my-app/
├── index.html
├── peak.js
├── components/
│   ├── x-header.html
│   ├── x-footer.html
│   └── x-nav.html
├── views/
│   ├── home.html
│   └── about.html
└── assets/
    ├── styles.css
    └── images/
```

## Vite Integration

Build with Vite in order to serve an optimized bundle for production, and to get HMR in dev.

### Setup

For development and build optimizations, integrate with Vite:

```bash
npm init vite@latest my-peak-app -- --template vanilla
cd my-peak-app
npm install
npm install peak-js
```

### Vite Configuration

```javascript
// vite.config.js
import { defineConfig } from 'vite'
import peakPlugin from 'peak-js/vite-plugin'

export default defineConfig({
  plugins: [
    peakPlugin({
      // auto-register components from these directories
      componentDirs: ['src/components', 'src/widgets'],

      // enable hot module replacement for components
      hmr: true,

      // generate TypeScript definitions
      generateTypes: true
    })
  ],

  build: {
    outDir: 'dist',
    sourcemap: true,
    minify: 'terser',

    rollupOptions: {
      input: {
        main: './index.html',
        admin: './admin.html'
      }
    }
  },

  server: {
    port: 3000,
    open: true
  }
})
```

### Component Auto-Registration

With the Vite plugin, components are automatically registered:

```javascript
// main.js
import 'virtual:peak-components' // Auto-registers all components
import { router } from 'peak-js'

// Define routes
router.route('/', '/views/home.html')
router.route('/about', '/views/about.html')
```

### Hot Module Replacement

The Vite plugin enables HMR for components:

```javascript
// vite.config.js
export default defineConfig({
  plugins: [
    peakPlugin({
      hmr: {
        enabled: true,
        // preserve component state during updates
        preserveState: true,
        // custom HMR handler
        onUpdate: (componentName) => {
          console.log(`Component ${componentName} updated`)
        }
      }
    })
  ]
})
```

## Production Optimizations

### Component Bundling

Bundle components for better caching:

```javascript
// build/bundle-components.js
import { bundleComponents } from 'peak-js/bundler'

const components = await bundleComponents({
  input: 'src/components/**/*.html',
  output: 'dist/components.bundle.js',

  // Optimization options
  minify: true,
  treeshake: true,
  splitChunks: true
})

console.log(`Bundled ${components.length} components`)
```

### Code Splitting

Split components by route or feature:

```javascript
// Router with dynamic imports
import { router } from 'peak-js'

router.route('/', () => import('./views/home.html'))
router.route('/admin', () => import('./views/admin/dashboard.html'))
router.route('/shop', () => import('./views/shop/catalog.html'))
```

### Asset Optimization

Optimize images and other assets:

```javascript
// vite.config.js
import { defineConfig } from 'vite'
import { imageOptimize } from 'vite-plugin-imagemin'

export default defineConfig({
  plugins: [
    imageOptimize({
      gifsicle: { optimizationLevel: 7 },
      mozjpeg: { quality: 80 },
      pngquant: { quality: [0.65, 0.8] },
      svgo: {
        plugins: [
          { name: 'removeViewBox', active: false }
        ]
      }
    })
  ]
})
```

## Server-Side Rendering (SSR)

### Express.js Setup

```javascript
// server.js
import express from 'express'
import { renderToString } from 'peak/ssr'

const app = express()

app.engine('html', renderToString)
app.set('view engine', 'html')
app.set('views', './views')

app.use('/assets', express.static('dist/assets'))

app.get('/', (req, res) => {
  res.render('home', {
    title: 'Home Page',
    user: req.user
  })
})

app.get('/api/data', (req, res) => {
  res.json({ message: 'Hello from API' })
})

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000')
})
```

