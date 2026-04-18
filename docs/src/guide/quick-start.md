# Quick Start

Get up and running with Peak.js in just a few minutes! This guide will walk you through creating your first reactive component.

## Your First Component

Let's create a simple counter component to demonstrate Peak.js basics.

### 1. Create the Component File

Create a file called `x-counter.html`:

```html
<!-- x-counter.html -->
<template>
  <div class="counter">
    <h2>Welcome to Peak.js</h2>
    <b class="number" x-text="this.count" />
    <div class="buttons">
      <button @click="this.decrement()" :disabled="this.count <= 0">-</button>
      <button @click="this.increment()">+</button>
    </div>
    <p class="status" x-text="this.statusMessage"></p>
    <button @click="this.reset()" x-show="this.count != 0">Reset</button>
  </div>
</template>

<script>
export default class {
  initialize() {
    this.count = 0
  }
  get statusMessage() {
    if (this.count === 0) return "Click + to start counting!"
    if (this.count === 1) return "You've got one!"
    if (this.count <= 10) return `Count is ${this.count}`
    return "You're counting high!"
  }
  increment() {
    this.count++
  }
  decrement() {
    this.count--
  }
  reset() {
    this.count = 0
  }
}
</script>

<style>
.counter {
  font-family: system-ui, sans-serif;
  margin: auto;
  text-align: center;
}
.number {
  color: dodgerblue;
  font-size: 3rem;
}
.buttons {
  display: flex;
  gap: 10px;
  justify-content: center;
}
button {
  padding: 0.8em 2em;
}
</style>
```

### 2. Create Your HTML Page

Create an `index.html` file:

```html
<!doctype html>
<body>
  <x-counter></x-counter>
  <script type="module">
    import { component } from 'https://unpkg.com/@peak-js/core'
    component('x-counter', 'x-counter.html')
  </script>
</body>
```

### 3. Serve Your App

Since we're using ES modules, you'll need to serve your files over HTTP (not `file://`). You can use any static file server:

```bash
# static file server
python -m http.server
```

Open your browser to `http://localhost:8000` and you'll see your counter component in action!

## What's Happening?

Let's break down what makes this work:

### Component Registration
```javascript
component('x-counter', 'x-counter.html')
```
This registers a new custom element called `<x-counter>` that loads its template from the specified file.

### Reactive Data
```javascript
initialize() {
  this.count = 0  // This becomes reactive automatically
}
```
Any property you set on `this` becomes reactive, meaning the UI updates automatically when the value changes.

### Template Directives
- `x-text="this.count"` - displays the value of `count`
- `@click="this.increment()"` - calls the `increment` method when clicked
- `:disabled="this.count <= 0"` - binds the disabled attribute to an expression
- `x-show="this.count > 0"` - shows/hides the element based on condition

Template expressions are plain JavaScript evaluated in the context of your component, so `this` refers to the component instance. Use `this.` to access component properties and methods.

### Computed Properties
```javascript
get statusMessage() {
  // This recalculates whenever 'count' changes
  if (this.count === 0) return "Click + to start counting!"
  // ...
}
```
Getter methods automatically become computed properties that update when their dependencies change.

## Next resources to explore...

- [Template Directives Guide](/guide/templates) - Learn all available directives
- [Reactivity Guide](/guide/reactivity) - Understand how reactivity works
- [Component Guide](/guide/components) - Deep dive into component features
- [Event Handling](/guide/events) - Master event handling patterns
