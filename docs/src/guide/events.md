# Event Handling

Peak.js handles events using the `@` syntax on any element. The value is a plain JavaScript expression evaluated in the context of the component, just like other directives.

## Basic Event Handling

Use the `@` prefix followed by the event name. The expression is called when the event fires:

```html
<template>
  <div>
    <button @click="this.count++">Count: <span x-text="this.count"></span></button>
    <button @click="this.reset()">Reset</button>
    <form @submit="this.handleSubmit(event)">
      <input x-model="this.email" type="email">
      <button type="submit">Subscribe</button>
    </form>
  </div>
</template>

<script>
export default class {
  initialize() {
    this.count = 0
    this.email = ""
  }

  reset() {
    this.count = 0
  }

  handleSubmit(e) {
    e.preventDefault()
    console.log('Submitting:', this.email)
  }
}
</script>
```

## The event Variable

The native DOM event is available as `event` in any `@` expression. Pass it explicitly to methods that need it:

```html
<template>
  <div>
    <!-- pass event to a method -->
    <form @submit="this.handleSubmit(event)">...</form>

    <!-- use it inline -->
    <button @click="event.target.disabled = true">Click once</button>

    <!-- pass specific values from it -->
    <input @input="this.query = event.target.value">

    <!-- track mouse position inline -->
    <div @mousemove="this.x = event.clientX; this.y = event.clientY">
      Move mouse here
    </div>
  </div>
</template>
```

You can also access the event via `this.$event` inside a method when you haven't passed it as an argument:

```javascript
handleClick() {
  this.$event.stopPropagation()
  this.$event.preventDefault()
}
```

## Custom Component Events

### Emitting Events

Components emit custom events using `$emit()`:

```html
<!-- components/x-user-form.html -->
<template>
  <form @submit="this.submit(event)">
    <input x-model="this.name" placeholder="Name" required>
    <input x-model="this.email" type="email" placeholder="Email" required>
    <button type="submit">Save</button>
    <button type="button" @click="this.cancel()">Cancel</button>
  </form>
</template>

<script>
export default class {
  initialize() {
    this.name = ''
    this.email = ''
  }

  submit(e) {
    e.preventDefault()
    this.$emit('save', { name: this.name, email: this.email })
  }

  cancel() {
    this.$emit('cancel')
  }
}
</script>
```

### Listening to Custom Events

Listen to custom events from child components using the same `@` syntax:

```html
<!-- Parent component -->
<template>
  <div>
    <x-user-form
      @save="this.saveUser(event)"
      @cancel="this.cancelEdit()" />

    <x-notification
      @close="this.hideNotification()"
      x-show="this.showNotification">
      User saved successfully!
    </x-notification>
  </div>
</template>

<script>
export default class {
  initialize() {
    this.showNotification = false
  }

  saveUser(e) {
    console.log('Saving user:', e.detail)
    this.showNotification = true
  }

  cancelEdit() {
    console.log('Edit cancelled')
  }

  hideNotification() {
    this.showNotification = false
  }
}
</script>
```

Note that custom events carry their payload in `event.detail`, as per the standard `CustomEvent` API.
