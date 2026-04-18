# Composition

The `$compose` method allows you to share functionality across components by composing reusable modules. Components will react to composable modules' changing property values, and composable modules can also interact with components' lifecycle methods. This pattern is especially useful for encapsulating common behaviors like mouse tracking, keyboard shortcuts, or data fetching, etc.

## Creating a Composable

A composable is a class that encapsulates reusable functionality:

```javascript
// composable-mouse.js
import { observable } from '@peak-js/core'

export default class {
  constructor(component) {
    this.position = observable({ x: null, y: null })

    const recordPosition = (e) => {
      this.position.x = e.clientX
      this.position.y = e.clientY
    }

    component.$on('mounted', () => {
      document.addEventListener('pointermove', recordPosition)
    })

    component.$on('teardown', () => {
      document.removeEventListener('pointermove', recordPosition)
    })

    return this.position
  }
}
```

## Using $compose in Components

Use `$compose` in your component's `initialize()` method:

```html
<!-- components/mouse-reporter.html -->
<template>
  <div class="card">
    <h2>Mouse Position</h2>
    <div>x: <span x-text="mouse.x"></span></div>
    <div>y: <span x-text="mouse.y"></span></div>
    </div>
  </div>
</template>

<script>
import ComposableMouse from '../lib/composable-mouse.js'

export default class {
  initialize() {
    this.mouse = this.$compose(ComposableMouse)
  }
}
</script>
```

## Composable Patterns

### Data Fetching Composable

```javascript
// composable-fetch.js
import { observable } from '../../peak.js'

export default class {
  constructor(component) {
    const state = observable({
      data: null,
      loading: false,
      error: null
    })

    state.fetch = async (url) => {
      state.loading = true
      state.error = null

      try {
        const response = await fetch(url)
        state.data = await response.json()
      } catch (error) {
        state.error = error.message
      } finally {
        state.loading = false
      }
    }

    return state
  }
}
```

### Local Storage Composable

```javascript
// composable-storage.js
import { observable } from '../../peak.js'

export default class {
  constructor(component) {
    this.get = (key, defaultValue = null) => {
      try {
        const value = localStorage.getItem(key)
        return value ? JSON.parse(value) : defaultValue
      } catch {
        return defaultValue
      }
    }

    this.set = (key, value) => {
      try {
        localStorage.setItem(key, JSON.stringify(value))
      } catch (error) {
        console.warn('Failed to save to localStorage:', error)
      }
    }

    this.remove = (key) => {
      localStorage.removeItem(key)
    }

    return {
      get: this.get,
      set: this.set,
      remove: this.remove
    }
  }
}
```

## Using Multiple Composables

You can compose multiple pieces of functionality in a single component:

```html
<script>
import ComposableMouse from '../lib/composable-mouse.js'
import ComposableFetch from '../lib/composable-fetch.js'
import ComposableStorage from '../lib/composable-storage.js'

export default class {
  initialize() {
    // mix and match composable functionality
    this.mouse = this.$compose(ComposableMouse)
    this.api = this.$compose(ComposableFetch)
    this.storage = this.$compose(ComposableStorage)

    // use composed functionality
    this.loadUserData()
  }

  async loadUserData() {
    const cached = this.storage.get('userData')
    if (cached) {
      this.userData = cached
    } else {
      await this.api.fetch('/api/user')
      if (this.api.data) {
        this.userData = this.api.data
        this.storage.set('userData', this.api.data)
      }
    }
  }
}
</script>
```
