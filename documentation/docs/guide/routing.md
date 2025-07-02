# Routing

Peak.js includes an optional built-in router that integrates seamlessly with the History API. The router allows you to create single-page applications (SPAs) with client-side navigation while maintaining clean, bookmarkable URLs.

## Basic Routing Setup

### Router View

First, add the router view component to your HTML, and register views and components:

```html
<!DOCTYPE html>
<html>
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
    import { component, router } from 'peak'

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
</html>
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
// Route definitions
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
      <select x-model="selectedCategory" @change="performSearch">
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
      <span x-text="`Page ${currentPage} of ${totalPages}`"></span>
      <button @click="nextPage" :disabled="currentPage === totalPages">Next</button>
    </div>
  </div>
</template>

<script>
import { route, router } from 'peak'

export default class {
  initialize() {
    this.searchQuery = route.query.q || ''
    this.selectedCategory = route.query.category || ''
    this.currentPage = parseInt(route.query.page) || 1
    this.results = []
    this.totalPages = 1

    if (this.searchQuery) {
      this.performSearch()
    }
  }

  debouncedSearch() {
    clearTimeout(this.searchTimer)
    this.searchTimer = setTimeout(() => {
      this.performSearch()
    }, 300)
  }

  async performSearch() {
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
      this.performSearch()
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++
      this.performSearch()
    }
  }
}
</script>
```

## Programmatic Navigation

### router.push()

Navigate to a new route programmatically:

```javascript
// Navigate to a new route
router.push('/about')
router.push('/user/123')
router.push('/search?q=peak.js')

// With state object
router.push('/dashboard', { from: 'login' })
```

### router.replace()

Replace the current route without adding to history:

```javascript
// Replace current route (won't create history entry)
router.replace('/login')
```

### Navigation in Components

```html
<template>
  <div class="auth-form">
    <form @submit.prevent="handleLogin">
      <input x-model="email" type="email" required>
      <input x-model="password" type="password" required>
      <button type="submit" :disabled="loading">
        <span x-show="!loading">Login</span>
        <span x-show="loading">Logging in...</span>
      </button>
    </form>

    <p>Don't have an account? <a href="#" @click.prevent="goToSignup">Sign up</a></p>
  </div>
</template>

<script>
import { router } from 'peak'

export default class {
  initialize() {
    this.email = ''
    this.password = ''
    this.loading = false
  }

  async handleLogin() {
    this.loading = true

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: this.email,
          password: this.password
        })
      })

      if (response.ok) {
        const { token, user } = await response.json()
        localStorage.setItem('token', token)

        // Redirect to dashboard
        router.push('/dashboard')
      } else {
        this.error = 'Invalid credentials'
      }
    } catch (error) {
      this.error = 'Login failed'
    } finally {
      this.loading = false
    }
  }

  goToSignup() {
    router.push('/signup')
  }
}
</script>
```

## Route Guards

### Navigation Guards

Implement route guards for authentication and authorization:

```javascript
// Global navigation guard
router.on('beforeNavigation', (detail) => {
  const { url } = detail
  const isAuthenticated = localStorage.getItem('token')

  // Protected routes
  const protectedRoutes = ['/dashboard', '/profile', '/admin']
  const isProtectedRoute = protectedRoutes.some(route => url.startsWith(route))

  if (isProtectedRoute && !isAuthenticated) {
    // Prevent navigation and redirect to login
    detail.preventDefault()
    router.replace('/login?redirect=' + encodeURIComponent(url))
  }
})

// Admin only routes
router.on('beforeNavigation', (detail) => {
  const { url } = detail
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  if (url.startsWith('/admin') && user.role !== 'admin') {
    detail.preventDefault()
    router.replace('/unauthorized')
  }
})
```

### Component-Level Guards

Implement guards within route components:

```html
<!-- views/admin-dashboard.html -->
<script>
import { router } from 'peak'

export default class {
  initialize() {
    // Check authorization before rendering
    if (!this.isAuthorized()) {
      router.replace('/unauthorized')
      return
    }

    this.loadDashboardData()
  }

  isAuthorized() {
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    return user.role === 'admin'
  }

  async loadDashboardData() {
    // load admin data
  }
}
</script>
```

## Nested Routes

Create nested route structures for complex applications:

```javascript
router.route('/', '/views/home.html')
router.route('/dashboard', '/views/dashboard/layout.html')
router.route('/dashboard/overview', '/views/dashboard/overview.html')
router.route('/dashboard/users', '/views/dashboard/users.html')
router.route('/dashboard/settings', '/views/dashboard/settings.html')
```

```html
<!-- views/dashboard/layout.html -->
<template>
  <div class="dashboard">
    <aside class="sidebar">
      <nav>
        <a href="/dashboard/overview" :class="{ active: isActive('/dashboard/overview') }">
          Overview
        </a>
        <a href="/dashboard/users" :class="{ active: isActive('/dashboard/users') }">
          Users
        </a>
        <a href="/dashboard/settings" :class="{ active: isActive('/dashboard/settings') }">
          Settings
        </a>
      </nav>
    </aside>

    <main class="content">
      <!-- Nested router view for dashboard routes -->
      <x-router-view></x-router-view>
    </main>
  </div>
</template>

<script>
import { route } from 'peak'

export default class {
  isActive(path) {
    return route.path === path
  }
}
</script>
```

## Route Transitions

Add smooth transitions between routes:

```css
/* Global transition styles */
.page-enter {
  opacity: 0;
  transform: translateY(20px);
}

.page-enter-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.page-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.page-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}
```

```javascript
// add transition classes to router view
router.on('beforeNavigation', () => {
  const routerView = document.querySelector('x-router-view')
  routerView.classList.add('page-leave-active')
})

router.on('navigation', () => {
  const routerView = document.querySelector('x-router-view')
  routerView.classList.remove('page-leave-active')
  routerView.classList.add('page-enter', 'page-enter-active')

  setTimeout(() => {
    routerView.classList.remove('page-enter', 'page-enter-active')
  }, 300)
})
```

