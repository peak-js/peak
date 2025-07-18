# Components

Components are the building blocks of Peak.js applications. They encapsulate HTML, CSS, and JavaScript into reusable, self-contained units that can be composed together to build complex user interfaces.

## Component Structure

A Peak.js component is a single HTML file with three optional sections:

```html
<!-- components/x-example.html -->
<template>
  <!-- HTML template goes here -->
</template>

<script>
  // JavaScript class goes here
  export default class {
    // Component logic
  }
</script>

<style>
  /* CSS styles go here */
</style>
```

### Template Section

The `<template>` contains the component's HTML structure:

```html
<template>
  <div class="card">
    <header>
      <h2 x-text="title"></h2>
      <button @click="toggle" x-text="isExpanded ? 'Collapse' : 'Expand'"></button>
    </header>
    
    <main x-show="isExpanded" x-transition>
      <slot></slot>
    </main>
  </div>
</template>
```

### Script Section

The `<script>` contains the component's JavaScript logic:

```html
<script>
export default class {
  // Define accepted props
  static props = ['title', 'expanded']
  
  // Initialize component state
  initialize() {
    this.isExpanded = this.expanded || false
  }
  
  // Component methods
  toggle() {
    this.isExpanded = !this.isExpanded
    this.$emit('toggle', { expanded: this.isExpanded })
  }
  
  // Lifecycle hooks
  mounted() {
    console.log('Component mounted')
  }
  
  teardown() {
    console.log('Component destroyed')
  }
}
</script>
```

### Style Section

The `<style>` contains component-scoped CSS:

```html
<style>
.card {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
}

.card header {
  padding: 16px;
  background: #f8fafc;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card main {
  padding: 16px;
}

/* Styles are automatically scoped to this component */
button {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}
</style>
```

## Component Registration

Register components using the `component()` function:

```javascript
import { component } from './peak.js'

// Register a single component
component('x-card', './components/x-card.html')

// Register multiple components
component('x-button', './components/x-button.html')
component('x-modal', './components/x-modal.html')
component('x-form', './components/x-form.html')
```

## Props

### Defining Props

Use the static `props` array to define accepted props:

```html
<!-- components/x-user-card.html -->
<template>
  <div class="user-card">
    <img :src="user.avatar" :alt="user.name">
    <h3 x-text="user.name"></h3>
    <p x-text="user.email"></p>
    <span :class="`status ${user.status}`" x-text="user.status"></span>
    <button x-show="showActions" @click="editUser">Edit</button>
  </div>
</template>

<script>
export default class {
  static props = ['user', 'showActions']
  
  initialize() {
    // Props are automatically available
    console.log('User:', this.user)
    console.log('Show actions:', this.showActions)
  }
  
  editUser() {
    this.$emit('edit', this.user)
  }
}
</script>
```

### Using Props

Pass props using attributes:

```html
<!-- static props -->
<x-user-card :user="currentUser" show-actions="true" />

<!-- dynamic props -->
<x-user-card
  :user="user"
  :show-actions="user.id === currentUser.id"
/>

<!-- loop with props -->
<x-user-card
  x-for="user in users"
  :key="user.id"
  :user="user"
  :show-actions="canEdit(user)"
  @edit="handleEditUser">
/>
```

### Prop Validation

Validate props in the component:

```html
<script>
export default class {
  static props = ['count', 'type', 'config']

  initialize() {
    // validate required props
    if (!this.count) {
      console.warn('x-counter: count prop is required')
    }

    // validate prop types
    if (typeof this.count !== 'number') {
      console.warn('x-counter: count must be a number')
    }

    // set defaults
    this.type = this.type || 'default'
    this.config = this.config || {}
  }
}
</script>
```

## Lifecycle Methods

### initialize()

Called when the component is first created, before mounting:

```html
<script>
export default class {
  initialize() {
    // set initial state
    this.count = 0
    this.items = []

    // set up watchers
    this.$watch('count', () => {
      console.log('Count changed:', this.count)
    })

    // initialize external libraries
    this.setupAnalytics()
  }

  setupAnalytics() {
    // initialize analytics that don't need DOM
    this.analytics = new Analytics({
      userId: this.userId,
      component: 'x-counter'
    })
  }
}
</script>
```

