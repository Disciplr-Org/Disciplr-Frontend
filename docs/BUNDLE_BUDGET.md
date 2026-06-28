# Bundle Size Budget

Chunks are split via `build.rollupOptions.output.manualChunks` in `vite.config.ts`.
Sizes are gzip-compressed targets. Regressions should be visible in `npm run build` output.

| Chunk                  | Target (gzip) |
| ---------------------- | ------------- |
| `index` (initial)      | < 200 kB      |
| `vendor-recharts`      | < 150 kB      |
| `vendor-jspdf`         | < 120 kB      |
| `vendor-framer-motion` | < 30 kB       |
| `Analytics` (lazy)     | < 50 kB       |
| `Notification` (lazy)  | < 20 kB       |
