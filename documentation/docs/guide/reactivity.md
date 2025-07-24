# Reactivity

When reactive data changes, the new state is automatically reflected in the UI.

## Component Properties

Properties in components are reactive by default. That means once you assign a value to component property, if the property is referenced in the course of evaluating the template, then when the values changes, the template will be rendered again to reflect the new value.

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

## Observable Stores

In order to share reactive state across components, use `observable`:

```js
// store.js
import { observable } from 'peak-js/core'
const store = observable({ count: 0 })
export default store
```

Then, when you reference store values in components, then when the value change, the new state will be reflected in the component automatically:

```html
<!-- count-view.html -->
<template>
  Count is <span x-text="count"/>
</template>

<script>
import store from './store.js'
export default class {
  get count() {
    return store.count
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