### mounted()

Called after the component is mounted to the DOM:

```html
<script>
export default class {
  async mounted() {
    // DOM is available here
    console.log('Component element:', this)

    // access refs
    if (this.$refs.canvas) {
      this.initializeChart()
    }

    // set up DOM event listeners
    this.setupKeyboardShortcuts()

    // load initial data
    await this.loadData()

    // Initialize third-party libraries that need DOM
    this.initializeLibraries()
  }

  initializeChart() {
    const ctx = this.$refs.canvas.getContext('2d')
    this.chart = new Chart(ctx, this.chartConfig)
  }

  setupKeyboardShortcuts() {
    document.addEventListener('keydown', this.handleKeydown.bind(this))
  }

  async loadData() {
    this.loading = true
    try {
      this.data = await fetch('/api/data').then(r => r.json())
    } finally {
      this.loading = false
    }
  }
}
</script>
```

### teardown()

Called when the component is removed from the DOM:

```html
<script>
export default class {
  initialize() {
    this.timers = []
    this.eventListeners = []
  }

  mounted() {
    // set up timer
    const timer = setInterval(() => {
      this.updateTime()
    }, 1000)
    this.timers.push(timer)

    // set up event listener
    const listener = this.handleResize.bind(this)
    window.addEventListener('resize', listener)
    this.eventListeners.push({ event: 'resize', listener })
  }

  teardown() {
    // clean up timers
    this.timers.forEach(timer => clearInterval(timer))

    // clean up event listeners
    this.eventListeners.forEach(({ event, listener }) => {
      window.removeEventListener(event, listener)
    })

    // clean up third-party libraries
    if (this.chart) {
      this.chart.destroy()
    }

    // cancel ongoing requests
    if (this.abortController) {
      this.abortController.abort()
    }

    console.log('Component cleaned up')
  }
}
</script>
```

## Communication Between Components

### Parent to Child (Props)

Pass data down through props:

```html
<!-- parent component -->
<template>
  <div>
    <x-search-form @search="handleSearch"></x-search-form>
    <x-results-list :results="searchResults" :loading="isLoading"></x-results-list>
  </div>
</template>

<script>
export default class {
  initialize() {
    this.searchResults = []
    this.isLoading = false
  }

  async handleSearch(query) {
    this.isLoading = true
    this.searchResults = await this.performSearch(query)
    this.isLoading = false
  }
}
</script>
```

### Child to Parent (Events)

Use custom events to communicate up:

```html
<!-- child component -->
<template>
  <form @submit.prevent="handleSubmit">
    <input x-model="query" placeholder="Search...">
    <button type="submit">Search</button>
  </form>
</template>

<script>
export default class {
  initialize() {
    this.query = ''
  }

  handleSubmit() {
    if (this.query.trim()) {
      this.$emit('search', this.query.trim())
    }
  }
}
</script>
```

### Sibling Communication (Event Bus)

For components that aren't directly related:

```javascript
// utils/event-bus.js
class EventBus {
  constructor() {
    this.events = {}
  }
  on(event, callback) {
    if (!this.events[event]) {
      this.events[event] = []
    }
    this.events[event].push(callback)
  }
  emit(event, data) {
    if (this.events[event]) {
      this.events[event].forEach(callback => callback(data))
    }
  }
  off(event, callback) {
    if (this.events[event]) {
      this.events[event] = this.events[event].filter(cb => cb !== callback)
    }
  }
}

export const eventBus = new EventBus()
```

```html
<!-- Component A -->
<script>
import { eventBus } from '../utils/event-bus.js'

export default class {
  sendMessage() {
    eventBus.emit('message', { text: 'Hello from Component A!' })
  }
}
</script>
```

```html
<!-- Component B -->
<script>
import { eventBus } from '../utils/event-bus.js'

export default class {
  initialize() {
    this.messages = []

    // listen for messages
    this.messageHandler = (data) => {
      this.messages.push(data)
    }
    eventBus.on('message', this.messageHandler)
  }

  teardown() {
    // clean up listener
    eventBus.off('message', this.messageHandler)
  }
}
</script>
```


