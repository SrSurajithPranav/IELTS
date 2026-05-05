import { defineConfig } from 'vite'

// Vite dev server proxy configuration: forward /api to backend
// This makes browser requests same-origin and avoids CORS issues
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '/api')
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false
  }
})
