import fs from 'fs';
import path from 'path';
import { parse as parseHtml } from 'node-html-parser';

export default function ({ dirs = ['components','views'] } = {}) {
  const virtualModuleId = 'virtual:peak-components';
  const resolvedVirtualModuleId = '\0' + virtualModuleId;
  
  // Component paths to file information mapping
  const componentInfo = new Map();
  
  // Generate JS modules for components
  const createComponentModules = () => {
    // Ensure component directory exists
    const componentsDir = path.resolve(process.cwd(), '.peak-components');
    if (!fs.existsSync(componentsDir)) {
      fs.mkdirSync(componentsDir, { recursive: true });
    }
    
    // Track component paths for the main module
    const componentPaths = [];
    
    // Process each component directory
    for (const dir of dirs) {
      const folder = path.resolve(process.cwd(), dir);
      if (!fs.existsSync(folder)) continue;
      
      const files = fs.readdirSync(folder).filter(f => f.endsWith('.html'));
      
      for (const file of files) {
        const filePath = path.join(folder, file);
        const content = fs.readFileSync(filePath, 'utf8');
        const virtualPath = `/${dir}/${file}`;
        
        // Parse the component HTML
        const parsed = parseHtml(content);
        const scriptTag = parsed.querySelector('script');
        const templateTag = parsed.querySelector('template');
        const styleTag = parsed.querySelector('style');
        
        // Extract parts
        const template = templateTag ? templateTag.innerHTML.trim() : '';
        const style = styleTag ? styleTag.textContent.trim() : '';
        let script = scriptTag ? scriptTag.textContent.trim() : '';
        
        // Store component info for HMR
        componentInfo.set(virtualPath, {
          filePath,
          tagName: `${slugify(virtualPath.replace(/^[^a-z]+|[^a-z]+$|\.html$/g, ''))}-${hsh(virtualPath)}`
        });
        
        // Create a JS module for this component
        const jsContent = [];
        
        // Add original script with default export
        if (script) {
          jsContent.push(script);
          if (!script.includes('export default')) {
            jsContent.push('export default class {}');
          }
        } else {
          jsContent.push('export default class {}');
        }
        
        // Escape for template literals
        const escapeForTemplate = str => str
          .replace(/\\/g, '\\\\')
          .replace(/\`/g, '\\`')
          .replace(/\$\{/g, '\\${');
          
        // Add HTML template and style as exports
        jsContent.push(`
          // Component HTML and style
          export const template = \`${escapeForTemplate(template)}\`;
          export const style = \`${style ? escapeForTemplate(style) : ''}\`;
          export const html = \`${escapeForTemplate(content)}\`;
        `);
        
        // Write the JS module to disk
        const jsFileName = `${dir.replace(/[\/\\]/g, '_')}_${file.replace('.html', '')}.js`;
        const jsFilePath = path.join(componentsDir, jsFileName);
        fs.writeFileSync(jsFilePath, jsContent.join('\n\n'));
        
        // Track for main module
        componentPaths.push({
          virtualPath,
          jsPath: `./.peak-components/${jsFileName}`
        });
      }
    }
    
    return componentPaths;
  };
  
  // Helper function to slugify a string (copied from peak.js)
  function slugify(str) {
    return str.toLowerCase().replace(/[^\w\-]+/g, '-');
  }
  
  // Helper function to hash a string (copied from peak.js)
  function hsh(str) {
    return str.split('').reduce((a, b) => (a << 5) - a + b.charCodeAt(0)|0, 0);
  }
  
  // Extract parts from HTML content
  const extractParts = (content) => {
    const parsed = parseHtml(content);
    const scriptTag = parsed.querySelector('script');
    const styleTag = parsed.querySelector('style');
    const templateTag = parsed.querySelector('template');
    
    return {
      script: scriptTag ? scriptTag.textContent.trim() : '',
      style: styleTag ? styleTag.textContent.trim() : '',
      template: templateTag ? templateTag.innerHTML.trim() : ''
    };
  };
  
  // Main virtual module content
  const generateMainModule = (componentPaths) => {
    const imports = [];
    const registrations = [];
    for (const { virtualPath, jsPath } of componentPaths) {
      const varName = `comp_${virtualPath.replace(/[^a-zA-Z0-9]/g, '_')}`;
      imports.push(`import * as ${varName} from '${jsPath}';`);
      registrations.push(`componentModules['${virtualPath}'] = ${varName};`);
    }
    
    // Inline the HTML slurper functionality
    const slurperCode = `
      // Initialize peak namespace if not exists
      window.__peak = window.__peak || {};
      
      // Map of Vite-bundled component modules
      const componentModules = {};
      
      // Map of component instances for HMR
      const componentInstances = {};
      
      // Get HTML content for a component
      function getComponentHTML(path) {
        // Get component from bundled modules
        if (componentModules[path]?.html) {
          return componentModules[path].html;
        }
        
        console.warn(\`[peak] Component not found in bundle: \${path}\`);
        return null;
      }
      
      // Get a component class
      async function getComponentClass(path, source) {
        // If we have a bundled module for this component, use its default export
        if (componentModules[path]) {
          console.log(\`[peak] Using bundled class for \${path}\`);
          return componentModules[path].default;
        }
        
        // Otherwise, use the traditional module loading approach
        console.log(\`[peak] Loading class for \${path} from source\`);
        return await window.loadModule?.(source, path);
      }
      
      // For debugging
      function listRegisteredComponents() {
        return Object.keys(componentModules);
      }
      
      // Register component instance for HMR
      function registerComponentInstance(instance, tagName) {
        componentInstances[tagName] = componentInstances[tagName] || new Set();
        componentInstances[tagName].add(instance);
        
        // Clean up when element is removed
        const cleanup = () => {
          if (componentInstances[tagName]) {
            componentInstances[tagName].delete(instance);
          }
        };
        
        // Add removal listener
        if (instance._pkUnregister) instance._pkUnregister();
        instance._pkUnregister = cleanup;
      }
      
      // HMR support for updating component styles
      function updateComponentStyle(path, newStyle) {
        const tagName = window.__peak.componentTags?.[path];
        if (!tagName) {
          console.warn(\`[peak] HMR: Cannot find tag for component: \${path}\`);
          return false;
        }
        
        // Find the style element for this component
        const styleSelector = \`style[data-peak-component="\${tagName}"]\`;
        const styleEl = document.head.querySelector(styleSelector);
        if (styleEl) {
          console.log(\`[peak] HMR: Updating styles for \${path}\`);
          styleEl.textContent = \`
            @layer \${tagName} {
              \${tagName} {
                \${newStyle};
              }
              \${tagName} [x-scope],
              \${tagName} [x-scope] * {
                all: revert-layer;
              }
            }
          \`;
          return true;
        } else {
          console.warn(\`[peak] HMR: Style element not found for \${path}\`);
          return false;
        }
      }
      
      // HMR support for updating component scripts
      async function updateComponentScript(path, newScript) {
        const tagName = window.__peak.componentTags?.[path];
        if (!tagName) {
          console.warn(\`[peak] HMR: Cannot find tag for component: \${path}\`);
          return false;
        }
        
        try {
          // Load the new component class using the same function peak.js uses
          const NewClass = await (window.loadModule ? 
            window.loadModule(newScript, path) : 
            componentModules[path]?.default);
            
          if (!NewClass) {
            console.warn(\`[peak] HMR: Failed to load new class for \${path}\`);
            return false;
          }
          
          // Update in component modules registry
          if (componentModules[path]) {
            componentModules[path].default = NewClass;
          }
          
          // Get the existing class constructor
          const Constructor = customElements.get(tagName);
          if (!Constructor) {
            console.warn(\`[peak] HMR: Cannot find constructor for \${tagName}\`);
            return false;
          }
          
          // Update prototype methods on the existing class
          Object.getOwnPropertyNames(NewClass.prototype)
            .filter(n => n !== 'constructor')
            .forEach(n => {
              const descriptor = Object.getOwnPropertyDescriptor(NewClass.prototype, n);
              Object.defineProperty(Constructor.prototype, n, descriptor);
            });
          
          // Re-render all instances
          const instances = document.querySelectorAll(tagName);
          instances.forEach(instance => {
            if (typeof instance.$render === 'function') {
              console.log(\`[peak] HMR: Re-rendering \${tagName} instance\`);
              instance.$render();
            }
          });
          
          console.log(\`[peak] HMR: Successfully updated script for \${path} (\${instances.length} instances)\`);
          return true;
        } catch (err) {
          console.error(\`[peak] HMR: Error updating script for \${path}\`, err);
          return false;
        }
      }
      
      // HMR support for updating component templates
      function updateComponentTemplate(path, template, html) {
        const tagName = window.__peak.componentTags?.[path];
        if (!tagName) {
          console.warn(\`[peak] HMR: Cannot find tag for component: \${path}\`);
          return false;
        }
        
        try {
          // Update in component modules registry
          if (componentModules[path]) {
            componentModules[path].template = template;
            componentModules[path].html = html;
          }
          
          // Re-render all instances
          const instances = document.querySelectorAll(tagName);
          instances.forEach(instance => {
            if (typeof instance.$render === 'function') {
              console.log(\`[peak] HMR: Re-rendering \${tagName} instance with new template\`);
              instance.$render();
            }
          });
          
          console.log(\`[peak] HMR: Successfully updated template for \${path} (\${instances.length} instances)\`);
          return true;
        } catch (err) {
          console.error(\`[peak] HMR: Error updating template for \${path}\`, err);
          return false;
        }
      }
      
      // Move everything to __peak namespace
      window.__peak.componentModules = componentModules;
      window.__peak.componentInstances = componentInstances;
      window.__peak.componentTags = {};
    `;
    
    // Add tag mapping for HMR
    const tagMappings = componentPaths.map(({ virtualPath }) => {
      const info = componentInfo.get(virtualPath);
      if (info && info.tagName) {
        return `  '${virtualPath}': '${info.tagName}'`;
      }
      return '';
    }).filter(Boolean);
    
    return `
      ${slurperCode}
      
      ${imports.join('\n')}
      
      // Register components
      ${registrations.join('\n')}
      
      // Register component tags for HMR
      window.__peak.componentTags = {
        ${tagMappings.join(',\n')}
      };
      
      // Expose methods in peak namespace
      window.__peak.getComponentHTML = getComponentHTML;
      window.__peak.getComponentClass = getComponentClass;
      window.__peak.listComponents = listRegisteredComponents;
      window.__peak.registerInstance = registerComponentInstance;
      window.__peak.updateStyle = updateComponentStyle;
      window.__peak.updateScript = updateComponentScript;
      window.__peak.updateTemplate = updateComponentTemplate;
    `;
  };
  
  let componentPaths = [];
  
  return {
    name: 'vite-plugin-peak',
    
    buildStart() {
      // Generate component modules
      componentPaths = createComponentModules();
    },
    
    buildEnd() {
      // Clean up the component directory at the end of the build
      try {
        const componentsDir = path.resolve(process.cwd(), '.peak-components');
        if (fs.existsSync(componentsDir)) {
          fs.rmSync(componentsDir, { recursive: true, force: true });
          console.log('[peak] Cleaned up component directory');
        }
      } catch (e) {
        console.warn('[peak] Failed to clean up component directory:', e);
      }
    },
    
    resolveId(id) {
      if (id === virtualModuleId) {
        return resolvedVirtualModuleId;
      }
    },
    
    load(id) {
      if (id === resolvedVirtualModuleId) {
        return generateMainModule(componentPaths);
      }
    },
    
    config(config, { command }) {
      config ||= {};
      config.optimizeDeps ||= {};
      config.optimizeDeps.entries ||= [];
      config.optimizeDeps.entries.push(virtualModuleId);
      
      return config;
    },
    
    handleHotUpdate(ctx) {
      // Only process HTML files from our component directories
      if (!ctx.file.endsWith('.html')) return;
      
      // Check if this is one of our component files
      let isComponentFile = false;
      let componentPath = null;
      
      for (const dir of dirs) {
        const dirPath = path.resolve(process.cwd(), dir);
        if (ctx.file.startsWith(dirPath)) {
          const relativePath = path.relative(dirPath, ctx.file);
          componentPath = `/${dir}/${relativePath}`;
          isComponentFile = true;
          break;
        }
      }
      
      if (!isComponentFile) return;
      
      // Extract all parts from the updated file
      const content = fs.readFileSync(ctx.file, 'utf8');
      const { script, style, template } = extractParts(content);
      
      // Send HMR updates to the browser
      
      // Always update style if it exists
      ctx.server.ws.send({
        type: 'custom',
        event: 'peak:style-update',
        data: {
          path: componentPath,
          style
        }
      });
      
      // Update script if it exists
      if (script) {
        ctx.server.ws.send({
          type: 'custom',
          event: 'peak:script-update',
          data: {
            path: componentPath,
            script
          }
        });
      }
      
      // Update template if it exists
      if (template) {
        ctx.server.ws.send({
          type: 'custom',
          event: 'peak:template-update',
          data: {
            path: componentPath,
            template,
            html: content
          }
        });
      }
      
      // Regenerate the component module for future loads
      createComponentModules();
      
      // Return an empty array to tell Vite we'll handle the update ourselves
      return [];
    },
    
    transformIndexHtml(html) {
      // Inject HMR handlers for component updates
      return {
        html,
        tags: [
          {
            tag: 'script',
            injectTo: 'body',
            children: `
              if (import.meta.hot) {
                // Style updates
                import.meta.hot.on('peak:style-update', ({ path, style }) => {
                  if (window.__peak?.updateStyle) {
                    const success = window.__peak.updateStyle(path, style);
                    if (success) {
                      console.log('[peak] HMR: Successfully updated styles for ' + path);
                    } else {
                      console.warn('[peak] HMR: Failed to update styles for ' + path);
                      // Force full reload if style update failed
                      import.meta.hot.invalidate();
                    }
                  } else {
                    console.warn('[peak] HMR: Style update handler not available, forcing full reload');
                    import.meta.hot.invalidate();
                  }
                });
                
                // Script updates
                import.meta.hot.on('peak:script-update', async ({ path, script }) => {
                  if (window.__peak?.updateScript) {
                    const success = await window.__peak.updateScript(path, script);
                    if (success) {
                      console.log('[peak] HMR: Successfully updated script for ' + path);
                    } else {
                      console.warn('[peak] HMR: Failed to update script for ' + path);
                      // Force full reload if script update failed
                      import.meta.hot.invalidate();
                    }
                  } else {
                    console.warn('[peak] HMR: Script update handler not available, forcing full reload');
                    import.meta.hot.invalidate();
                  }
                });
                
                // Template updates
                import.meta.hot.on('peak:template-update', ({ path, template, html }) => {
                  if (window.__peak?.updateTemplate) {
                    const success = window.__peak.updateTemplate(path, template, html);
                    if (success) {
                      console.log('[peak] HMR: Successfully updated template for ' + path);
                    } else {
                      console.warn('[peak] HMR: Failed to update template for ' + path);
                      // Force full reload if template update failed
                      import.meta.hot.invalidate();
                    }
                  } else {
                    console.warn('[peak] HMR: Template update handler not available, forcing full reload');
                    import.meta.hot.invalidate();
                  }
                });
              }
            `
          }
        ]
      };
    }
  };
}
