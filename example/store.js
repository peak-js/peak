import { store } from './peak.js'

store.initialize = () => {
  Object.assign(store, {
    filter: 'all',
    items: [
      { id: id(), done: false, title: 'Walk the dog' },
      { id: id(), done: false, title: 'Do the dishes' },
      { id: id(), done: false, title: 'Mow the lawn' },
    ],
    setFilter(v) {
      this.filter = v
    },
    setItem(item, data) {
      const idx = this.items.findIndex(i => i.id== item.id)
      Object.assign(this.items[idx], data)
    },
    removeItem(i) {
      this.items.splice(i, 1)
    },
    getFilteredItems() {
      return this.items.filter(i => {
        if (this.filter == 'all') return true
        if (this.filter == 'completed' && i.done) return true
        if (this.filter == 'active' && !i.done) return true
      })
    },
    clearCompleted() {
      let i = this.items.length
      while (i--)
        if (this.items[i].done)
          this.items.splice(i, 1)
    },
    addItem(title) {
      this.items.push({ id: id(), title, done: false })
    }
  })
}

window.store = store

function id() {
  return Math.random().toString(36).slice(2)
}

export { store }

