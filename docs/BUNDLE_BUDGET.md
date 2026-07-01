# Bundle Size Budget

Chunks are split via `build.rollupOptions.output.manualChunks` in `vite.config.ts`.
Sizes are gzip-compressed targets. Regressions should be visible in `npm run build` output.

| Chunk                   | Target (gzip) |
| ----------------------- | ------------- |
| `index` (initial)       | < 200 kB      |
| `vendor-recharts`       | < 150 kB      |
| `vendor-jspdf`          | < 120 kB      |
| `vendor-framer-motion`  | < 30 kB       |
| `Analytics` (lazy)      | < 50 kB       |
| `AnalyticsCharts` (lazy)| < 15 kB       |
| `Notification` (lazy)   | < 20 kB       |

## Lazy-loading strategy

`src/pages/Analytics.tsx` is itself a lazy route (via `React.lazy` in `App.tsx`).
Within it, all recharts JSX lives in `src/pages/AnalyticsCharts.tsx`, which is
also loaded via `React.lazy` + `Suspense`. This keeps the `vendor-recharts` chunk
off the eager path: recharts is never fetched until the Analytics page is visited
**and** the chart islands are rendered.

Each chart island (`section="performance"`, `section="donut"`, `section="team"`)
is a prop-driven branch inside `AnalyticsCharts`. All three share a single dynamic
import so the recharts vendor chunk is only fetched once.
