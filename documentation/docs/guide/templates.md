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
    <video x-ref="videoPlayer" controls>
      <source src="video.mp4" type="video/mp4">
    </video>
    <button @click="playVideo">Play</button>
    <button @click="pauseVideo">Pause</button>
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
  <img :src="imageUrl" :alt="imageDescription">
  <a :href="linkUrl" :target="linkTarget">Visit Site</a>

  <!-- Class binding -->
  <div :class="containerClass">Container</div>
  <button class="button" :class="{ active: isActive, disabled: isDisabled }">Button</button>
  <span :class="[baseClass, statusClass]">Status</span>

  <!-- Style binding -->
  <div :style="{ color: textColor, fontSize: fontSize + 'px' }">Styled text</div>
  <div :style="dynamicStyles">Dynamic styles</div>

  <!-- Boolean attributes -->
  <input :disabled="isLoading" :required="isRequired">
</template>
```
::: info Expressions and `this`
For simple expressions, as a shorthand you can often omit `this.` when referring to component properties.  Once an expression contains quote characters `` ` ``, `"`, or `'` then the shorthand syntax is not available.
:::


