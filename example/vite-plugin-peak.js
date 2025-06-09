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
  
  // Extract style from HTML content
  const extractStyle = (content) => {
    const parsed = parseHtml(content);
    const styleTag = parsed.querySelector('style');
    return styleTag ? styleTag.textContent.trim() : '';
  };
  
  // Main virtual module content
  const generateMainModule = (componentPaths) => {
    const imports = [];
    const registrations = [];
    const assignments = [];
    
    for (const { virtualPath, jsPath } of componentPaths) {
      const varName = `comp_${virtualPath.replace(/[^a-zA-Z0-9]/g, '_')}`;
      imports.push(`import * as ${varName} from '${jsPath}';`);
      registrations.push(`componentModules['${virtualPath}'] = ${varName};`);
      assignments.push(`  '${virtualPath}': ${varName}.html`);
    }
    
    // Inline the HTML slurper functionality
    const slurperCode = `
      // Map of Vite-bundled component modules
      const componentModules = {};
      
      // Get HTML content for a component
      function getComponentHTML(path) {
        // If we have a bundled module for this component, use its HTML content
        if (componentModules[path]) {
          if (componentModules[path].html) {
            console.log(\`[peak] Using bundled HTML for \${path}\`);
            return componentModules[path].html;
          }
        }
        
        // Otherwise, fall back to the __pkcache or fetch
        if (window.__pkcache?.[path]) {
          console.log(\`[peak] Using cached HTML for \${path}\`);
        }
        return window.__pkcache?.[path];
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
      
      // HMR support for updating component styles
      function updateComponentStyle(path, newStyle) {
        const tagName = window.__pkComponentTags?.[path];
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
      
      // Initialize __pkcache if not exists
      window.__pkcache = window.__pkcache || {};
      
      // Track component tags for HMR
      window.__pkComponentTags = {};
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
      
      // Legacy support for direct HTML access
      window.__pkcache = { 
        ${assignments.join(',\n')}
      };
      
      // Register component tags for HMR
      window.__pkComponentTags = {
        ${tagMappings.join(',\n')}
      };
      
      // Expose methods globally
      window.getComponentHTML = getComponentHTML;
      window.getComponentClass = getComponentClass;
      window.listRegisteredComponents = listRegisteredComponents;
      window.updateComponentStyle = updateComponentStyle;
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
      
      // Extract the style from the updated file
      const content = fs.readFileSync(ctx.file, 'utf8');
      const newStyle = extractStyle(content);
      
      // Send HMR update to update the style in the browser
      ctx.server.ws.send({
        type: 'custom',
        event: 'peak:style-update',
        data: {
          path: componentPath,
          style: newStyle
        }
      });
      
      // Regenerate the component module for future loads
      createComponentModules();
      
      // Return an empty array to tell Vite we'll handle the update ourselves
      return [];
    },
    
    transformIndexHtml(html) {
      // Inject HMR handler for component styles
      return {
        html,
        tags: [
          {
            tag: 'script',
            injectTo: 'body',
            children: `
              if (import.meta.hot) {
                import.meta.hot.on('peak:style-update', ({ path, style }) => {
                  if (window.updateComponentStyle) {
                    const success = window.updateComponentStyle(path, style);
                    if (success) {
                      console.log('[peak] HMR: Successfully updated styles for ' + path);
                    } else {
                      console.warn('[peak] HMR: Failed to update styles for ' + path);
                      // Force full reload if style update failed
                      import.meta.hot.invalidate();
                    }
                  } else {
                    console.warn('[peak] HMR: updateComponentStyle not available, forcing full reload');
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