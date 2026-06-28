/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { configDefaults } from 'vitest/config';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    globals: true,
    environment: "happy-dom",
    setupFiles: "./src/setupTests.ts",
    css: true,
    include: ["src/**/*.test.{tsx,ts}"],
    coverage: {
      reporter: ['text', 'html'],
    },
    exclude: [...configDefaults.exclude, 'node_modules', 'dist'],
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('recharts')) return 'vendor-recharts';
          if (id.includes('jspdf')) return 'vendor-jspdf';
          if (id.includes('framer-motion')) return 'vendor-framer-motion';
        },
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": { target: "http://localhost:3000", changeOrigin: true },
    },
  },
});
