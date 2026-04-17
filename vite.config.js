import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Change base to your repo name for GitHub Pages deployment
  // e.g., base: '/quest-tracker/'
  base: "/",
  server: {
    proxy: {
      // Proxy Claude API calls to avoid CORS in development
      "/api/claude": {
        target: "https://api.anthropic.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/claude/, ""),
        headers: {
          "anthropic-dangerous-direct-browser-access": "true",
        },
      },
    },
  },
});
