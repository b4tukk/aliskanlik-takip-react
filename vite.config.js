import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// base './' + HashRouter: GitHub Pages, Netlify ve Vercel'de ek ayar olmadan çalışır
export default defineConfig({
  base: './',
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.js',
    css: false,
  },
})
