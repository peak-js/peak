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

## Event Delegation

### Using $on for Dynamic Listeners

Register event listeners dynamically:

```html
<template>
  <div>
    <ul>
      <li x-for="item in items" :data-id="item.id">
        <span x-text="item.name"></span>
        <button class="delete-btn">Delete</button>
      </li>
    </ul>
  </div>
</template>

<script>
export default class {
  initialize() {
    this.items = [
      { id: 1, name: 'Apple' },
      { id: 2, name: 'Banana' },
      { id: 3, name: 'Cherry' }
    ]

    // Listen for click events on delete buttons
    this.$on('click', (event) => {
      if (event.target.classList.contains('delete-btn')) {
        const li = event.target.closest('li')
        const itemId = parseInt(li.dataset.id)
        this.deleteItem(itemId)
      }
    })
  }

  deleteItem(id) {
    this.items = this.items.filter(item => item.id !== id)
  }
}
</script>
```

### Global Event Bus

Create a simple event bus for component communication:

```javascript
// utils/eventBus.js
class EventBus {
  constructor() {
    this.events = {}
  }

  on(event, callback) {
    if (!this.events[event]) {
      this.events[event] = []
    }
    this.events[event].push(callback)
  }

  emit(event, data) {
    if (this.events[event]) {
      this.events[event].forEach(callback => callback(data))
    }
  }

  off(event, callback) {
    if (this.events[event]) {
      this.events[event] = this.events[event].filter(cb => cb !== callback)
    }
  }
}

export const eventBus = new EventBus()
```

Use in components:

```html
<!-- components/x-notification-sender.html -->
<script>
import { eventBus } from '../utils/eventBus.js'

export default class {
  sendNotification() {
    eventBus.emit('notification', {
      type: 'success',
      message: 'Operation completed successfully!'
    })
  }
}
</script>
```

```html
<!-- components/x-notification-receiver.html -->
<script>
import { eventBus } from '../utils/eventBus.js'

export default class {
  initialize() {
    this.notifications = []

    eventBus.on('notification', (data) => {
      this.notifications.push(data)
      setTimeout(() => this.removeNotification(data), 5000)
    })
  }

  removeNotification(notification) {
    const index = this.notifications.indexOf(notification)
    if (index > -1) {
      this.notifications.splice(index, 1)
    }
  }

  teardown() {
    eventBus.off('notification', this.handleNotification)
  }
}
</script>
```

