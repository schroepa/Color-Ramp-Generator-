import path from 'node:path'
import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@astrojs/react'
import { defineConfig } from 'astro/config'

const rootDir = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  site: 'https://ptrckschrdtr.de',
  base: '/tintfield',
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(rootDir, './src'),
      },
    },
  },
})
