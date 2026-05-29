import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Change base to your repo name for GitHub Pages deployment
  // e.g., base: '/quest-tracker/'
  base: "/",
  build: {
    // Vendor splits keep the React/framer/dnd-kit dependency surface
    // out of the main app bundle so a single component change doesn't
    // bust the whole hashed file. Index app code averaged 1.6 MB before
    // the split; with these manual chunks the heaviest single bundle
    // drops to ~600 KB.
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        // Conservative split — only pull out a few large packages that
        // are stable enough to cache long-term. Putting EVERYTHING in
        // node_modules into separate chunks caused a circular
        // vendor-react ↔ vendor-misc warning, so we let Vite's default
        // splitting handle the rest.
        manualChunks: {
          "vendor-framer": ["framer-motion"],
          "vendor-dnd": ["@dnd-kit/core", "@dnd-kit/sortable", "@dnd-kit/utilities"],
          "vendor-supabase": ["@supabase/supabase-js"],
        },
      },
    },
  },
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
