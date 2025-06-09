import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      events: "events/", // Polyfill events
      util: "util/",     // Polyfill util
      stream: 'stream-browserify',
    },
  },
  define: {
    global: 'window', // Polyfill global for browser
    process: { env: {} }, // Polyfill process for browser
  },
  optimizeDeps: {
    include: ["events", "util"],
  },
}));
