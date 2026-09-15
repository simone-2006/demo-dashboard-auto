import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    dedupe: ["react", "react-dom"],
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
      "/fleetcatalog": {
        target: "https://fleetcatalog.disturbingbyte.pt",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/fleetcatalog/, ""),
      },
    },
  },
})
