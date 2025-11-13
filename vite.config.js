import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      'cropperjs/dist/cropper.css': path.resolve(__dirname, 'node_modules/cropperjs/dist/cropper.css'),
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
})
