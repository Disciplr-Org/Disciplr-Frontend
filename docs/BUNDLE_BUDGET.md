# Bundle Size Budget

Chunks are split via `build.rollupOptions.output.manualChunks` in `vite.config.ts`.
The gzip limits are maintained in [`bundle-budget.json`](../bundle-budget.json)
and enforced against `dist/assets` by `pnpm run check:bundle`. Sizes use decimal
kB (1 kB = 1,000 bytes); the check reports gzip size, budget, and remaining
headroom after a build.

| Chunk | Role | Budget key in [`bundle-budget.json`](../bundle-budget.json) |
| ----- | ---- | ---------------------------------------------------------- |
| `index` | Initial | `index` |
| `vendor-recharts` | Vendor | `vendor-recharts` |
| `vendor-jspdf` | Vendor | `vendor-jspdf` |
| `vendor-framer-motion` | Vendor | `vendor-framer-motion` |
| `Analytics` | Lazy | `Analytics` |
| `AnalyticsCharts` | Lazy | `AnalyticsCharts` |
| `Notification` | Lazy | `Notification` |

## Lazy-loading strategy

`src/pages/Analytics.tsx` is itself a lazy route (via `React.lazy` in `App.tsx`).
Within it, all recharts JSX lives in `src/pages/AnalyticsCharts.tsx`, which is
also loaded via `React.lazy` + `Suspense`. This keeps the `vendor-recharts` chunk
off the eager path: recharts is never fetched until the Analytics page is visited
**and** the chart islands are rendered.

Each chart island (`section="performance"`, `section="donut"`, `section="team"`)
is a prop-driven branch inside `AnalyticsCharts`. All three share a single dynamic
import so the recharts vendor chunk is only fetched once.
