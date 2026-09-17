import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Local dev convenience: frontend calls /api/* directly, Vite forwards
      // to Express. Production build instead reads VITE_API_BASE_URL.
      // (There is no '/files' proxy: generated resumes are served only
      // by the authenticated GET /api/resume/download route, which goes
      // through the /api proxy above.)
      '/api': 'http://localhost:4000',
    },
  },
})
