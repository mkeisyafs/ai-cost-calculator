import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { Server } from 'http'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5174,
    proxy: {
      '/api/openrouter': {
        target: 'https://openrouter.ai',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/openrouter/, '/api/v1'),
      },
      '/api/halu': {
        target: 'https://gateway.haluai.my.id',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/halu/, '/v1'),
      },
    },
  },
})
