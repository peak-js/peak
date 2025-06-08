import fs from 'fs';
import path from 'path';
import { parse as parseHtml } from 'node-html-parser';

export default function ({ dirs = ['components','views'] } = {}) {
  const virtualModuleId = 'virtual:components';
  const resolvedVirtualModuleId = '\0' + virtualModuleId;
  
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
  
  // Main virtual module content
  const generateMainModule = (componentPaths) => {
    const imports = [];
    const registrations = [];
    const assignments = [];
    
    for (const { virtualPath, jsPath } of componentPaths) {
      const varName = `comp_${virtualPath.replace(/[^a-zA-Z0-9]/g, '_')}`;
      imports.push(`import * as ${varName} from '${jsPath}';`);
      registrations.push(`registerComponent('${virtualPath}', ${varName});`);
      assignments.push(`  '${virtualPath}': ${varName}.html`);
    }
    
    return `
      import { registerComponent, getComponentHTML, getComponentClass } from './vite-html-slurper.js';
      ${imports.join('\n')}
      
      // Register components with the slurper
      ${registrations.join('\n')}
      
      // Legacy support for direct HTML access
      window.__pkcache = { 
        ${assignments.join(',\n')}
      };
      
      // Expose slurper methods globally
      window.getComponentHTML = getComponentHTML;
      window.getComponentClass = getComponentClass;
    `;
  };
  
  let componentPaths = [];
  
  return {
    name: 'vite-plugin-peak',
    
    buildStart() {
      // Generate component modules
      componentPaths = createComponentModules();
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
    }
  };
}