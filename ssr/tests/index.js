import { test, describe } from 'node:test'
import assert from 'node:assert'
import path from 'path'
import { fileURLToPath } from 'url'
import { renderComponent } from '../render.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const fixturesDir = path.join(__dirname, 'fixtures')
const componentsDir = path.join(fixturesDir, 'components')
const viewsDir = path.join(fixturesDir, 'views')

describe('server side rendering', () => {
  test('simple component with default data', async () => {
    const componentPath = path.join(componentsDir, 'simple-component.html')
    const result = await renderComponent(componentPath, {}, {
      componentDirs: [componentsDir, viewsDir]
    })

    assert.ok(result.html.includes('Default Title'))
    assert.ok(result.html.includes('Default Message'))
    assert.ok(result.html.includes('class="simple"'))
    assert.ok(result.styles.includes('.simple'))
    assert.ok(result.tagName.includes('simple-component'))
  })

  test('simple component with provided data', async () => {
    const componentPath = path.join(componentsDir, 'simple-component.html')
    const result = await renderComponent(componentPath, {
      title: 'Custom Title',
      message: 'Custom Message'
    }, {
      componentDirs: [componentsDir, viewsDir]
    })

    assert.ok(result.html.includes('Custom Title'))
    assert.ok(result.html.includes('Custom Message'))
    assert.ok(result.html.includes('class="simple"'))
  })

  test('component with props', async () => {
    const componentPath = path.join(componentsDir, 'item-component.html')
    const result = await renderComponent(componentPath, {
      item: { name: 'Test Item', description: 'Test Description', active: true }
    }, {
      componentDirs: [componentsDir, viewsDir]
    })

    assert.ok(result.html.includes('Test Item'))
    assert.ok(result.html.includes('Test Description'))
    // Note: :class currently replaces static class
    assert.ok(result.html.includes('class="active"'))
  })

  test('missing props', async () => {
    const componentPath = path.join(componentsDir, 'item-component.html')
    const result = await renderComponent(componentPath, {
      // No item prop provided
    }, {
      componentDirs: [componentsDir, viewsDir]
    })

    // Should use default values
    assert.ok(result.html.includes('Default Item'))
    assert.ok(!result.html.includes('class="item active"')) // Should not be active
  })

  test('x-text directives', async () => {
    const componentPath = path.join(componentsDir, 'simple-component.html')
    const result = await renderComponent(componentPath, {
      title: 'Dynamic Title',
      message: 'Dynamic Message'
    }, {
      componentDirs: [componentsDir, viewsDir]
    })

    assert.ok(result.html.includes('Dynamic Title'))
    assert.ok(result.html.includes('Dynamic Message'))
  })

  test('dynamic :class property', async () => {
    const componentPath = path.join(componentsDir, 'item-component.html')
    const result = await renderComponent(componentPath, {
      item: { name: 'Active Item', active: true }
    }, {
      componentDirs: [componentsDir, viewsDir]
    })

    // Note: currently :class replaces static class rather than merging
    // This is a known limitation that could be improved
    assert.ok(result.html.includes('class="active"'))
  })

  test('generate scoped styles', async () => {
    const componentPath = path.join(componentsDir, 'simple-component.html')
    const result = await renderComponent(componentPath, {}, {
      componentDirs: [componentsDir, viewsDir]
    })

    assert.ok(result.styles.includes('.simple'))
    assert.ok(result.styles.includes('data-peak-component'))
    assert.ok(result.styles.includes('@layer'))
  })

  test('undefined values', async () => {
    const componentPath = path.join(componentsDir, 'simple-component.html')
    const result = await renderComponent(componentPath, {
      title: 'Valid Title'
      // message is undefined, should use default from constructor
    }, {
      componentDirs: [componentsDir, viewsDir]
    })

    assert.ok(result.html.includes('Valid Title'))
    // fall back to default value from constructor
    assert.ok(result.html.includes('Default Message'))
  })
})
