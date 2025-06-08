// This module helps peak.js handle component HTML files that have been bundled by Vite

// Map of Vite-bundled component modules
const componentModules = {};

// Register a component module
export function registerComponent(path, moduleExports) {
  componentModules[path] = moduleExports;
}

// Get HTML content for a component
export function getComponentHTML(path) {
  // If we have a bundled module for this component, use its HTML content
  if (componentModules[path]) {
    if (componentModules[path].html) {
      console.log(`[peak] Using bundled HTML for ${path}`);
      return componentModules[path].html;
    }
  }
  
  // Otherwise, fall back to the __pkcache or fetch
  if (window.__pkcache?.[path]) {
    console.log(`[peak] Using cached HTML for ${path}`);
  }
  return window.__pkcache?.[path];
}

// Get a component class
export async function getComponentClass(path, source) {
  // If we have a bundled module for this component, use its default export
  if (componentModules[path]) {
    console.log(`[peak] Using bundled class for ${path}`);
    return componentModules[path].default;
  }
  
  // Otherwise, use the traditional module loading approach
  console.log(`[peak] Loading class for ${path} from source`);
  return await window.loadModule?.(source, path);
}

// For debugging
export function listRegisteredComponents() {
  return Object.keys(componentModules);
}

// Initialize __pkcache if not exists
window.__pkcache = window.__pkcache || {};