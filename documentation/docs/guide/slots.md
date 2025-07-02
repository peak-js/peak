# Slots

Slots allow you to create flexible, reusable components by letting parent components pass content into specific areas of child components. Peak.js supports both default slots and named slots, similar to Vue.js.

## Basic Slot Usage

### Default Slots

A default slot accepts any content passed as children to the component:

```html
<!-- components/x-card.html -->
<template>
  <div class="card">
    <div class="card-body">
      <slot></slot> <!-- Content will be inserted here -->
    </div>
  </div>
</template>

<style>
.card {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
</style>
```

Usage:

```html
<x-card>
  <h2>Card Title</h2>
  <p>This content will appear inside the slot.</p>
  <button>Action</button>
</x-card>
```

Result:
```html
<x-card>
  <div class="card">
    <div class="card-body">
      <h2>Card Title</h2>
      <p>This content will appear inside the slot.</p>
      <button>Action</button>
    </div>
  </div>
</x-card>
```

## Named Slots

Named slots allow you to define multiple insertion points with specific names:

```html
<!-- components/x-modal.html -->
<template>
  <div class="modal-backdrop">
    <div class="modal">
      <header class="modal-header">
        <slot name="header"></slot>
      </header>
      
      <main class="modal-body">
        <slot></slot> <!-- Default slot -->
      </main>
      
      <footer class="modal-footer">
        <slot name="footer"></slot>
      </footer>
    </div>
  </div>
</template>

<style>
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal {
  background: white;
  border-radius: 8px;
  max-width: 500px;
  width: 90%;
}

.modal-header, .modal-footer {
  padding: 16px;
  border-bottom: 1px solid #eee;
}

.modal-footer {
  border-bottom: none;
  border-top: 1px solid #eee;
}

.modal-body {
  padding: 16px;
}
</style>
```

Usage with named slots:

```html
<x-modal>
  <!-- Named slot content -->
  <template slot="header">
    <h2>Confirm Delete</h2>
  </template>
  
  <!-- Default slot content -->
  <p>Are you sure you want to delete this item? This action cannot be undone.</p>
  
  <!-- Named slot content -->
  <template slot="footer">
    <button @click="cancel">Cancel</button>
    <button @click="confirm" class="danger">Delete</button>
  </template>
</x-modal>
```

## Slot Content with Data

You can pass reactive data and use directives within slot content:

```html
<!-- Parent component -->
<template>
  <x-user-card>
    <template slot="header">
      <h3 x-text="user.name"></h3>
      <span x-text="user.role" class="role"></span>
    </template>
    
    <p x-text="user.bio"></p>
    
    <template slot="actions">
      <button @click="editUser" x-show="canEdit">Edit</button>
      <button @click="deleteUser" x-show="canDelete">Delete</button>
    </template>
  </x-user-card>
</template>

<script>
export default class {
  initialize() {
    this.user = {
      name: "Alice Johnson",
      role: "Developer",
      bio: "Full-stack developer with 5 years of experience."
    }
    this.canEdit = true
    this.canDelete = false
  }
  
  editUser() {
    // Edit logic
  }
  
  deleteUser() {
    // Delete logic
  }
}
</script>
```

## Fallback Content

You can provide fallback content that appears when no slot content is provided:

```html
<!-- components/x-button.html -->
<template>
  <button class="btn" :class="variant">
    <slot>Click me</slot> <!-- Fallback content -->
  </button>
</template>

<script>
export default class {
  static props = ['variant']
  
  initialize() {
    this.variant = this.variant || 'primary'
  }
}
</script>
```

Usage:

```html
<!-- Uses fallback content -->
<x-button></x-button>

<!-- Overrides with custom content -->
<x-button>
  Save Changes
</x-button>
```

## Advanced Slot Patterns

### Conditional Slots

You can conditionally render slots based on whether content is provided:

```html
<!-- components/x-article.html -->
<template>
  <article>
    <header x-if="hasHeaderSlot">
      <slot name="header"></slot>
    </header>
    
    <div class="content">
      <slot></slot>
    </div>
    
    <footer x-if="hasFooterSlot">
      <slot name="footer"></slot>
    </footer>
  </article>
</template>

<script>
export default class {
  mounted() {
    // Check if slot content exists
    this.hasHeaderSlot = this._namedSlots?.header?.trim().length > 0
    this.hasFooterSlot = this._namedSlots?.footer?.trim().length > 0
  }
}
</script>
```

### Nested Slots

Slots can contain other components with their own slots:

```html
<!-- Parent -->
<x-layout>
  <template slot="sidebar">
    <x-nav>
      <template slot="brand">
        <img src="/logo.png" alt="Logo">
      </template>
      
      <a href="/">Home</a>
      <a href="/about">About</a>
    </x-nav>
  </template>
  
  <x-main-content>
    <h1>Welcome!</h1>
    <p>This is the main content area.</p>
  </x-main-content>
</x-layout>
```

## Real-World Example: Accordion Component

Here's a complete example of an accordion component using slots:

```html
<!-- components/x-accordion.html -->
<template>
  <div class="accordion">
    <button class="accordion-header" @click="toggle" :class="{ active: isOpen }">
      <slot name="header"></slot>
      <span class="icon" x-text="isOpen ? '−' : '+'"></span>
    </button>
    
    <div class="accordion-content" x-show="isOpen" x-transition>
      <div class="accordion-body">
        <slot></slot>
      </div>
    </div>
  </div>
</template>

<script>
export default class {
  static props = ['open']
  
  initialize() {
    this.isOpen = this.open === 'true' || this.open === true
  }
  
  toggle() {
    this.isOpen = !this.isOpen
    this.$emit('toggle', { open: this.isOpen })
  }
}
</script>

<style>
.accordion {
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-bottom: 8px;
}

.accordion-header {
  width: 100%;
  padding: 16px;
  background: #f5f5f5;
  border: none;
  text-align: left;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.accordion-header:hover {
  background: #e9e9e9;
}

.accordion-header.active {
  background: #007acc;
  color: white;
}

.accordion-content {
  overflow: hidden;
}

.accordion-body {
  padding: 16px;
}

.icon {
  font-family: monospace;
  font-size: 18px;
  font-weight: bold;
}
</style>
```

Usage:

```html
<x-accordion>
  <template slot="header">
    <strong>Frequently Asked Questions</strong>
  </template>
  
  <div>
    <h4>How do I get started?</h4>
    <p>Simply include Peak.js in your HTML file and start writing components!</p>
    
    <h4>Do I need a build step?</h4>
    <p>No! Peak.js works directly in the browser without any build tools.</p>
  </div>
</x-accordion>

<x-accordion open="true">
  <template slot="header">
    <strong>Pricing Information</strong>
  </template>
  
  <p>Peak.js is completely free and open source under the MIT license.</p>
</x-accordion>
```

Slots are a powerful feature that enables true component composition in Peak.js. They allow you to create flexible, reusable components that can adapt to different use cases while maintaining clean separation of concerns.
