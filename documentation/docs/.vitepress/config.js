import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Peak.js',
  description: 'Easy reactive web framework with no setup required',
  
  themeConfig: {
    nav: [
      { text: 'Guide', link: '/guide/introduction' },
      { text: 'API Reference', link: '/api/' },
      { text: 'Examples', link: '/examples/' }
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Getting Started',
          items: [
            { text: 'Introduction', link: '/guide/introduction' },
            { text: 'Quick Start', link: '/guide/quick-start' },
            { text: 'Installation', link: '/guide/installation' }
          ]
        },
        {
          text: 'Core Concepts',
          items: [
            { text: 'Components', link: '/guide/components' },
            { text: 'Template Directives', link: '/guide/templates' },
            { text: 'Reactivity', link: '/guide/reactivity' },
            { text: 'Event Handling', link: '/guide/events' },
            { text: 'Slots', link: '/guide/slots' }
          ]
        },
        {
          text: 'Advanced',
          items: [
            { text: 'Server-Side Rendering', link: '/guide/ssr' },
            { text: 'Routing', link: '/guide/routing' },
            { text: 'Build & Deploy', link: '/guide/build' }
          ]
        }
      ],
      '/api/': [
        {
          text: 'API Reference',
          items: [
            { text: 'Component API', link: '/api/component' },
            { text: 'Template Directives', link: '/api/directives' },
            { text: 'Router API', link: '/api/router' },
            { text: 'SSR API', link: '/api/ssr' }
          ]
        }
      ]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/user/peak.js' }
    ],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2024 Peak.js Contributors'
    }
  }
})