# Reactivity

Peak.js features a powerful reactivity system that automatically updates your UI when data changes. Unlike frameworks that require special syntax or APIs, Peak.js makes any property on your component automatically reactive.

## How Reactivity Works

When you assign a value to a property in your component, Peak.js wraps it with a Proxy that intercepts property access and mutations. This allows the framework to track dependencies and update the DOM automatically.

```html
<template>
  <div>
    <p x-text="message"></p>
    <button @click="updateMessage">Update</button>
  </div>
</template>

<script>
export default class {
  initialize() {
    this.message = "Hello World"
  }
  
  updateMessage() {
    this.message = "Hello Peak.js!" // UI updates automatically
  }
}
</script>
```

## Reactive Data Types

### Primitives
Strings, numbers, booleans, and other primitives are automatically reactive:

```javascript
this.count = 0
this.name = "Alice"
this.isVisible = true
```

### Objects
Objects are deeply reactive, meaning nested properties also trigger updates:

```javascript
this.user = {
  name: "Alice",
  profile: {
    email: "alice@example.com",
    preferences: {
      theme: "dark"
    }
  }
}

// All of these trigger UI updates
this.user.name = "Bob"
this.user.profile.email = "bob@example.com"
this.user.profile.preferences.theme = "light"
```

### Arrays
Arrays and their elements are reactive:

```javascript
this.items = ['apple', 'banana', 'cherry']

// These all trigger updates
this.items.push('date')
this.items[0] = 'apricot'
this.items.sort()
```

## Computed Properties

Use getters to create computed properties that automatically update when their dependencies change:

```html
<template>
  <div>
    <input x-model="firstName">
    <input x-model="lastName">
    <p x-text="fullName"></p>
  </div>
</template>

<script>
export default class {
  initialize() {
    this.firstName = "John"
    this.lastName = "Doe"
  }
  
  get fullName() {
    return `${this.firstName} ${this.lastName}`
  }
}
</script>
```

## Watchers

Use `$watch()` to run code when reactive data changes:

```html
<template>
  <div>
    <input x-model="search">
    <p x-text="results.length + ' results'"></p>
  </div>
</template>

<script>
export default class {
  initialize() {
    this.search = ""
    this.results = []
    
    // Watch for search changes
    this.$watch('search', () => {
      this.performSearch()
    })
  }
  
  async performSearch() {
    if (this.search.length > 2) {
      this.results = await fetch(`/search?q=${this.search}`)
        .then(r => r.json())
    } else {
      this.results = []
    }
  }
}
</script>
```

### Watching Deep Changes

To watch for deep changes in objects or arrays, the watcher automatically tracks nested properties:

```javascript
this.user = { profile: { name: "Alice" } }

this.$watch('user.profile.name', () => {
  console.log('Name changed to:', this.user.profile.name)
})

// Or watch the entire object
this.$watch('user', () => {
  console.log('User object changed')
})
```

## Reactivity Niceties

### Direct Index Assignment
When working with arrays, direct index assignment works:

```javascript
// ✅ This works and triggers updates
this.items[0] = 'new value'
```

### Property Deletion
Deleting properties is reactive:

```javascript
// ✅ This works and triggers updates
delete this.user.email
```

### Property Reassignment
```javascript
// ✅ This works and triggers updates
this.items = []
```

### Non-reactive Properties
Properties that start with underscore are not made reactive:

```javascript
this._internal = "not reactive" // Won't trigger updates
this.reactive = "will update UI" // Will trigger updates
```

## Performance Considerations

### Batched Updates
Peak.js batches DOM updates using `requestAnimationFrame` to prevent excessive re-renders:

```javascript
// These three changes result in only one DOM update
this.count++
this.count++
this.count++
```

### Manual Updates
If you need to trigger an update manually (rare), you can use `$render()`:

```javascript
// Force a re-render
this.$render()
```

### Avoiding Reactivity
If you need to set a property without triggering reactivity, access the underlying state value:

```javascript
// Access the raw object without triggering reactivity
this._state.items.updatedTime = Date.now()
```

## Example: Todo List

Here's a complete example showing reactivity in action:

```html
<template>
  <div>
    <input x-model="newTodo" @keyup.enter="addTodo">
    <button @click="addTodo">Add Todo</button>

    <ul>
      <li x-for="todo in visibleTodos">
        <input type="checkbox" x-model="todo.completed">
        <span x-text="todo.text" :class="{ completed: todo.completed }"></span>
        <button @click="removeTodo(todo)">×</button>
      </li>
    </ul>

    <p x-text="stats"></p>

    <button @click="filter = 'all'" :class="{ active: filter === 'all' }">All</button>
    <button @click="filter = 'active'" :class="{ active: filter === 'active' }">Active</button>
    <button @click="filter = 'completed'" :class="{ active: filter === 'completed' }">Completed</button>
  </div>
</template>

<script>
export default class {
  initialize() {
    this.todos = []
    this.newTodo = ""
    this.filter = "all"
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

  removeTodo(todo) {
    const index = this.todos.indexOf(todo)
    this.todos.splice(index, 1)
  }

  get visibleTodos() {
    switch (this.filter) {
      case 'active': return this.todos.filter(t => !t.completed)
      case 'completed': return this.todos.filter(t => t.completed)
      default: return this.todos
    }
  }

  get stats() {
    const total = this.todos.length
    const completed = this.todos.filter(t => t.completed).length
    return `${completed}/${total} completed`
  }
}
</script>

<style>
.completed {
  text-decoration: line-through;
  opacity: 0.6;
}

.active {
  background: #007acc;
  color: white;
}
</style>
```
