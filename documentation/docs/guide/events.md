# Event Handling

Peak.js provides intuitive event handling that feels familiar to developers coming from Vue.js or Alpine.js. Events are handled using the `@` syntax and support both native DOM events and custom component events.

## Basic Event Handling

### DOM Events

Use the `@` prefix followed by the event name to listen for DOM events:

```html
<template>
  <div>
    <button @click="increment">Count: <span x-text="count"></span></button>
    <input @input="handleInput" x-model="message">
    <form @submit="handleSubmit">
      <input type="email" x-model="email">
      <button type="submit">Subscribe</button>
    </form>
  </div>
</template>

<script>
export default class {
  initialize() {
    this.count = 0
    this.message = ""
    this.email = ""
  }

  increment() {
    this.count++
  }

  handleInput(event) {
    console.log('Input value:', event.target.value)
  }

  submit() {
    console.log('Enter pressed:', this.message)
  }

  handleSubmit(e) {
    e.preventDefault()
    console.log('Submitting form with email:', this.email)
    // submit the form...
  }
}
</script>
```

## The $event Object

Event handlers will receive the event as their first parameter, but you can also access the native event object using the special `$event` property on the component.

```html
<template>
  <div>
    <input @input="handleInput($event.target.value)">
    <button @click="handleClick">Click</button>
    <div @mousemove="trackMouse">Mouse tracker</div>
  </div>
</template>

<script>
export default class {
  handleInput(value) {
    this.inputValue = value
  }

  handleClick() {
    // Access event via this.$event
    console.log('Click position:', this.$event.clientX, this.$event.clientY)

    // Stop propagation
    this.$event.stopPropagation()

    // Prevent default
    this.$event.preventDefault()
  }

  trackMouse() {
    this.mouseX = this.$event.clientX
    this.mouseY = this.$event.clientY
  }
}
</script>
```

## Custom Component Events

### Emitting Events

Components can emit custom events using `$emit()`:

```html
<!-- components/x-user-form.html -->
<template>
  <form @submit.prevent="submit">
    <input x-model="user.name" placeholder="Name" required>
    <input x-model="user.email" type="email" placeholder="Email" required>
    <button type="submit">Save User</button>
    <button type="button" @click="cancel">Cancel</button>
  </form>
</template>

<script>
export default class {
  static props = ['user']

  initialize() {
    this.user = this.user || { name: '', email: '' }
  }

  submit() {
    // Emit event with user data
    this.$emit('save', this.user)
  }

  cancel() {
    this.$emit('cancel')
  }
}
</script>
```

### Listening to Custom Events

Listen to custom events from child components:

```html
<!-- Parent component -->
<template>
  <div>
    <x-user-form
      :user="currentUser"
      @save="saveUser"
      @cancel="cancelEdit" />

    <x-notification
      @close="hideNotification"
      x-show="showNotification">
      User saved successfully! />
  </div>
</template>

<script>
export default class {
  initialize() {
    this.currentUser = { name: 'Alice', email: 'alice@example.com' }
    this.showNotification = false
  }

  saveUser(userData) {
    console.log('Saving user:', userData)
    // Save logic here
    this.showNotification = true
  }

  cancelEdit() {
    console.log('Edit cancelled')
    this.currentUser = { name: '', email: '' }
  }

  hideNotification() {
    this.showNotification = false
  }
}
</script>
```
