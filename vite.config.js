import { defineConfig } from "vite";

// GitHub Pages serves under the repo name as a sub-path.
// We can override at deploy time via VITE_BASE.
const base = process.env.VITE_BASE ?? "/THREE-JS-NFL-Flight-Paths/";

export default defineConfig({
  base,
  build: {
    target: "es2022",
    sourcemap: false,
  },
  server: {
    port: 5173,
    host: true,
  },
});
