# Components

Components are the building blocks of Peak.js applications. They encapsulate HTML, CSS, and JavaScript into reusable, self-contained units that can be composed together to build complex user interfaces.

## Component Structure

A Peak.js component is a single HTML file with three optional sections:

```html
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
      <h2 x-text="title" />
      <button @click="toggle" x-text="isExpanded ? 'Collapse' : 'Expand'" />
    </header>

    <main x-show="isExpanded" x-transition>
      <slot />
    </main>
  </div>
</template>
```

### Script Section

The `<script>` contains the component's JavaScript logic:

```html
<script>
export default class {
  // declare accepted props
  static props = ['title', 'expanded']

  // initialize reactive component state
  initialize() {
    this.isExpanded = this.expanded || false
  }

  // component methods
  toggle() {
    this.isExpanded = !this.isExpanded
    this.$emit('toggle', { expanded: this.isExpanded })
  }

  // lifecycle hooks
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

The `<style>` section contains CSS for the component.  The styles are scoped just to this component. This means that you are free to use simple, low-specificity selectors, without worrying that styles will leak into child components, or other part of the document.

```html
<style>
/* styles will apply only to this component */
button {
  background: #38f;
  border: none;
  border-radius: 4px;
  color: white;
  padding: 8px 16px;
}
header {
  align-items: center;
  display: flex;
  background: #eef;
  justify-content: space-between;
  padding: 16px;
}
.card {
  border: 1px solid #eee;
  border-radius: 8px;
}
</style>
```

## Props

Props are how to provide data to components. Props are like regular HTML element attributes, except that they can reference complex data types like objects and arrays; and they are reactive.  That means if a parent component passes an array as a prop, when the array changes, the child will reflect the change immediately.

### Defining Props

Use the static `props` array to define accepted props:

```html
<!-- components/x-user-card.html -->
<template>
  <div class="user-card" :class="`size-${size}`">
    <img :src="user.avatar" :alt="user.name">
    <p x-text="user.email"></p>
    <span :class="`status ${user.status}`" x-text="user.status"></span>
  </div>
</template>

<script>
export default class {
  static props = ['user', 'size']

  initialize() {
    // props are automatically available and reactive
    console.log('User:', this.user)
    console.log('Size:', this.size)
  }
}
</script>
```

### Using Props

Pass props using as attributes.  When the attribute name starts with a `:` then the value is evaluated dynamically as an expression.

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

## Component Registration

Register components using the `component()` function.  Components are registered globally as custom elements, and so can be used directly anywhere in the document.

```javascript
import { component } from './peak.js'

component('x-button', './components/x-button.html')
component('x-modal', './components/x-modal.html')
component('x-form', './components/x-form.html')
```

