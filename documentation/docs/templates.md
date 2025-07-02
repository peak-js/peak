# Templates

## x-if

Conditionally render a block

```html
<img x-if="loading" src="spinner.svg">
```

Also available are `x-if-else` and `x-else`

```html
<template x-if="loading">
  <img src="spinner.svg">
</template>

<template x-else-if="error">
  <img src="error.svg">
</template>

<template x-else>
  <x-content />
</template>
```

## x-for

Render some HTML for each item in an array

```html
<ul>
  <li x-for="item in items">
    <span x-text="item.title" />
  </li>
</ul>
```

## x-text

Set the text content of an element

```html
<span x-text="`Hello, ${name}`" />
```

## x-html

Set the HTML content of an element

```html
<div x-html="markdown.render('# Page title')"></div>
```

## x-show

Set the visibility of an element

```html
<div x-show="open">Content...</div>
```

## x-ref

Refer to an HTML element via `$refs`

```html
<input x-ref="searchInput">
<button @click="$refs.searchInput.focus()">Search</button>
```
