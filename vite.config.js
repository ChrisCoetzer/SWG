import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "./",          // <-- critical for Electron file:// builds
  server: {
    port: 5173
  },
  build: {
    outDir: "dist",
    emptyOutDir: true
  }
});
