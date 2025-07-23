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
    <b class="number" x-text="count" />
    <div class="buttons">
      <button @click="decrement" :disabled="count <= 0">-</button>
      <button @click="increment">+</button>
    </div>
    <p class="status" x-text="statusMessage"></p>
    <button @click="reset" x-show="count != 0">Reset</button>
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
  border: 2px solid #eee;
  border-radius: 8px;
  font-family: system-ui, sans-serif;
  max-width: 300px;
  margin: auto;
  padding: 24px;
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
  margin: 20px 0;
}
button {
  padding: 1em 2em;
}
.status {
  color: #777;
  font-style: italic;
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
- `x-text="count"` - Displays the value of `count`
- `@click="increment"` - Calls the `increment` method when clicked
- `:disabled="count <= 0"` - Binds the disabled attribute to an expression
- `x-show="count > 0"` - Shows/hides the element based on condition

### Computed Properties
```javascript
get statusMessage() {
  // This recalculates whenever 'count' changes
  if (this.count === 0) return "Click + to start counting!"
  // ...
}
```
Getter methods automatically become computed properties that update when their dependencies change.

## Common Patterns

As you build more components, here are some patterns you'll use frequently:

### Component Communication
Create a parent component that manages multiple counters:

```html
<!-- components/x-counter-manager.html -->
<template>
  <div>
    <h2>Counter Manager</h2>
    <p>Total across all counters: <span x-text="totalCount"></span></p>

    <div x-for="counter in counters" :key="counter.id">
      <x-counter @count-changed="updateTotal"></x-counter>
    </div>

    <button @click="addCounter">Add Counter</button>
  </div>
</template>
```

### Form Handling

```html
<form @submit.prevent="handleSubmit">
  <input x-model="form.email" type="email" required>
  <input x-model="form.password" type="password" required>
  <button type="submit" :disabled="!isFormValid">Submit</button>
</form>
```

### Loading States

```html
<div x-if="loading">Loading...</div>
<div x-else>
  <!-- content -->
</div>
```

## Resources

- [Template Directives Guide](/guide/templates) - Learn all available directives
- [Reactivity Guide](/guide/reactivity) - Understand how reactivity works
- [Component Guide](/guide/components) - Deep dive into component features
- [Event Handling](/guide/events) - Master event handling patterns

You're now ready to build amazing reactive applications with Peak.js! 🎉
