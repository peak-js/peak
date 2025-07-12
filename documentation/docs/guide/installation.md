# Installation

Peak.js is designed to be as simple as possible to get started with. You can use it directly in the browser without any build tools. However, you _can_ build with Vite if you prefer &mdash; for bundling large projects, and/or for the beautiful hot module reloading in dev so you can see changes in browser immediately when you change your code.

## Loading via CDN

The fastest way to try Peak.js is to include it directly from a CDN:

```html
<!doctype html>
<html>
<head>
  <title>My Peak.js App</title>
</head>
<body>
  <x-app></x-app>

  <script type="module">
    import { component } from 'https://unpkg.com/@peak-js/core'

    component('x-app', `
      <template>
        <h1>Hello, Peak.js!</h1>
        <p>You're using version <span x-text="version"></span></p>
      </template>

      <script>
        export default class {
          initialize() {
            this.version = '1.0.0'
          }
        }
      </script>
    `)
  </script>
</body>
</html>
```

## Download and Self-Host

Download Peak.js and host it yourself:

```bash
# Download the latest version
curl -o peak.js https://unpkg.com/@peak-js/core
```

Then include it in your HTML:

```html
<script type="module">
  import { component } from './peak.js'
  // Your app code here
</script>
```

### File Structure

A conventional project structure might look something like this...

```
my-app/
├── index.html
├── peak.js                 # Peak.js library
├── components/             # Your components
│   ├── x-header.html
│   ├── x-nav.html
│   └── x-footer.html
├── views/                  # Page components
│   ├── home.html
│   ├── about.html
│   └── contact.html
├── assets/                 # Static assets
│   ├── styles.css
│   ├── images/
│   └── fonts/
└── scripts/                # Utility scripts
    └── utils.js
```

## Package Manager Installation

### npm

```bash
# Install Peak.js
npm install @peak-js/core

# Install with development dependencies
npm install --save-dev @peak-js/core
```

## Building for Production with Vite

Create a new Vite project with Peak.js:

```bash
# Create project
npm create vite@latest my-peak-app -- --template vanilla
cd my-peak-app

# Install Peak.js
npm install @peak-js/core

# Install Vite plugin
npm install --save-dev @peak-js/vite-plugin
```

Configure Vite:

```javascript
// vite.config.js
import { defineConfig } from 'vite'
import peakPlugin from '@peak-js/vite-plugin'

export default defineConfig({
  plugins: [
    peakPlugin({
      // Auto-register components
      componentDirs: ['src/components'],
      // Enable HMR for components
      hmr: true
    })
  ]
})
```

Make sure to `import virtual:peak-components` built by Vite:

```javascript
<!-- index.html -->
<script type="module">
import "virtual:peak-components"
import { router } from './peak.js'

router.route('/', '/views/home.html')
</script>
```

## Next Steps

Once you have Peak.js installed:

- **Follow the [Quick Start guide](/guide/quick-start)** to build your first component
- **Read the [Components guide](/guide/components)** to understand component architecture
- **Explore [Template Directives](/guide/templates)** for dynamic UI features
- **Learn about [Reactivity](/guide/reactivity)** to build interactive applications

You're now ready to start building with Peak.js! 🚀
