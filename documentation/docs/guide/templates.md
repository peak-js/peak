# Templates

Peak.js provides a set of template directives that make it easy to create dynamic, reactive user interfaces. These directives follow a familiar syntax similar to Vue.js and Alpine.js.

## Text and HTML Content

### x-text

The `x-text` directive sets the text content of an element:

```html
<template>
  <div>
    <h1 x-text="title"></h1>
    <p x-text="`Hello, ${name}!`"></p>
    <span x-text="count + ' items'"></span>
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
    <div x-html="richContent"></div>
    <div x-html="markdown.render(post.content)"></div>
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
    <p x-if="user.isLoggedIn">Welcome back, <span x-text="user.name"></span>!</p>
    <p x-if="!user.isLoggedIn">Please log in to continue.</p>

    <!-- With template wrapper -->
    <template x-if="showAdvancedOptions">
      <div class="advanced-panel">
        <h3>Advanced Settings</h3>
        <input type="checkbox" x-model="enableDebug"> Enable Debug Mode
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
    <div x-if="status === 'loading'" class="spinner">Loading...</div>
    <div x-else-if="status === 'error'" class="error">
      <p>Something went wrong: <span x-text="errorMessage"></span></p>
    </div>
    <div x-else-if="status === 'empty'" class="empty">
      <p>No results found.</p>
    </div>
    <div x-else>
      <ul>
        <li x-for="item in items" x-text="item.name"></li>
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
    <button @click="togglePanel">Toggle Panel</button>

    <!-- Element stays in DOM, just hidden/shown -->
    <div x-show="showPanel" class="panel">
      <p>This panel can be toggled!</p>
    </div>

    <!-- With transition -->
    <div x-show="showModal" x-transition class="modal">
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
      <li x-for="item in items" x-text="item"></li>
    </ul>

    <!-- With index -->
    <ol>
      <li x-for="(item, index) in items">
        <span x-text="index + 1"></span>: <span x-text="item"></span>
      </li>
    </ol>

    <!-- Object iteration -->
    <dl>
      <template x-for="(value, key) in userProfile">
        <div>
          <dt x-text="key"></dt>
          <dd x-text="value"></dd>
        </div>
      </template>
    </dl>

    <!-- Complex objects -->
    <div class="user-grid">
      <div x-for="user in users" class="user-card" :key="user.id">
        <img :src="user.avatar" :alt="user.name">
        <h3 x-text="user.name"></h3>
        <p x-text="user.email"></p>
        <button @click="editUser(user)">Edit</button>
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
    <div x-for="todo in todos" :key="todo.id">
      <input type="checkbox" x-model="todo.completed">
      <span x-text="todo.text"></span>
    </div>

    <!-- Also good: Using index when items don't change order -->
    <div x-for="(item, index) in staticList" :key="index">
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
    <!-- Text inputs -->
    <input x-model="user.name" placeholder="Name">
    <textarea x-model="user.bio" placeholder="Bio"></textarea>

    <!-- Checkboxes -->
    <label>
      <input type="checkbox" x-model="user.isActive"> Active
    </label>

    <!-- Multiple checkboxes -->
    <div>
      <label><input type="checkbox" x-model="skills" value="JavaScript"> JavaScript</label>
      <label><input type="checkbox" x-model="skills" value="Python"> Python</label>
      <label><input type="checkbox" x-model="skills" value="Rust"> Rust</label>
    </div>

    <!-- Radio buttons -->
    <div>
      <label><input type="radio" x-model="theme" value="light"> Light</label>
      <label><input type="radio" x-model="theme" value="dark"> Dark</label>
      <label><input type="radio" x-model="theme" value="auto"> Auto</label>
    </div>

    <!-- Select dropdown -->
    <select x-model="user.country">
      <option value="">Select Country</option>
      <option value="us">United States</option>
      <option value="ca">Canada</option>
      <option value="uk">United Kingdom</option>
    </select>

    <!-- Multiple select -->
    <select x-model="selectedCategories" multiple>
      <option value="tech">Technology</option>
      <option value="design">Design</option>
      <option value="business">Business</option>
    </select>

    <!-- Number input -->
    <input type="number" x-model="user.age" min="0" max="120">

    <!-- Range slider -->
    <input type="range" x-model="volume" min="0" max="100">
    <span x-text="volume + '%'"></span>
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
    <input x-model="username" placeholder="Username">

    <!-- Number input - value is stored as string -->
    <input type="number" x-model="price" step="0.01">

    <!-- Use JavaScript to convert to number if needed -->
    <input type="number" x-model="quantity" @input="quantity = parseInt(quantity)">
  </div>
</template>
```

## Element References

### x-ref

Create references to DOM elements:

