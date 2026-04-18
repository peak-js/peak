# Routing

Peak.js includes an optional built-in router that integrates with the History API. The router allows you to create single-page applications (SPAs) with client-side navigation while maintaining clean, bookmarkable URLs.

## Basic Routing Setup

### Router View

First, add the router view component to your HTML, and register views and components:

```html
<!doctype html>
<head>
  <title>My SPA</title>
</head>
<body>
  <nav>
    <a href="/">Home</a>
    <a href="/about">About</a>
    <a href="/contact">Contact</a>
  </nav>

  <!-- matched routes render here -->
  <x-router-view></x-router-view>

  <script type="module">
    import { component, router } from '@peak-js/core'

    // define routes
    router.route('/', '/views/home.html')
    router.route('/about', '/views/about.html')
    router.route('/contact', '/views/contact.html')

    // listen to router events
    router.on('navigation', (detail) => {
      console.log('Navigated to:', detail.url)
    })
    router.on('notFound', (detail) => {
      console.log('Route not found:', detail.url)
    })
  </script>
</body>
```

### Create Route View Components

Route components are just regular Peak.js components:

```html
<!-- views/home.html -->
<template>
  <div class="page">
    <h1>Welcome Home</h1>
    <p>This is the home page of our application.</p>
    <a href="/about">Learn more about us</a>
  </div>
</template>

<script>
export default class {
  initialize() {
    this.visitCount = parseInt(localStorage.getItem('homeVisits') || '0') + 1
    localStorage.setItem('homeVisits', this.visitCount.toString())
  }
}
</script>
```

```html
<!-- views/about.html -->
<template>
  <div class="page">
    <h1>About Us</h1>
    <p>We build amazing applications with Peak.js!</p>
    <p>Current time: <span x-text="currentTime"></span></p>
  </div>
</template>

<script>
export default class {
  initialize() {
    this.currentTime = new Date().toLocaleString()

    // update time every second
    this.timer = setInterval(() => {
      this.currentTime = new Date().toLocaleString()
    }, 1000)
  }

  teardown() {
    clearInterval(this.timer)
  }
}
</script>
```

## Route Parameters

### Dynamic Segments

Define routes with dynamic parameters using the `:param` syntax:

```javascript
// route definitions
router.route('/user/:id', '/views/user-profile.html')
router.route('/blog/:category/:slug', '/views/blog-post.html')
router.route('/shop/:category', '/views/category.html')
```

### Accessing Route Params

Access route `params` and `query` through the `$route` property on the view component:

```html
<!-- views/user-profile.html -->
<template>
  <div class="profile">
    <h1 x-text="user.name || 'loading...'"></h1>
  </div>
</template>

<script>
export default class {
  async mounted() {
    const { id } = this.$route.params
    const { lang } = this.$route.query
    this.user = await fetch(`/api/users/${this.id}?lang=${lang}`)
  }
}
</script>
```

## Search Example

```html
<!-- views/search.html -->
<template>
  <div class="search-page">
    <h1>Search Results</h1>

    <div class="search-form">
      <input x-model="searchQuery" @input="debouncedSearch" placeholder="Search...">
      <select x-model="selectedCategory" @change="query">
        <option value="">All Categories</option>
        <option value="frameworks">Frameworks</option>
        <option value="tools">Tools</option>
        <option value="libraries">Libraries</option>
      </select>
    </div>

    <div class="results">
      <p x-text="`Found ${results.length} results for '${searchQuery}'`"></p>

      <div x-for="result in results" :key="result.id" class="result-item">
        <h3 x-text="result.title"></h3>
        <p x-text="result.description"></p>
      </div>
    </div>

    <div class="pagination">
      <button @click="prevPage" :disabled="currentPage === 1">Previous</button>
      <span x-text="`Page ${this.currentPage} of ${this.totalPages}`"></span>
      <button @click="nextPage" :disabled="currentPage === totalPages">Next</button>
    </div>
  </div>
</template>

<script>
import { route, router } from '@peak-js/core'

export default class {
  initialize() {
    this.searchQuery = route.query.q || ''
    this.selectedCategory = route.query.category || ''
    this.currentPage = parseInt(route.query.page) || 1
    this.results = []
    this.totalPages = 1

    if (this.searchQuery) {
      this.query()
    }
  }

  debouncedSearch() {
    clearTimeout(this.searchTimer)
    this.searchTimer = setTimeout(() => {
      this.query()
    }, 300)
  }

  async query() {
    const params = new URLSearchParams({
      q: this.searchQuery,
      category: this.selectedCategory,
      page: this.currentPage
    })

    // update URL without page reload
    router.replace(`/search?${params}`)

    // perform actual search
    try {
      const response = await fetch(`/api/search?${params}`)
      const data = await response.json()

      this.results = data.results
      this.totalPages = data.totalPages
    } catch (error) {
      console.error('Search failed:', error)
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--
      this.query()
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++
      this.query()
    }
  }
}
</script>
```

## Programmatic Navigation

### router.push()

Navigate to a new route programmatically:

```javascript
// navigate to a new route
router.push('/about')
router.push('/user/123')
router.push('/search?q=peak.js')

// with state object
router.push('/dashboard', { from: 'login' })
```

### router.replace()

Replace the current route without adding to history:

```javascript
// Replace current route (won't create history entry)
router.replace('/login')
```

### Navigation in Components

Use regular `<a>` anchor tags to navigate between views.  If the `href` matches a registered route, then the navigation will happen via `router.push`.  Otherwise, the browser handles the navigation normally.

```html
<template>
  <nav>
    <!-- registered route navigation transparently via router.push -->
    <a href="/about">About</a>

    <!-- route not registered handled natively -->
    <a href="/microsites/upcoming-event">Catalina Wine Mixer 2030</a>
  </nav>
</template>
```
