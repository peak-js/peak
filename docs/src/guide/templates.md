# Templates

Peak.js provides a set of template directives that make it easy to create dynamic, reactive user interfaces. These directives follow a familiar syntax similar to Vue.js and Alpine.js.

## Expressions

Directive values and `:attr` bindings are plain JavaScript expressions evaluated in the context of the component. Since `this` refers to the component instance, use `this.` to access component properties and methods:

```html
<span x-text="this.count"></span>
<button @click="this.increment()">+</button>
<div :class="this.isActive ? 'active' : ''">...</div>
```

One exception: variables introduced by `x-for` loops are local JavaScript variables and don't need `this.`:

```html
<template x-for="item in this.items">
  <li x-text="item.name"></li>  <!-- item is a local variable, no this. -->
</template>
```

## Text and HTML Content

### x-text

The `x-text` directive sets the text content of an element:

```html
<template>
  <div>
    <h1 x-text="this.title"></h1>
    <p x-text="`Hello, ${this.name}!`"></p>
    <span x-text="this.count + ' items'"></span>
  </div>
</template>

<script>
export default class {
  initialize() {
    this.title = "Welcome to Peak.js"
    this.name = "Alice"
    this.count = 42
  }
}
</script>
```

### x-html

The `x-html` directive sets the HTML content of an element:

```html
<template>
  <div>
    <div x-html="this.richContent"></div>
    <div x-html="this.markdown.render(this.post.content)"></div>
  </div>
</template>

<script>
export default class {
  initialize() {
    this.richContent = '<strong>Bold text</strong> and <em>italic text</em>'
    this.post = {
      content: '# Markdown Title\n\nThis is **bold** text.'
    }
  }
}
</script>
```

::: warning Security Note
Be careful when using `x-html` with user-generated content to avoid XSS attacks. Always sanitize HTML content from untrusted sources.
:::

## Conditional Rendering

### x-if

Conditionally render elements based on a condition:

```html
<template>
  <div>
    <p x-if="this.user.isLoggedIn">Welcome back, <span x-text="this.user.name"></span>!</p>
    <p x-if="!this.user.isLoggedIn">Please log in to continue.</p>

    <!-- With template wrapper -->
    <template x-if="this.showAdvancedOptions">
      <div class="advanced-panel">
        <h3>Advanced Settings</h3>
        <input type="checkbox" x-model="this.enableDebug"> Enable Debug Mode
      </div>
    </template>
  </div>
</template>
```

### x-else-if and x-else

Chain conditions with `x-else-if` and `x-else`:

```html
<template>
  <div>
    <div x-if="this.status === 'loading'" class="spinner">Loading...</div>
    <div x-else-if="this.status === 'error'" class="error">
      <p>Something went wrong: <span x-text="this.errorMessage"></span></p>
    </div>
    <div x-else-if="this.status === 'empty'" class="empty">
      <p>No results found.</p>
    </div>
    <div x-else>
      <ul>
        <li x-for="item in this.items" x-text="item.name"></li>
      </ul>
    </div>
  </div>
</template>
```

### x-show

Toggle element visibility with CSS display property:

```html
<template>
  <div>
    <button @click="this.togglePanel()">Toggle Panel</button>

    <!-- Element stays in DOM, just hidden/shown -->
    <div x-show="this.showPanel" class="panel">
      <p>This panel can be toggled!</p>
    </div>

    <!-- With transition -->
    <div x-show="this.showModal" x-transition class="modal">
      <p>Modal content with smooth transition</p>
    </div>
  </div>
</template>

<script>
export default class {
  initialize() {
    this.showPanel = false
    this.showModal = false
  }

  togglePanel() {
    this.showPanel = !this.showPanel
  }
}
</script>
```

## List Rendering

### x-for

Render lists of items:

```html
<template>
  <div>
    <!-- Basic loop -->
    <ul>
      <li x-for="item in this.items" x-text="item"></li>
    </ul>

    <!-- With index -->
    <ol>
      <li x-for="item in this.items">
        <span x-text="index + 1"></span>: <span x-text="item"></span>
      </li>
    </ol>

    <!-- Complex objects -->
    <div class="user-grid">
      <div x-for="user in this.users" class="user-card" :key="user.id">
        <img :src="user.avatar" :alt="user.name">
        <h3 x-text="user.name"></h3>
        <p x-text="user.email"></p>
        <button @click="this.editUser(user)">Edit</button>
      </div>
    </div>
  </div>
</template>

<script>
export default class {
  initialize() {
    this.items = ['Apple', 'Banana', 'Cherry']

    this.userProfile = {
      name: 'Alice Johnson',
      email: 'alice@example.com',
      role: 'Developer'
    }

    this.users = [
      { id: 1, name: 'Alice', email: 'alice@example.com', avatar: '/alice.jpg' },
      { id: 2, name: 'Bob', email: 'bob@example.com', avatar: '/bob.jpg' }
    ]
  }

  editUser(user) {
    console.log('Editing user:', user)
  }
}
</script>
```

