import fs from 'fs'
import path from 'path'
import { parse as parseHtml } from 'node-html-parser'

export default function ({ dirs = ['components','views'] } = {}) {
  const virtualModuleId = 'virtual:peak-components'
  const resolvedVirtualModuleId = '\0' + virtualModuleId
  
  const componentInfo = new Map()
  
  const createComponentModules = () => {
    const componentsDir = path.resolve(process.cwd(), '.peak-components')
    if (!fs.existsSync(componentsDir)) {
      fs.mkdirSync(componentsDir, { recursive: true })
    }
    
    const componentPaths = []
    
    for (const dir of dirs) {
      const folder = path.resolve(process.cwd(), dir)
      if (!fs.existsSync(folder)) continue
      
      const files = fs.readdirSync(folder).filter(f => f.endsWith('.html'))
      
      for (const file of files) {
        const filePath = path.join(folder, file)
        const content = fs.readFileSync(filePath, 'utf8')
        const virtualPath = `/${dir}/${file}`
        
        const parsed = parseHtml(content)
        const scriptTag = parsed.querySelector('script')
        const templateTag = parsed.querySelector('template')
        const styleTag = parsed.querySelector('style')
        
        const template = templateTag ? templateTag.innerHTML.trim() : '';
        const style = styleTag ? styleTag.textContent.trim() : '';
        let script = scriptTag ? scriptTag.textContent.trim() : '';
        
        componentInfo.set(virtualPath, {
          filePath,
          tagName: `${slugify(virtualPath.replace(/^[^a-z]+|[^a-z]+$|\.html$/g, ''))}-${hsh(virtualPath)}`
        });
        
        const lines = [];
        
        if (script) {
          lines.push(script);
          if (!script.includes('export default')) {
            lines.push('export default class {}');
          }
        } else {
          lines.push('export default class {}');
        }
        
        // Escape for template literals
        const escape = str => str
          .replace(/\\/g, '\\\\')
          .replace(/\`/g, '\\`')
          .replace(/\$\{/g, '\\${')
          
        lines.push(`
          export const template = \`${escape(template)}\`
          export const style = \`${style ? escape(style) : ''}\`
          export const html = \`${escape(content)}\`
        `);
        
        const outputFile = `${dir.replace(/[\/\\]/g, '_')}_${file.replace('.html', '')}.js`
        fs.writeFileSync(path.join(componentsDir, outputFile), lines.join('\n\n'))
        
        componentPaths.push({
          virtualPath,
          jsPath: `./.peak-components/${outputFile}`
        });
      }
    }
    
    return componentPaths
  };
  
  const extractParts = (content) => {
    const parsed = parseHtml(content)
    const scriptTag = parsed.querySelector('script')
    const styleTag = parsed.querySelector('style')
    const templateTag = parsed.querySelector('template')
    
    return {
      script: scriptTag ? scriptTag.textContent.trim() : '',
      style: styleTag ? styleTag.textContent.trim() : '',
      template: templateTag ? templateTag.innerHTML.trim() : ''
    }
  }
  
  const generateMainModule = (componentPaths) => {
    const imports = []
    const registrations = []
    for (const { virtualPath, jsPath } of componentPaths) {
      const varName = `comp_${virtualPath.replace(/[^a-zA-Z0-9]/g, '_')}`
      imports.push(`import * as ${varName} from '${jsPath}';`)
      registrations.push(`componentModules['${virtualPath}'] = ${varName};`)
    }
    
    const readerScript = `
      window.__peak ||= {}
      const componentModules = {}
      const componentInstances = {}
      
      function getComponentHTML(path) {
        if (componentModules[path]?.html) {
          return componentModules[path].html
        }
        
        console.warn(\`[peak] Component not found in bundle: \${path}\`)
        return null
      }
      
      async function getComponentClass(path, source) {
        if (componentModules[path]) {
          console.log(\`[peak] Using bundled class for \${path}\`)
          return componentModules[path].default
        }
      }
      
      function listRegisteredComponents() {
        return Object.keys(componentModules)
      }
      
      function registerComponentInstance(instance, tagName) {
        componentInstances[tagName] = componentInstances[tagName] || new Set()
        componentInstances[tagName].add(instance)
        
        const cleanup = () => {
          if (componentInstances[tagName]) {
            componentInstances[tagName].delete(instance)
          }
        }
        
        if (instance._pkUnregister) instance._pkUnregister()
        instance._pkUnregister = cleanup
      }
      
      function updateComponentStyle(path, newStyle) {
        const tagName = window.__peak.componentTags?.[path]
        if (!tagName) {
          console.warn(\`[peak] HMR: Cannot find tag for component: \${path}\`)
          return false
        }
        
        const styleSelector = \`style[data-peak-component="\${tagName}"]\`
        const styleEl = document.head.querySelector(styleSelector)
        if (styleEl) {
          console.log(\`[peak] HMR: Updating styles for \${path}\`)
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
          console.warn(\`[peak] HMR: Style element not found for \${path}\`)
          return false
        }
      }
      
      async function updateComponentScript(path, newScript) {
        const tagName = window.__peak.componentTags?.[path]
        if (!tagName) {
          console.warn(\`[peak] HMR: Cannot find tag for component: \${path}\`)
          return false
        }
        
        try {
          const _class = await (window.loadModule ? 
            window.loadModule(newScript, path) : 
            componentModules[path]?.default)
            
          if (!_class) {
            console.warn(\`[peak] HMR: Failed to load new class for \${path}\`)
            return false
          }
          
          if (componentModules[path]) {
            componentModules[path].default = _class
          }
          
          const _constructor = customElements.get(tagName)
          if (!_constructor) {
            console.warn(\`[peak] HMR: Cannot find constructor for \${tagName}\`)
            return false
          }
          
          Object.getOwnPropertyNames(_class.prototype)
            .filter(n => n !== 'constructor')
            .forEach(n => {
              const descriptor = Object.getOwnPropertyDescriptor(_class.prototype, n)
              Object.defineProperty(_constructor.prototype, n, descriptor)
            })
          
          const instances = document.querySelectorAll(tagName)
          instances.forEach(instance => {
            if (typeof instance.$render === 'function') {
              console.log(\`[peak] HMR: Re-rendering \${tagName} instance\`)
              instance.$render()
            }
          });
          
          console.log(\`[peak] HMR: Successfully updated script for \${path} (\${instances.length} instances)\`)
          return true
        } catch (err) {
          console.error(\`[peak] HMR: Error updating script for \${path}\`, err)
          return false
        }
      }
      
      function updateComponentTemplate(path, template, html) {
        const tagName = window.__peak.componentTags?.[path]
        if (!tagName) {
          console.warn(\`[peak] HMR: Cannot find tag for component: \${path}\`)
          return false
        }
        
        try {
          if (componentModules[path]) {
            componentModules[path].template = template
            componentModules[path].html = html
          }
          
          const instances = document.querySelectorAll(tagName)
          instances.forEach(instance => {
            if (typeof instance.$render === 'function') {
              console.log(\`[peak] HMR: Re-rendering \${tagName} instance with new template\`)
              instance.$render();
            }
          });
          
          console.log(\`[peak] HMR: Successfully updated template for \${path} (\${instances.length} instances)\`)
          return true
        } catch (err) {
          console.error(\`[peak] HMR: Error updating template for \${path}\`, err)
          return false
        }
      }
      
      window.__peak.componentModules = componentModules
      window.__peak.componentInstances = componentInstances
      window.__peak.componentTags = {}
    `;
    
    const tagMappings = componentPaths.map(({ virtualPath }) => {
      const info = componentInfo.get(virtualPath)
      if (info && info.tagName) {
        return `  '${virtualPath}': '${info.tagName}'`
      }
      return ''
    }).filter(Boolean)
    
    return `
      ${readerScript}
      ${imports.join('\n')}
      ${registrations.join('\n')}
      
      window.__peak.componentTags = {
        ${tagMappings.join(',\n')}
      };
      
      Object.assign(window.__peak, {
        getComponentHTML,
        getComponentClass,
        listRegisteredComponents,
        registerInstance: registerComponentInstance,
        updateStyle: updateComponentStyle,
        updateScript: updateComponentScript,
        updateTemplate: updateComponentTemplate,
      });
    `;
  };
  
  let componentPaths = [];
  
  return {
    name: 'vite-plugin-peak',
    
    buildStart() {
      componentPaths = createComponentModules()
    },
    
    buildEnd() {
      try {
        const componentsDir = path.resolve(process.cwd(), '.peak-components')
        if (fs.existsSync(componentsDir)) {
          fs.rmSync(componentsDir, { recursive: true, force: true })
        }
      } catch (e) {
        console.warn('[peak] Failed to clean up component directory:', e)
      }
    },
    
    resolveId(id) {
      if (id === virtualModuleId) {
        return resolvedVirtualModuleId
      }
    },
    
    load(id) {
      if (id === resolvedVirtualModuleId) {
        return generateMainModule(componentPaths)
      }
    },
    
    config(config, { command }) {
      config ||= {};
      config.optimizeDeps ||= {};
      config.optimizeDeps.entries ||= [];
      config.optimizeDeps.entries.push(virtualModuleId);
      
      config.resolve ||= {};
      config.resolve.alias ||= {};
      config.resolve.alias['./.peak-components'] = path.resolve(process.cwd(), '.peak-components');
      
      return config;
    },
    
    handleHotUpdate(ctx) {
      if (!ctx.file.endsWith('.html')) return
      let isComponentFile = false
      let componentPath = null
      
      for (const dir of dirs) {
        const dirPath = path.resolve(process.cwd(), dir)
        if (ctx.file.startsWith(dirPath)) {
          const relativePath = path.relative(dirPath, ctx.file)
          componentPath = `/${dir}/${relativePath}`
          isComponentFile = true
          break
        }
      }
      
      if (!isComponentFile) return
      
      const content = fs.readFileSync(ctx.file, 'utf8')
      const { script, style, template } = extractParts(content)
      
      ctx.server.ws.send({
        type: 'custom',
        event: 'peak:style-update',
        data: { path: componentPath, style },
      });
      
      if (script) {
        ctx.server.ws.send({
          type: 'custom',
          event: 'peak:script-update',
          data: { path: componentPath, script },
        });
      }
      
      if (template) {
        ctx.server.ws.send({
          type: 'custom',
          event: 'peak:template-update',
          data: { path: componentPath, template, html: content},
        });
      }
      
      createComponentModules()
      return []
    },
    
    transformIndexHtml(html) {
      return {
        html,
        tags: [
          {
            tag: 'script',
            injectTo: 'body',
            children: `
              if (import.meta.hot) {
                import.meta.hot.on('peak:style-update', ({ path, style }) => {
                  if (window.__peak?.updateStyle) {
                    const success = window.__peak.updateStyle(path, style)
                    if (success) {
                      console.log('[peak] HMR: Successfully updated styles for ' + path)
                    } else {
                      console.warn('[peak] HMR: Failed to update styles for ' + path)
                      import.meta.hot.invalidate()
                    }
                  }
                })
                
                import.meta.hot.on('peak:script-update', async ({ path, script }) => {
                  if (window.__peak?.updateScript) {
                    const success = await window.__peak.updateScript(path, script)
                    if (success) {
                      console.log('[peak] HMR: Successfully updated script for ' + path)
                    } else {
                      console.warn('[peak] HMR: Failed to update script for ' + path)
                      import.meta.hot.invalidate()
                    }
                  }
                })
                
                import.meta.hot.on('peak:template-update', ({ path, template, html }) => {
                  if (window.__peak?.updateTemplate) {
                    const success = window.__peak.updateTemplate(path, template, html)
                    if (success) {
                      console.log('[peak] HMR: Successfully updated template for ' + path)
                    } else {
                      console.warn('[peak] HMR: Failed to update template for ' + path)
                      import.meta.hot.invalidate()
                    }
                  }
                })
              }
            `
          }
        ]
      }
    }
  }
}

function slugify(str) {
  return str.toLowerCase().replace(/[^\w\-]+/g, '-')
}

function hsh(str) {
  return str.split('').reduce((a, b) => (a << 5) - a + b.charCodeAt(0)|0, 0)
}