## Advanced Component Patterns

### Higher-Order Components

Create components that wrap other components:

```html
<!-- components/x-with-loading.html -->
<template>
  <div class="loading-wrapper">
    <div x-show="loading" class="loading-spinner">
      <div class="spinner"></div>
      <p>Loading...</p>
    </div>
    
    <div x-show="!loading">
      <slot></slot>
    </div>
  </div>
</template>

<script>
export default class {
  static props = ['loading']
  
  initialize() {
    this.loading = this.loading || false
  }
}
</script>
```

Usage:
```html
<x-with-loading :loading="isLoadingData">
  <x-data-table :data="tableData"></x-data-table>
</x-with-loading>
```

### Render Props Pattern

Components that provide data to their children:

```html
<!-- components/x-data-provider.html -->
<template>
  <div>
    <slot :data="data" :loading="loading" :error="error" :refresh="refresh"></slot>
  </div>
</template>

<script>
export default class {
  static props = ['url']
  
  initialize() {
    this.data = null
    this.loading = false
    this.error = null
    
    this.loadData()
  }
  
  async loadData() {
    this.loading = true
    this.error = null
    
    try {
      const response = await fetch(this.url)
      this.data = await response.json()
    } catch (error) {
      this.error = error.message
    } finally {
      this.loading = false
    }
  }
  
  refresh() {
    this.loadData()
  }
}
</script>
```

### Compound Components

Components that work together as a unit:

```html
<!-- components/x-tabs.html -->
<template>
  <div class="tabs">
    <div class="tab-list">
      <slot name="tabs"></slot>
    </div>
    <div class="tab-panels">
      <slot name="panels"></slot>
    </div>
  </div>
</template>

<script>
export default class {
  initialize() {
    this.activeTab = 0
  }
  
  setActiveTab(index) {
    this.activeTab = index
    this.$emit('tab-change', { index })
  }
}
</script>
```

```html
<!-- components/x-tab.html -->
<template>
  <button 
    class="tab" 
    :class="{ active: isActive }" 
    @click="activate">
    <slot></slot>
  </button>
</template>

<script>
export default class {
  static props = ['index']
  
  get isActive() {
    return this.parentComponent.activeTab === this.index
  }
  
  activate() {
    this.parentComponent.setActiveTab(this.index)
  }
}
</script>
```

## Testing Components

### Unit Testing

Test component logic in isolation:

```javascript
// tests/components/x-counter.test.js
import { describe, it, expect } from 'vitest'
import { mount } from '@peak/test-utils'

describe('x-counter', () => {
  it('increments count when button is clicked', async () => {
    const wrapper = mount('x-counter')
    expect(wrapper.text()).toContain('0')
    await wrapper.find('button[data-action="increment"]').click()
    expect(wrapper.text()).toContain('1')
  })

  it('accepts initial count prop', () => {
    const wrapper = mount('x-counter', {
      props: { count: 5 }
    })
    expect(wrapper.text()).toContain('5')
  })

  it('emits change event when count changes', async () => {
    const wrapper = mount('x-counter')
    await wrapper.find('button[data-action="increment"]').click()
    expect(wrapper.emitted('change')).toBeTruthy()
    expect(wrapper.emitted('change')[0]).toEqual([{ count: 1 }])
  })
})
```

### Integration Testing

Test component interactions:

```javascript
// tests/integration/todo-app.test.js
import { describe, it, expect } from 'vitest'
import { mount } from '@peak/test-utils'

describe('Todo App Integration', () => {
  it('adds and removes todos', async () => {
    const wrapper = mount('x-todo-app')

    // add a todo
    const input = wrapper.find('input[placeholder="Add todo"]')
    const addButton = wrapper.find('button[data-action="add"]')

    await input.setValue('Test todo')
    await addButton.click()

    expect(wrapper.text()).toContain('Test todo')

    // remove the todo
    const removeButton = wrapper.find('button[data-action="remove"]')
    await removeButton.click()

    expect(wrapper.text()).not.toContain('Test todo')
  })
})
```

