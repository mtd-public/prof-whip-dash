import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages serves project sites from /<repo-name>/ — update this if this
// repo is ever renamed or forked under a different name. The artifact build
// (tools/inline.mjs) rewrites these paths away when it inlines everything.
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        board: resolve(import.meta.dirname, 'board.html'),
        camera: resolve(import.meta.dirname, 'camera.html'),
      },
    },
  },
})
