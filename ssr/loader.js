import fs from 'fs'
import path from 'path'
import { pathToFileURL } from 'url'
import { initializeDOM } from './dom.js'

const componentCache = new Map()

export function parseComponent(htmlContent, filePath) {
  const { document, DOMParser } = initializeDOM()
  
  // Parse the HTML component file
  const parser = new DOMParser()
  const doc = parser.parseFromString(htmlContent, 'text/html')
  
  const templateEl = doc.querySelector('template')
  const styleEl = doc.querySelector('style')
  const scriptEl = doc.querySelector('script')
  
  return {
    template: templateEl ? templateEl.innerHTML : '',
    style: styleEl ? styleEl.textContent : '',
    script: scriptEl ? scriptEl.textContent : '',
    filePath
  }
}

export async function loadComponent(filePath) {
  // Check cache first
  if (componentCache.has(filePath)) {
    return componentCache.get(filePath)
  }
  
  // Read component file
  const htmlContent = fs.readFileSync(filePath, 'utf8')
  const parsed = parseComponent(htmlContent, filePath)
  
  // Create component class
  let ComponentClass = class {}
  
  if (parsed.script) {
    try {
      // Create a module-like environment for the script
      const moduleCode = `
        ${parsed.script.includes('import') ? await processImports(parsed.script, filePath) : parsed.script}
        
        ${parsed.script.includes('export default') ? '' : 'export default class {}'}
      `
      
      // Use dynamic import to load the component class
      const dataUrl = `data:text/javascript;base64,${Buffer.from(moduleCode).toString('base64')}`
      const module = await import(dataUrl)
      ComponentClass = module.default || ComponentClass
    } catch (error) {
      console.warn(`[peak-ssr] Failed to load component script for ${filePath}:`, error.message)
    }
  }
  
  const component = {
    ...parsed,
    ComponentClass,
    tagName: generateTagName(filePath)
  }
  
  // Cache the component
  componentCache.set(filePath, component)
  
  return component
}

async function processImports(scriptContent, componentPath) {
  const importRegex = /import\s+(.+?)\s+from\s+['"](.+?)['"];?/g
  const imports = []
  let match
  
  while ((match = importRegex.exec(scriptContent))) {
    const [fullMatch, specifiers, importPath] = match
    
    try {
      // Resolve relative imports
      const resolvedPath = path.resolve(path.dirname(componentPath), importPath)
      const fileUrl = pathToFileURL(resolvedPath).href
      
      imports.push({
        specifiers: specifiers.trim(),
        path: fileUrl,
        original: fullMatch
      })
    } catch (error) {
      console.warn(`[peak-ssr] Failed to resolve import: ${importPath}`)
      imports.push({
        specifiers: specifiers.trim(),
        path: importPath,
        original: fullMatch
      })
    }
  }
  
  // Remove import statements and inject variables
  let processedScript = scriptContent
  const injectedVars = []
  const injectedValues = []
  
  for (const { specifiers, path: importPath, original } of imports) {
    try {
      const module = await import(importPath)
      
      // Remove the import statement
      processedScript = processedScript.replace(original, '')
      
      // Handle different import types
      if (!specifiers.startsWith('{')) {
        // Default import
        const varName = specifiers.trim()
        injectedVars.push(varName)
        injectedValues.push(module.default)
      } else {
        // Named imports
        const names = specifiers
          .replace(/[{}]/g, '')
          .split(',')
          .map(s => s.trim())
        
        for (const name of names) {
          if (name.includes(' as ')) {
            const [original, alias] = name.split(' as ').map(s => s.trim())
            injectedVars.push(alias)
            injectedValues.push(module[original])
          } else {
            injectedVars.push(name)
            injectedValues.push(module[name])
          }
        }
      }
    } catch (error) {
      console.warn(`[peak-ssr] Failed to import ${importPath}:`, error.message)
      // Remove the import statement anyway
      processedScript = processedScript.replace(original, '')
    }
  }
  
  // Create a function that injects the imported values
  if (injectedVars.length > 0) {
    const factory = new Function(...injectedVars, processedScript)
    const result = factory(...injectedValues)
    
    // If the script returns a class, use it; otherwise wrap in a function
    if (typeof result === 'function') {
      return `export default ${result.toString()}`
    }
  }
  
  return processedScript
}

function generateTagName(filePath) {
  const basename = path.basename(filePath, '.html')
  const dirname = path.basename(path.dirname(filePath))
  
  // Create a hash from the full path for uniqueness
  const hash = filePath.split('').reduce((a, b) => (a << 5) - a + b.charCodeAt(0), 0)
  const hashStr = Math.abs(hash).toString(36).slice(0, 6)
  
  return `${slugify(dirname)}-${slugify(basename)}-${hashStr}`
}

function slugify(str) {
  return str.toLowerCase().replace(/[^\w\-]+/g, '-').replace(/^-+|-+$/g, '')
}

export function clearComponentCache() {
  componentCache.clear()
}
