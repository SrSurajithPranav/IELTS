import { defineConfig } from 'vite'

// ─── Vite Configuration ──────────────────────────────────────────────────────
//
// LOCAL DEV (localhost):
//   The dev-server proxy forwards /api → http://127.0.0.1:5000/api
//   so the browser never sees a cross-origin request.
//
// GITHUB CODESPACES:
//   The proxy CANNOT forward to 127.0.0.1:5000 because the browser
//   reaches the Vite server via a forwarded HTTPS URL, and Flask runs
//   on a separate forwarded port (5000).  The frontend detects this at
//   runtime (see API_BASE_URL logic in App.jsx) and talks directly to
//   the :5000 forwarded URL.  The proxy is still defined here so local
//   dev continues to work unchanged.
//
// PRODUCTION (Vercel + Render):
//   Set VITE_API_URL=https://your-backend.onrender.com/api in Vercel env vars.
// ─────────────────────────────────────────────────────────────────────────────

export default defineConfig({
  server: {
    // Allow connections from Codespaces browser forwarding
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
