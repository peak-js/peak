import { defineConfig } from 'vite'
import peakPlugin from '../vite-plugin-peak.js'
import { resolve } from 'path'

export default defineConfig({
  plugins: [peakPlugin()],
  build: {
    minify: false,
    rollupOptions: {
      input: {
        main: 'index.html'
      },
      output: {
        manualChunks: {
          peak: ['peak.js']
        }
      }
    }
  },
  server: {
    open: true
  },
  resolve: {
    alias: {
      './.peak-components': resolve(__dirname, '.peak-components')
    }
  }
})
