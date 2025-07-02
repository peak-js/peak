# Components

Components are defined in plain HTML files, with each file having a `<template>`, an optional `<script>`, and optional `<style>`.

```html
<!-- components/x-counter.html -->

<template>
  <button @click="increment">
    <span x-text="count" />
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

## Props

Specify props using a static `props` array:

```html
<template>
  Greetings, <span x-text="name" />!
</template>

<script>
export default class {
  static props = ['name']
}
</script>
```

## Lifecycle methods

### initialize()

Run code when the component is initialized before mounted

```html
<script>
export default class {
  initialize() {
    // initialize the component
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
  <button @click="count++" x-text="count" />
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

## Events

### Lifecycle events

- **`initialize`** - component has been initialized but not yet mounted
- **`mounted`** - component has been mounted in the document
- **`teardown`** - component is no longer mounted

### $emit(eventName, detail)

Emit events that bubble up to parent components

```html
<template>
  <input @input="$emit('change')">
</template>
```

### $on(eventName, handler)

Handle emitted events native and custom

## Component properties

### $event

Refer to the event being handled

```html
<template>
  <button @click="incrementBy(10)">Add 10</button>
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

Use instance getters for display formatting, and other derived properties

```html
<template>
  <div x-text="formattedTime" />
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
  <x-body />
</template>

<style>
  p { color: red }
</style>
```
