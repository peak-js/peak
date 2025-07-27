# Server-Side Rendering (SSR)

Peak.js includes built-in server-side rendering for Node.js, via [express](https://expressjs.com/) template engine. SSR allows you to render your components on the server for faster initial page loads and better SEO.

## Why Use SSR?

- **SEO Benefits**: Search engines can crawl your fully rendered HTML
- **Better Performance**: Users see content immediately, before JavaScript loads
- **Accessibility**: Content is available even if JavaScript is disabled
- **Social Media**: Meta tags and content are available for social media previews

## Basic SSR Setup

### 1. Install Dependencies

```bash
npm install peak-ssr express
```

### 2. Create an Express Server

```javascript
// server.js
import express from 'express'
import { renderToString } from 'peak-ssr'
import path from 'path'

const app = express()
const port = 3000

// Serve static files
app.use(express.static('public'))

// Configure SSR
app.engine('html', renderToString)
app.set('view engine', 'html')
app.set('views', path.join(process.cwd(), 'views'))

// Routes
app.get('/', (req, res) => {
  res.render('home', {
    title: 'Welcome to Peak.js',
    user: { name: 'Alice' },
    items: ['apple', 'banana', 'cherry']
  })
})

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`)
})
```

### 3. Create Views and Components

```html
<!-- views/home.html -->
<x-layout>
  <template slot="head">
    <title x-text="title"></title>
    <meta name="description" content="Peak.js SSR Example">
  </template>

  <x-welcome :user="user" />
  <x-item-list :items="items" />
</x-layout>
```

```html
<!-- components/x-layout.html -->
<template>
  <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <slot name="head"></slot>
    </head>
    <body>
      <header>
        <h1>My Peak.js App</h1>
      </header>

      <main>
        <slot></slot>
      </main>

      <footer>
        <p>&copy; 2024 My Company</p>
      </footer>
    </body>
  </html>
</template>
```

```html
<!-- components/x-welcome.html -->
<template>
  <div class="welcome">
    <h2 x-text="`Welcome, ${user.name}!`"></h2>
    <p>Thanks for visiting our site.</p>
  </div>
</template>

<script>
export default class {
  initialize() {
    this.user = this.$prop('user')
  }
}
</script>

<style>
.welcome {
  padding: 20px;
  background: #f0f8ff;
  border-radius: 8px;
  margin-bottom: 20px;
}
</style>
```

## Component Lifecycle in SSR

### Server-Side Lifecycle

Components have special lifecycle methods for server-side rendering:

```html
<script>
export default class {
  // called during SSR before rendering
  ssr() {
    this.serverTime = new Date().toISOString()
    this.userAgent = this.$context.req.headers['user-agent']
  }

  // called when component initializes (both SSR and client)
  initialize() {
    this.clientTime = new Date().toISOString()
  }

  // called only on the client after mounting
  mounted() {
    this.isHydrated = true
  }
}
</script>
```

### Hydration

Components automatically hydrate on the client, preserving server-rendered content while adding interactivity:

```html
<!-- components/x-counter.html -->
<template>
  <div>
    <p x-text="`Count: ${count}`"></p>
    <button @click="increment">+1</button>
    <p x-if="serverRendered" class="note">
      This was rendered on the server at <span x-text="renderTime"></span>
    </p>
  </div>
</template>

<script>
export default class {
  ssr() {
    this.count = 0
    this.renderTime = new Date().toISOString()
    this.serverRendered = true
  }

  initialize() {
    // Preserve server state during hydration
    if (typeof this.count === 'undefined') {
      this.count = 0
    }
  }

  increment() {
    this.count++
  }
}
</script>
```

## Data Fetching

### Server-Side Data Loading

Fetch data during SSR for immediate rendering:

```html
<!-- components/x-user-profile.html -->
<template>
  <div class="profile">
    <div x-if="loading" class="loading">Loading...</div>

    <div x-if="user && !loading">
      <img :src="user.avatar" :alt="user.name">
      <h2 x-text="user.name"></h2>
      <p x-text="user.bio"></p>
    </div>

    <div x-if="error" class="error">
      <p x-text="error"></p>
    </div>
  </div>
</template>

<script>
export default class {

  async ssr() {
    this.loading = true
    this.error = null

    try {
      const response = await fetch(`https://api.example.com/users/${this.userId}`)
      if (!response.ok) throw new Error('Failed to fetch user')

      this.user = await response.json()
      this.loading = false
    } catch (err) {
      this.error = err.message
      this.loading = false
    }
  }

  initialize() {
    this.userId = this.$prop('userId')

    // Client-side fallback if SSR data isn't available
    if (!this.user && !this.loading && !this.error) {
      this.loadUser()
    }
  }

  async loadUser() {
    // Same loading logic for client-side
    this.loading = true
    // ... fetch logic
  }
}
</script>
```

