# Event Handling

Peak.js provides intuitive event handling that feels familiar to developers coming from Vue.js or Alpine.js. Events are handled using the `@` syntax and support both native DOM events and custom component events.

## Basic Event Handling

### DOM Events

Use the `@` prefix followed by the event name to listen for DOM events:

```html
<template>
  <div>
    <button @click="increment">Count: <span x-text="count"></span></button>
    <input @input="handleInput" @keyup.enter="submit" x-model="message">
    <form @submit.prevent="handleSubmit">
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
  
  handleSubmit() {
    console.log('Form submitted with email:', this.email)
  }
}
</script>
```

### Event Modifiers

Peak.js supports Vue-style event modifiers:

```html
<template>
  <div>
    <!-- Prevent default behavior -->
    <a @click.prevent="handleClick" href="/somewhere">Click me</a>
    
    <!-- Stop event propagation -->
    <div @click="outer">
      <button @click.stop="inner">Won't trigger outer</button>
    </div>
    
    <!-- Only trigger once -->
    <button @click.once="initialize">Initialize</button>
    
    <!-- Capture phase -->
    <div @click.capture="handleCapture">
      <button>Click me</button>
    </div>
    
    <!-- Self only (event.target === currentTarget) -->
    <div @click.self="handleSelf">
      <p>This won't trigger the handler</p>
    </div>
  </div>
</template>
```

### Key Modifiers

Listen for specific keys with key modifiers:

```html
<template>
  <div>
    <!-- Specific keys -->
    <input @keyup.enter="submit">
    <input @keyup.esc="cancel">
    <input @keyup.space="togglePlay">
    <input @keyup.tab="nextField">
    
    <!-- Key codes -->
    <input @keyup.13="submit">
    
    <!-- System modifiers -->
    <input @keyup.ctrl.enter="saveAndContinue">
    <input @keyup.shift.tab="previousField">
    <input @keyup.alt.s="save">
    <input @keyup.meta.a="selectAll">
    
    <!-- Mouse button modifiers -->
    <div @click.left="leftClick">
    <div @click.right="rightClick">
    <div @click.middle="middleClick">
  </div>
</template>
```

## The $event Object

Access the native event object using the special `$event` property:

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
      @cancel="cancelEdit">
    </x-user-form>
    
    <x-notification 
      @close="hideNotification"
      x-show="showNotification">
      User saved successfully!
    </x-notification>
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

## Advanced Event Patterns

### Debounced Events

Debounce events to prevent excessive API calls:

```html
<template>
  <div>
    <input 
      @input="debouncedSearch" 
      x-model="searchTerm" 
      placeholder="Search users...">
    
    <div x-show="loading">Searching...</div>
    
    <ul>
      <li x-for="user in searchResults" x-text="user.name"></li>
    </ul>
  </div>
</template>

<script>
export default class {
  initialize() {
    this.searchTerm = ''
    this.searchResults = []
    this.loading = false
    this.debounceTimer = null
  }
  
  debouncedSearch() {
    clearTimeout(this.debounceTimer)
    
    this.debounceTimer = setTimeout(() => {
      this.performSearch()
    }, 300)
  }
  
  async performSearch() {
    if (this.searchTerm.length < 2) {
      this.searchResults = []
      return
    }
    
    this.loading = true
    
    try {
      const response = await fetch(`/api/search?q=${this.searchTerm}`)
      this.searchResults = await response.json()
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      this.loading = false
    }
  }
}
</script>
```

### Long Press Events

Implement custom long press events:

```html
<template>
  <div>
    <button 
      @mousedown="startLongPress" 
      @mouseup="cancelLongPress" 
      @mouseleave="cancelLongPress"
      @touchstart="startLongPress"
      @touchend="cancelLongPress"
      :class="{ 'long-pressed': isLongPressed }">
      Hold me for context menu
    </button>
    
    <div x-show="showContextMenu" class="context-menu">
      <button @click="edit">Edit</button>
      <button @click="delete">Delete</button>
      <button @click="share">Share</button>
    </div>
  </div>
</template>

<script>
export default class {
  initialize() {
    this.isLongPressed = false
    this.showContextMenu = false
    this.longPressTimer = null
  }
  
  startLongPress() {
    this.longPressTimer = setTimeout(() => {
      this.isLongPressed = true
      this.showContextMenu = true
      navigator.vibrate?.(50) // Haptic feedback on mobile
    }, 500)
  }
  
  cancelLongPress() {
    clearTimeout(this.longPressTimer)
    this.isLongPressed = false
  }
  
  edit() {
    this.showContextMenu = false
    // Edit logic
  }
  
  delete() {
    this.showContextMenu = false
    // Delete logic
  }
  
  share() {
    this.showContextMenu = false
    // Share logic
  }
}
</script>
```

### Window and Document Events

Listen to window and document events:

```html
<template>
  <div>
    <div class="scroll-indicator" :style="{ width: scrollPercentage + '%' }"></div>
    
    <div x-show="isOnline" class="status online">Online</div>
    <div x-show="!isOnline" class="status offline">Offline</div>
    
    <p x-text="`Window size: ${windowWidth}x${windowHeight}`"></p>
  </div>
</template>

<script>
export default class {
  initialize() {
    this.scrollPercentage = 0
    this.isOnline = navigator.onLine
    this.windowWidth = window.innerWidth
    this.windowHeight = window.innerHeight
    
    this.setupGlobalListeners()
  }
  
  setupGlobalListeners() {
    // Scroll progress
    window.addEventListener('scroll', () => {
      const scrolled = window.scrollY
      const total = document.documentElement.scrollHeight - window.innerHeight
      this.scrollPercentage = (scrolled / total) * 100
    })
    
    // Online/offline status
    window.addEventListener('online', () => {
      this.isOnline = true
    })
    
    window.addEventListener('offline', () => {
      this.isOnline = false
    })
    
    // Window resize
    window.addEventListener('resize', () => {
      this.windowWidth = window.innerWidth
      this.windowHeight = window.innerHeight
    })
  }
  
  teardown() {
    // Clean up listeners when component is destroyed
    window.removeEventListener('scroll', this.handleScroll)
    window.removeEventListener('online', this.handleOnline)
    window.removeEventListener('offline', this.handleOffline)
    window.removeEventListener('resize', this.handleResize)
  }
}
</script>
```

## Best Practices

### 1. Use Event Delegation for Dynamic Content
Instead of adding listeners to each item, use event delegation on a parent element.

### 2. Clean Up Event Listeners
Always remove event listeners in the `teardown()` method to prevent memory leaks.

### 3. Debounce Expensive Operations
Use debouncing for search, auto-save, and other expensive operations.

### 4. Prefer Custom Events for Component Communication
Use `$emit()` and custom events instead of direct method calls between components.

### 5. Handle Errors Gracefully
Always wrap async event handlers in try-catch blocks.

Peak.js event handling provides a powerful and intuitive way to create interactive applications while maintaining clean, declarative code.