# Peak.js

Easy reactive web framework with no setup required

```html
<template>
  <button @click="greet">Click</button>
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

- Reactive web framework
- Inspired by Vue and Alpine
- No build step necessary
- Reusable single-file components
- Powered by Alpine.js and web components
- Scoped CSS per component
- Optional url-based routing

## Components

Components are defined in plain HTML files, with each file having a `<template>`, an optional `<script>`, and optional `<style>`.

```html
<!-- components/x-counter.html -->

<template>
  <button @click="increment">
    <span x-text="count"></span>
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

Register components and use them directly:

```html
<!-- index.html -->

<x-counter></x-counter>

<script type="module">
  import { component } from '/vendor/peak.js'
  component('x-counter', '/components/x-counter.html')
</script>
```

## Templates

### x-if

Conditionally render a block

```html
<img x-if="loading" src="spinner.svg">
```

Also available are `x-if-else` and `x-else`

```html
<template x-if="loading">
  <img src="spinner.svg">
</template>

<template x-else-if="error">
  <img src="error.svg">
</template>

<template x-else>
  <x-content></x-content>
</template>
```

### x-for

Render some HTML for each item in an array

```html
<ul>
  <li x-for="item in items">
    <span x-text="item.title"></span>
  </li>
</ul>
```

### x-text

Set the text content of an element

```html
<span x-text="`Hello, ${name}`"></span>
```

### x-html

Set the HTML content of an element

```html
<div x-html="markdown.render('# Page title')"></div>
```

### x-show

Set the visibility of an element

```html
<div x-show="open">Content...</div>
```

### x-ref

Refer to an HTML element via `$refs`

```html
<input x-ref="searchInput">
<button @click="$refs.searchInput.focus()">Search</button>
```

## Component methods

### initialize()

Run code when the component is initialized before mounted

### mounted()

Run code when the component is mounted

```html
<script>
export default class {
  init() {
    // initialize the component
    this.pollerId = setInterval(_ => {
      this.items = fetch('/feed')
    }, 30_000)
  }
}
</script>
```

### destroyed()

Run teardown code when the component is to be destroyed

```html
<script>
export default class {
  init() {
    // ...
  }
  destroy() {
    // clean up when the component is destroyed
    clearInterval(this.pollerId)
  }
}
</script>
```

### $watch(expr)

Run methods when reactive data changes

```html
<template>
  <button @click="count++">
</template>

<script>
export default class {
  initialize() {
    this.count = 0
    this.$watch('count', () => {
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
  <input @input="$emit('change')">
</template>
```

## Computed properties

Use instance getters for display formatting, and other derived properties

```html
<template>
  <div x-text="formattedTime"></div>
</template>

<script>
export default class {
  get formattedTime() {
    return new this.time.toISOString()
  }
  created() {
    this.time = new Date;
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
  <x-body></x-body>
</template>

<style>
  p { color: red }
</style>
```

## Routing

Peak comes with an optional built-in router.  Register views to route patterns for integration with the History API

```html
<nav>
  <a href="/">HOME</a>
  <a href="/about">ABOUT</a>
</nav>

<x-router-view></x-router-view>

<script type="module">
  import { router, component } from 'peak'

  router.route('/', '/views/x-home.html')
  router.route('/about', '/views/x-about.html')

  router.on('navigation', e => console.log(e))
  router.on('notFound', e => console.warn(e))
</script>
```

