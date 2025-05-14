# Peak.js

Easy reactive web framework with no setup required

```html
<template>
  <button @click="greet">Click</button>
</template>

<script>
  export default class {
    increment() {
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
- No build step necessary
- Reusable single-file components
- Powered by Alpine.js and web components
- Scoped CSS per component
- Optional url-based routing

## Components

Components are defined in plain HTML files, with each file having a `<template>`, an optional `<script>`, and optional `<style>`.

```html
<!-- /components/x-counter.html -->

<template>
  <button @click="increment">
    <span x-text="count"></span>
  </button>
</template>

<script>
  export default class {
    init() {
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

<x-greeter-button></x-greeter-button>

<script type="module">
  import { component } from '/vendor/peak.js'
  component('x-greeter-button', '/components/x-greeter-button.html')
</script>
```

## Templates

Templates are powered by [Alpine.js](https://alpinejs.dev), so that all applies here

#### x-if

Conditionally render a block

```html
<div x-if="loading">
  <img src="spinner.svg">
</div>
```

> Note that there is no `x-else-if` or `x-else`

#### x-for

Render some HTML for each item in an array

```html
<ul>
  <template x-for="item in items">
    <li x-text="item.title">
  </template>
</ul>
```

#### x-text

Set the text content of an element

```html
<span x-text="`Hello, ${name}`"></span>
```

#### x-html

Set the HTML content of an element

```html
<div x-html="markdown.render('# Page title')"></div>
```

#### x-show

```html
<div x-show="open">Content...</div>
```

#### x-ref

Refer to an HTML element via `$refs`

```html
<input x-ref="searchInput">
<button @click="$refs.searchInput.focus()">Search</button>
```

## Lifecycle methods

In the `<script>` tag, `export default` a class, which may define `init()` and `destroy()` methods:

```html
<template>
  <h2>Feed</h2
  <template x-for="item in items">
    <h4 x-text="item.title"><h4>
    <div x-text="item.body"></div>
  </template>
</template>

<script>
export default class {
  init() {
    // initialize the component
    this.pollerId = setInterval(_ => {
      this.items = fetch('/feed')
    }, 30_000)
  }
  destroy() {
    // clean up when the component is destroyed
    clearInterval(this.pollerId)
  }
}
</script>
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
  init() {
    this.time = new Date;
  }
}
</script>
```

## Style

Styles defined in the component are scoped to the component -- they won't leak up to ancestor elements, nor down into nested components.

```html
<template>
  <h1>Article title</h1>
  <p>This text in red won't leak to other components</p>
  <x-body></x-body>
</template>
<style>
  p { color: magenta }
</style>
```

## Routing

Peak comes with an optional built-in router.  Register views to route patterns for integration with the History API

```javascript
import { router } from 'peak'

router.route('/', '/views/home.html')
router.route('/about', '/views/about.html')
```




