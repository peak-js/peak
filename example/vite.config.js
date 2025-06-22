import { defineConfig } from 'vite'
import peakPlugin from '../vite-plugin/index.js'

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
    allowedHosts: ['*']
  }
})