```html
<template>
  <div>
    <input x-ref="searchInput" placeholder="Search...">
    <button @click="focusSearch">Focus Search</button>

    <video x-ref="videoPlayer" controls>
      <source src="video.mp4" type="video/mp4">
    </video>
    <button @click="playVideo">Play</button>
    <button @click="pauseVideo">Pause</button>

    <canvas x-ref="chartCanvas" width="400" height="200"></canvas>
  </div>
</template>

<script>
export default class {
  mounted() {
    // Access refs after component is mounted
    this.drawChart()
  }

  focusSearch() {
    this.$refs.searchInput.focus()
  }

  playVideo() {
    this.$refs.videoPlayer.play()
  }

  pauseVideo() {
    this.$refs.videoPlayer.pause()
  }

  drawChart() {
    const canvas = this.$refs.chartCanvas
    const ctx = canvas.getContext('2d')
    // Draw chart...
  }
}
</script>
```

## Attribute Binding

### Dynamic Attributes

Bind attributes dynamically using `:attribute` syntax:

```html
<template>
  <div>
    <!-- Basic attribute binding -->
    <img :src="imageUrl" :alt="imageDescription">
    <a :href="linkUrl" :target="linkTarget">Visit Site</a>

    <!-- Class binding -->
    <div :class="containerClass">Container</div>
    <button :class="{ active: isActive, disabled: isDisabled }">Button</button>
    <span :class="[baseClass, statusClass]">Status</span>

    <!-- Style binding -->
    <div :style="{ color: textColor, fontSize: fontSize + 'px' }">Styled text</div>
    <div :style="dynamicStyles">Dynamic styles</div>

    <!-- Boolean attributes -->
    <input :disabled="isLoading" :required="isRequired">
    <details :open="showDetails">
      <summary>Click to expand</summary>
      <p>Hidden content</p>
    </details>

    <!-- Data attributes -->
    <div :data-user-id="user.id" :data-role="user.role">User Info</div>

    <!-- ARIA attributes -->
    <button :aria-pressed="isPressed" :aria-label="buttonLabel">
      Toggle
    </button>
  </div>
</template>

<script>
export default class {
  initialize() {
    this.imageUrl = '/hero-image.jpg'
    this.imageDescription = 'Hero image'
    this.linkUrl = 'https://example.com'
    this.linkTarget = '_blank'

    this.isActive = true
    this.isDisabled = false
    this.isLoading = false
    this.isRequired = true
    this.showDetails = false
    this.isPressed = false

    this.textColor = '#333'
    this.fontSize = 16

    this.user = { id: 123, role: 'admin' }
    this.buttonLabel = 'Toggle settings panel'
  }

  get containerClass() {
    return `container ${this.isActive ? 'active' : 'inactive'}`
  }

  get baseClass() {
    return 'status-indicator'
  }

  get statusClass() {
    return this.isActive ? 'online' : 'offline'
  }

  get dynamicStyles() {
    return {
      backgroundColor: this.isActive ? '#4ade80' : '#ef4444',
      padding: '8px 16px',
      borderRadius: '4px'
    }
  }
}
</script>
```

## Advanced Directive Usage

### Combining Directives

Directives can be combined on the same element:

```html
<template>
  <div>
    <!-- Multiple directives on one element -->
    <button 
      x-show="showButton" 
      :class="{ loading: isLoading }" 
      :disabled="isLoading"
      @click="handleClick"
      x-text="buttonText">
    </button>

    <!-- Loop with conditional content -->
    <div x-for="item in items" :key="item.id">
      <h3 x-text="item.title"></h3>
      <p x-if="item.description" x-text="item.description"></p>
      <span x-show="item.isNew" class="badge">New!</span>
    </div>
  </div>
</template>
```

### Dynamic Directive Values

Use computed properties for dynamic directive values:

```html
<template>
  <div>
    <div :class="computedClasses" :style="computedStyles">
      Dynamic element
    </div>

    <input
      :placeholder="computedPlaceholder" 
      :maxlength="computedMaxLength"
      x-model="inputValue">
  </div>
</template>

<script>
export default class {
  initialize() {
    this.theme = 'dark'
    this.size = 'large'
    this.inputValue = ''
    this.fieldType = 'email'
  }

  get computedClasses() {
    return [
      'dynamic-element',
      `theme-${this.theme}`,
      `size-${this.size}`
    ].join(' ')
  }

  get computedStyles() {
    return {
      '--primary-color': this.theme === 'dark' ? '#fff' : '#000',
      transform: `scale(${this.size === 'large' ? 1.2 : 1})`
    }
  }

  get computedPlaceholder() {
    const placeholders = {
      email: 'Enter your email address',
      password: 'Enter a secure password',
      text: 'Enter some text'
    }
    return placeholders[this.fieldType] || 'Enter value'
  }

  get computedMaxLength() {
    return this.fieldType === 'password' ? 128 : 255
  }
}
</script>
```
