import { observable } from '../../peak.js'

export default class {
  constructor(component) {
    this.position = observable({ x: null, y: null })
    const recordPosition = (e) => {
      this.position.x = e.clientX
      this.position.y = e.clientY
    }
    component.$on('mounted', () => {
      document.addEventListener('pointermove', recordPosition)
    })
    component.$on('teardown', () => {
      document.removeEventListener('pointermove', recordPosition)
    })
    return observable(this.position)
  }
}
