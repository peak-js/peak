# Introduction

Peak.js is a lightweight, reactive web framework that lets you build modern web applications without the complexity of build tools, bundlers, or complex setup processes. It's designed to feel familiar to developers coming from Vue.js or Alpine.js while leveraging the power of native Web Components.

## Why Peak.js?

### Zero Setup Required
Just include Peak.js in your HTML file and start writing components. No build step, no configuration files, no complex toolchain (unless you want).

### Reactive by Design
Built-in reactivity system automatically updates your UI when data changes. No manual DOM manipulation required.

### Native Web Components
Based on standard Web Components APIs, ensuring forward compatibility and interoperability with other frameworks.

### Lightweight
Only ~5kb gzipped, Peak.js gives you powerful features with a minimum of complexity.

## Key Features

- **Single File Components**: Write your template, script, and styles in one HTML file
- **Reactive Data**: Automatic UI updates when data changes
- **Scoped CSS**: Styles are automatically scoped to prevent leakage
- **Server-Side Rendering**: Built-in SSR support for better SEO and performance
- **Template Directives**: Familiar directives like `x-if`, `x-for`, `x-text`, etc.
- **Event Handling**: Simple `@click` syntax for handling events
- **Slots**: Component composition with named and default slots
- **Routing**: Optional client-side routing with the History API

## Philosophy

Peak.js tries to make easy things easy, and hard things at least approachable. Common patterns should have as little boiler-plate as possible -- but not too little as to be mysterious! If Vue's "Options API" is too resistant to abstraction, and Vue's "Composition API" is lower-level than you might want for every day use, then Peak.js tries to strike a balance somewhere in the middle.  If you like Alpine.js but wish you could have reusable components, then this might be for you.

## Getting Started

Ready to build your first Peak.js application? Let's start with the [Quick Start guide](/guide/quick-start).