### Performance with Keys

Use the `:key` attribute for efficient list updates:

```html
<template>
  <div>
    <!-- Good: Using unique keys -->
    <div x-for="todo in this.todos" :key="todo.id">
      <span x-text="todo.text"></span>
    </div>

    <!-- Also good: Using index when items don't change order -->
    <div x-for="item in this.staticList" :key="index">
      <span x-text="item"></span>
    </div>
  </div>
</template>
```

## Form Input Binding

### x-model

Two-way data binding for form inputs:

```html
<template>
  <form>
    <!-- Text input -->
    <input x-model="this.name" placeholder="Name">
    <textarea x-model="this.bio" placeholder="Bio"></textarea>

    <!-- Checkbox -->
    <label>
      <input type="checkbox" x-model="this.isActive"> Active
    </label>

    <!-- Radio buttons -->
    <div>
      <label><input type="radio" x-model="this.theme" value="light"> Light</label>
      <label><input type="radio" x-model="this.theme" value="dark"> Dark</label>
      <label><input type="radio" x-model="this.theme" value="auto"> Auto</label>
    </div>

    <!-- Select dropdown -->
    <select x-model="this.country">
      <option value="">Select Country</option>
      <option value="us">United States</option>
      <option value="ca">Canada</option>
      <option value="uk">United Kingdom</option>
    </select>

    <!-- Range slider -->
    <input type="range" x-model="this.volume" min="0" max="100">
    <span x-text="this.volume + '%'"></span>
  </form>
</template>

<script>
export default class {
  initialize() {
    this.user = {
      name: '',
      bio: '',
      isActive: true,
      country: '',
      age: 25
    }

    this.skills = []
    this.theme = 'auto'
    this.selectedCategories = []
    this.volume = 50
  }
}
</script>
```

### x-model Behavior

The `x-model` directive provides two-way data binding with the following behavior:

- **Text inputs, textareas, selects**: Binds to the `value` property
- **Checkboxes**: Binds to the `checked` property (boolean)
- **Radio buttons**: Sets `checked` to `true` when the input's `value` matches the bound property
- **Updates on input events**: Changes are reflected immediately as the user types or interacts

```html
<template>
  <div>
    <!-- Text input - updates on every keystroke -->
    <input x-model="this.username" placeholder="Username">

    <!-- Number input - value is stored as string, convert if needed -->
    <input type="number" x-model="this.price" step="0.01">
  </div>
</template>
```

## Element References

### x-ref

Create references to DOM elements:

```html
<template>
  <div>
    <video x-ref="videoPlayer" controls>
      <source src="video.mp4" type="video/mp4">
    </video>
    <button @click="this.playVideo()">Play</button>
    <button @click="this.pauseVideo()">Pause</button>
  </div>
</template>

<script>
export default class {
  playVideo() {
    this.$refs.videoPlayer.play()
  }
  pauseVideo() {
    this.$refs.videoPlayer.pause()
  }
}
</script>
```

## Attribute Binding

### Dynamic Attributes

Bind attributes dynamically using a leading `:` before the attribute name.  Dynamic attributes' values are JavaScript expressions, evaluated in the context of the component.

```html
<template>
  <!-- Basic attribute binding -->
  <img :src="this.imageUrl" :alt="this.imageDescription">
  <a :href="this.linkUrl" :target="this.linkTarget">Visit Site</a>

  <!-- Class binding -->
  <div :class="this.containerClass">Container</div>
  <button class="button" :class="{ active: this.isActive, disabled: this.isDisabled }">Button</button>
  <span :class="[this.baseClass, this.statusClass]">Status</span>

  <!-- Style binding -->
  <div :style="{ color: this.textColor, fontSize: this.fontSize + 'px' }">Styled text</div>

  <!-- Boolean attributes -->
  <input :disabled="this.isLoading" :required="this.isRequired">
</template>
```


