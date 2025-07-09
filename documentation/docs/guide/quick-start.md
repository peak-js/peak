# Quick Start

Get up and running with Peak.js in just a few minutes! This guide will walk you through creating your first reactive component.

## Installation

Peak.js requires no build tools or complex setup. Simply include it in your HTML file:

### Option 1: Load from a CDN

```html
<!doctype html>
<html>
<head>
  <title>My Peak.js App</title>
</head>
<body>
  <x-app></x-app>
  <script type="module">
    import { component } from 'https://unpkg.com/peak-js@latest/dist/peak.js'
    component('x-app', '/components/x-app.html')
  </script>
</body>
</html>
```

### Option 2: Install via Package Manager

```bash
# install via npm or yarn etc
npm install peak-js
```

```html
<script type="module">
  import { component } from 'peak-js'
  // Your app code here
</script>
```


## Your First Component

Let's create a simple counter component to demonstrate Peak.js basics.

### 1. Create the Component File

Create a file called `components/x-counter.html`:

```html
<!-- components/x-counter.html -->
<template>
  <div class="counter">
    <h2>Counter Example</h2>
    <div class="count-display">
      <span class="count" x-text="count"></span>
    </div>
    <div class="buttons">
      <button @click="decrement" :disabled="count <= 0">-</button>
      <button @click="increment">+</button>
      <button @click="reset" x-show="count > 0">Reset</button>
    </div>
    <p class="status" x-text="statusMessage"></p>
  </div>
</template>

<script>
export default class {
  initialize() {
    this.count = 0
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
  
  get statusMessage() {
    if (this.count === 0) return "Click + to start counting!"
    if (this.count === 1) return "You've got one!"
    if (this.count < 10) return `Count is ${this.count}`
    return "You're counting high!"
  }
}
</script>

<style>
.counter {
  max-width: 300px;
  margin: 0 auto;
  padding: 20px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  text-align: center;
  font-family: system-ui, sans-serif;
}

.count-display {
  margin: 20px 0;
}

.count {
  font-size: 3rem;
  font-weight: bold;
  color: #2563eb;
}

.buttons {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin: 20px 0;
}

.buttons button {
  padding: 10px 20px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  font-size: 1rem;
}

.buttons button:hover:not(:disabled) {
  background: #f3f4f6;
}

.buttons button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.status {
  color: #6b7280;
  font-style: italic;
}
</style>
```

### 2. Create Your HTML Page

Create an `index.html` file:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My First Peak.js App</title>
  <style>
    body {
      font-family: system-ui, sans-serif;
      margin: 0;
      padding: 40px;
      background: #f8fafc;
    }
    
    .container {
      max-width: 800px;
      margin: 0 auto;
    }
    
    h1 {
      text-align: center;
      color: #1e293b;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Welcome to Peak.js!</h1>
    <x-counter></x-counter>
  </div>
  
  <script type="module">
    import { component } from 'https://unpkg.com/peak-js@latest/dist/peak.js'
    
    // Register the counter component
    component('x-counter', './components/x-counter.html')
  </script>
</body>
</html>
```

### 3. Serve Your App

Since we're using ES modules, you'll need to serve your files over HTTP (not file://). You can use any static file server:

```bash
# Using Python (if you have it installed)
python -m http.server 8000

# Using Node.js (if you have it installed)
npx serve .

# Using PHP (if you have it installed)
php -S localhost:8000
```

Open your browser to `http://localhost:8000` and you'll see your counter component in action!

## What's Happening?

Let's break down what makes this work:

### Component Registration
```javascript
component('x-counter', './components/x-counter.html')
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

## Next Steps

Now that you have a basic component working, try these exercises:

### Exercise 1: Add a Step Size
Modify the counter to allow custom step sizes:

```javascript
initialize() {
  this.count = 0
  this.step = 1
}

increment() {
  this.count += this.step
}

decrement() {
  this.count -= this.step
}
```

Add an input to control the step size:
```html
<input type="number" x-model="step" min="1" max="10">
```

### Exercise 2: Create a Todo List
Create a new component `components/x-todo-list.html`:

```html
<template>
  <div class="todo-list">
    <h2>My Todo List</h2>
    <form @submit.prevent="addTodo">
      <input x-model="newTodo" placeholder="What needs to be done?" required>
      <button type="submit">Add</button>
    </form>
    
    <ul x-show="todos.length > 0">
      <li x-for="todo in todos" :key="todo.id">
        <input type="checkbox" x-model="todo.completed">
        <span :class="{ completed: todo.completed }" x-text="todo.text"></span>
        <button @click="removeTodo(todo)">×</button>
      </li>
    </ul>
    
    <p x-show="todos.length === 0">No todos yet! Add one above.</p>
  </div>
</template>

<script>
export default class {
  initialize() {
    this.todos = []
    this.newTodo = ""
  }
  
  addTodo() {
    if (this.newTodo.trim()) {
      this.todos.push({
        id: Date.now(),
        text: this.newTodo.trim(),
        completed: false
      })
      this.newTodo = ""
    }
  }
  
  removeTodo(todoToRemove) {
    this.todos = this.todos.filter(todo => todo !== todoToRemove)
  }
}
</script>

<style>
/* Add your todo list styles here */
</style>
```

### Exercise 3: Component Communication
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

## Common Patterns

As you build more components, here are some patterns you'll use frequently:

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
<div x-show="loading">Loading...</div>
<div x-show="!loading">
  <!-- Your content -->
</div>
```

### Error Handling
```html
<div x-show="error" class="error">
  <p x-text="error"></p>
  <button @click="clearError">Dismiss</button>
</div>
```

## Resources

- [Template Directives Guide](/guide/templates) - Learn all available directives
- [Reactivity Guide](/guide/reactivity) - Understand how reactivity works
- [Component Guide](/guide/components) - Deep dive into component features
- [Event Handling](/guide/events) - Master event handling patterns

You're now ready to build amazing reactive applications with Peak.js! 🎉
