# Templates

Template expressions are plain JavaScript evaluated in the context of the component. Use `this.` to access component properties and methods. Variables introduced by `x-for` are local variables and don't need `this.`.

## x-if

Conditionally render a block

```html
<img x-if="this.loading" src="spinner.svg">
```

Also available are `x-else-if` and `x-else`

```html
<template x-if="this.loading">
  <img src="spinner.svg">
</template>

<template x-else-if="this.error">
  <img src="error.svg">
</template>

<template x-else>
  <x-content />
</template>
```

## x-for

Render some HTML for each item in an array. The iterable is a component property; the loop variable is a plain local variable.

```html
<ul>
  <li x-for="item in this.items">
    <span x-text="item.title" />
  </li>
</ul>
```

## x-text

Set the text content of an element

```html
<span x-text="`Hello, ${this.name}`" />
```

## x-html

Set the HTML content of an element

```html
<div x-html="this.markdown.render('# Page title')"></div>
```

## x-show

Set the visibility of an element

```html
<div x-show="this.open">Content...</div>
```

## x-model

Two-way binding for form inputs. The value is a component property reference:

```html
<input x-model="this.query">
<select x-model="this.city">...</select>
<input type="checkbox" x-model="this.enabled">
```

## x-ref

Refer to an HTML element via `$refs`

```html
<input x-ref="searchInput">
<button @click="this.$refs.searchInput.focus()">Search</button>
```
