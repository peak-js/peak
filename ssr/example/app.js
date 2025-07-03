import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import setupPeakSSR from '../index.js'

const app = express()
const port = process.env.PORT || 4000

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// set up templating
setupPeakSSR(app, {
  viewsDir: './views',
  componentsDir: './components',
  cache: false,
})

// serve static files
app.use(express.static(path.join(__dirname, './public')))
app.use('/components', express.static(path.join(__dirname, './components')))

// routes
app.get('/', (req, res) => {
  res.render('todo-list.html', {
    title: 'My Todo List',
    todos: [
      { text: 'Take out the trash', completed: true, priority: 'low' },
      { text: 'Build a todo app', completed: false, priority: 'medium' },
      { text: 'Test component composition', completed: false, priority: 'high' },
      { text: 'Deploy to production', completed: false, priority: 'low' }
    ]
  })
})

app.listen(port, (...args) => {
  console.log(`listening on port ${port}`, ...args)
})
