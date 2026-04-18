# Peak.js

Easy reactive web framework with no setup required

```html
<template>
  <button @click="this.greet()">Click</button>
</template>

<script>
  export default class {
    greet() {
      alert('Welcome to Peak.js!')
    }
  }
</script>

<style>
  button { font-size: large }
</style>
```

## Features

- Reactive web framework based on Web Components
- No build step necessary
- Reusable single-file components
- Scoped CSS styles per component
- Optional url-based view routing
- Lightweight at ~5kb gzipped
- Support for server-side rendering (SSR)
- Optional Vite plugin for bundling and HMR

## Components

Components are defined in plain HTML files, with each file having a `<template>`, an optional `<script>`, and optional `<style>`.

```html
<!-- components/x-counter.html -->

<template>
  <button @click="this.increment()">
    <span x-text="this.count" />
  </button>
</template>

<script>
  export default class {
    initialize() {
      this.count = 0
    }
    increment() {
      this.count++
    }
  }
</script>

<style>
  button:active {
    filter: invert(1);
  }
</style>
```

Register components and use them directly in markup:

```html
<!-- index.html -->

<x-counter></x-counter>

<script type="module">
  import { component } from '/vendor/peak.js'
  component('x-counter', '/components/x-counter.html')
</script>
```

## Templates

Template expressions are plain JavaScript evaluated in the context of the component.

### x-if

Conditionally render a block

```html
<img x-if="this.loading" src="spinner.svg">
```

Also available are `x-else` and `x-else-if`

```html
<template x-if="this.loading">
  <img src="spinner.svg">
</template>

<template x-else-if="this.error">
  <img src="error.svg">
</template>

<template x-else>
  <x-content />
</template>
```

### x-for

Render some HTML for each item in an array

```html
<ul>
  <li x-for="item in this.items">
    <span x-text="item.title" />
  </li>
</ul>
```

### x-text

Set the text content of an element

```html
<span x-text="`Hello, ${this.name}`" />
```

### x-html

Set the HTML content of an element

```html
<div x-html="this.markdown.render('# Page title')"></div>
```

### x-show

Set the visibility of an element

```html
<div x-show="this.open">Content...</div>
```

### x-model

Two-way binding for form inputs

```html
<input x-model="this.query">
<input type="checkbox" x-model="this.enabled">
```

### x-ref

Refer to an HTML element via `$refs`

```html
<input x-ref="searchInput">
<button @click="this.$refs.searchInput.focus()">Search</button>
```

## Event Handling

Use `@event` to handle DOM events. The value is a plain JS expression. The native event is available as `event`:

```html
<button @click="this.count++">increment</button>
<button @click="this.reset()">reset</button>
<form @submit="this.handleSubmit(event)">...</form>
<input @input="this.query = event.target.value">
```

## Component methods

### initialize()

Run code when the component is initialized before mounted

```html
<script>
export default class {
  initialize() {
    this.pollerId = setInterval(_ => {
      this.items = fetch('/feed')
    }, 30_000)
  }
}
</script>
```

### mounted()

Run code when the component is mounted

### teardown()

Run teardown code when the component is to be destroyed

```html
<script>
export default class {
  initialize() {
    // ...
  }
  teardown() {
    clearInterval(this.pollerId)
  }
}
</script>
```

### $watch(getter, fn)

Run a callback when reactive data changes. Pass an arrow function that reads the reactive property to watch:

```html
<template>
  <button @click="this.count++" x-text="this.count" />
</template>

<script>
export default class {
  initialize() {
    this.count = 0
    this.$watch(_ => this.count, () => {
      console.log("count is now", this.count)
    })
  }
}
</script>
```

### $emit(eventName, detail)

Emit events that bubble up to parent components

```html
<template>
  <input @input="this.$emit('change', event.target.value)">
</template>
```

### $on(eventName, handler)

Handle native and custom events

## Lifecycle events

- **`initialize`** - component has been initialized but not yet mounted
- **`mounted`** - component has been mounted in the document
- **`teardown`** - component is no longer mounted

## Props

Specify props with `$prop` during the `initialize()` lifecycle method:

```html
<template>
  Greetings, <span x-text="this.name" />!
</template>

<script>
export default class {
  initialize() {
    this.name = this.$prop('name')
  }
}
</script>
```

## Component properties

### $event

The native event currently being handled, accessible inside methods:

```html
<template>
  <button @click="this.incrementBy(10)">Add 10</button>
</template>

<script>
export default class {
  incrementBy(n) {
    this.$event.stopPropagation()
    this.count += n
  }
}
</script>
```

### $refs

Refer to elements within the component by the name in their `x-ref` attribute

## Computed properties

Use instance getters for display formatting and other derived properties

```html
<template>
  <div x-text="this.formattedTime" />
</template>

<script>
export default class {
  get formattedTime() {
    return this.time.toISOString()
  }
  initialize() {
    this.time = new Date
  }
}
</script>
```

## Style

Styles defined in the component are scoped to the component — they won't leak up to ancestor elements, nor down into nested components.

```html
<template>
  <h1>Article title</h1>
  <p>This text in red won't leak to other components</p>
  <x-body />
</template>

<style>
  p { color: red }
</style>
```

## Routing

Peak comes with an optional built-in router. Register views to route patterns for integration with the History API. Views are just regular components, associated with a route.

```html
<nav>
  <a href="/">HOME</a>
  <a href="/about">ABOUT</a>
</nav>

<x-router-view></x-router-view>

<script type="module">
  import { router } from 'peak'

  router.route('/', '/views/home.html')
  router.route('/about', '/views/about.html')

  router.on('navigation', e => console.log(e))
  router.on('notFound', e => console.warn(e))
</script>
```

## Building with Vite

Optionally, build with Vite in order to get HMR in dev, and bundling for production.

```js
// vite.config.js
import { defineConfig } from 'vite'
import peakPlugin from 'peak/vite'

export default defineConfig({
  plugins: [peakPlugin()]
})
```

Make sure to import `virtual:peak-components` built by the vite build:

```html
// index.html
<script type="module">
import "virtual:peak-components"
import { router } from './peak.js'

router.route('/', '/views/home.html')
</script>
```
