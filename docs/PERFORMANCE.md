# Performance Observability

## Web Vitals Reporting

Disciplr uses a lightweight web-vitals reporting seam to capture Core Web Vitals for performance observability. This enables detection of regressions from heavy components (recharts, jsPDF) and data-heavy tables in vault/verifier flows.

### Implementation

**Location:** `src/utils/reportWebVitals.ts`

The reporter uses the native Performance API to capture:
- **LCP** (Largest Contentful Paint) - Loading performance
- **CLS** (Cumulative Layout Shift) - Visual stability  
- **INP** (Interaction to Next Paint) - Interactivity (with FID fallback)

### Usage

**In `src/main.tsx`:**

```typescript
import { reportWebVitals } from './utils/reportWebVitals';

// Development: console logging
reportWebVitals((metric) => {
  console.log('[Web Vitals]', metric);
});

// Production: send to analytics service
reportWebVitals((metric) => {
  // Example: sendToAnalytics(metric)
  analytics.track('web_vital', metric);
});
```

### Metric Interface

```typescript
interface Metric {
  id: string;           // Unique identifier (e.g., 'lcp-1234567890')
  name: string;         // 'LCP' | 'CLS' | 'INP' | 'FID'
  value: number;        // Metric value in milliseconds (LCP, INP, FID) or unitless (CLS)
  rating: 'good' | 'needs-improvement' | 'poor';
  delta?: number;       // Change from previous value (if available)
  navigationType?: string; // 'navigate' | 'reload' | 'back_forward' | 'unknown'
}
```

### Rating Thresholds

| Metric | Good | Needs Improvement | Poor |
|--------|------|-------------------|------|
| LCP | < 2.5s | 2.5s - 4.0s | > 4.0s |
| CLS | < 0.1 | 0.1 - 0.25 | > 0.25 |
| INP | < 200ms | 200ms - 500ms | > 500ms |
| FID | < 100ms | 100ms - 300ms | > 300ms |

### Design Principles

1. **Opt-in Production Behavior** - No side effects when no reporter is provided
2. **Error Isolation** - Callback errors never crash the application
3. **SSR-Safe** - Gracefully handles server-side rendering (window undefined)
4. **Graceful Degradation** - Works with or without PerformanceObserver support
5. **Zero External Dependencies** - Uses native Performance API only

### Edge Case Handling

- **No callback provided** - Returns early, no observers created
- **Callback throws** - Error logged to console, app continues running
- **Missing PerformanceObserver** - Returns early, no metrics captured
- **SSR environment** - Returns early when window is undefined
- **Observer errors** - Individual observer failures don't affect other metrics

### Testing

Tests are located in `src/utils/__tests__/reportWebVitals.test.ts` and cover:
- Callback wiring with various inputs (undefined, null, non-function)
- Error handling (callback throws, observer errors)
- Environment handling (SSR, missing PerformanceObserver)
- Multiple metrics scenario
- Metric interface compliance

Run tests with:
```bash
npm run test
```

### Integration Points

The web-vitals reporter is called from `src/main.tsx` during app initialization. This ensures metrics are captured from the initial page load and throughout the user session.

For production deployments, replace the console.log reporter with your analytics service of choice (e.g., Google Analytics, DataDog, New Relic, or custom endpoint).

### Performance Impact

The reporter has minimal performance impact:
- Uses native browser APIs with negligible overhead
- Observers are passive and don't block rendering
- Callback execution is asynchronous
- No network calls unless explicitly added by the callback

---

## Analytics Page Memoization (Issue #499)

### Problem

The Analytics page (`src/pages/Analytics.tsx`) was re-computing derived data on every render, causing unnecessary chart re-renders and performance degradation:

- Period data selection (`chartData`, `comparisonData`, `displayData`) recreated on every render
- KPI metrics (`kpis`) recalculated when unrelated state changed (theme toggle, comparison mode)
- Legend entries (`successLegendEntries`, `capitalLegendEntries`) recreated on every render
- Callback handlers passed to `AnalyticsCharts` had unstable identities
- `MutationObserver` token sync triggered unnecessary re-renders of derived data

### Solution

Applied targeted memoization using `useMemo` and `useCallback` with precise dependency arrays:

#### 1. Stable Data References (`src/pages/analyticsData.ts`)

Extracted static mock data into a separate module to ensure stable array/object references across renders:

```typescript
// analyticsData.ts - exported constants with stable identity
export const analyticsPeriodData: Record<Period, AnalyticsDataPoint[]> = { ... }
export const prevPeriodData: Record<Period, AnalyticsDataPoint[]> = { ... }
export const vaultStatusData = [...]
export const milestoneTypes = [...]
export const benchmarkData = [...]
export const TEAM_CHART_DATA = [...]
```

#### 2. Memoized Period Data Selection

```typescript
// Only recomputes when `period` changes
const chartData = useMemo(() => analyticsPeriodData[period], [period])
const prevChartData = useMemo(() => prevPeriodData[period], [period])

// Only recomputes when source data changes
const comparisonData = useMemo(
  () => chartData.map((d, i) => ({
    ...d,
    prevSuccess: prevChartData[i]?.success ?? 0,
    prevCapital: prevChartData[i]?.capital ?? 0,
  })),
  [chartData, prevChartData]
)

// Only recomputes when showComparison or source data changes
const displayData = useMemo(
  () => showComparison ? comparisonData : chartData,
  [showComparison, comparisonData, chartData]
)
```

#### 3. Memoized KPI Computation

```typescript
// Only recomputes when chartData or prevChartData changes (not on theme/comparison toggle)
const kpis = useMemo(
  () => computeAnalyticsKpis(chartData as AnalyticsDataPoint[], prevChartData as AnalyticsDataPoint[]),
  [chartData, prevChartData]
)
```

#### 4. Memoized Legend Entries

```typescript
// Stable references when showComparison toggles
const successLegendEntries = useMemo(() => showComparison ? [...] : [...], [showComparison])
const capitalLegendEntries = useMemo(() => showComparison ? [...] : [...], [showComparison])
```

#### 5. Stable Callback Identities

```typescript
// Stable period change handler
const setPeriod = useCallback((p: Period) => {
  setPeriodInternal(p)
  setSearchParams({ period: p })
}, [setSearchParams])

// Stable export handlers
const handleCsvExport = useCallback(() => { ... }, [chartData, period])
const handlePdfExport = useCallback(async () => { ... }, [chartData, period])

// Stable props object for AnalyticsCharts (prevents child re-renders)
const analyticsChartProps = useMemo(() => ({
  displayData, chartData, period, vaultStatusData, teamChartData: TEAM_CHART_DATA,
  showComparison, chartAnimationEnabled, tooltipStyle, seriesColors, chartTokens,
  successLegendEntries, capitalLegendEntries, isLoading
}), [/* all deps */])
```

#### 6. Theme Change Isolation

The `useAnalyticsChartTokens` hook uses a `MutationObserver` on `data-theme` attribute changes. Since derived data (`chartData`, `kpis`, `displayData`) only depends on `period` and source data arrays — not on `chartTokens` — theme changes now only update token-dependent values (`seriesColors`, `tooltipStyle`) without triggering KPI recomputation or chart data regeneration.

### Results

| Scenario | Before | After |
|----------|--------|-------|
| Theme toggle | Full KPI + chart data recompute | Token/color recompute only |
| Comparison toggle | Full KPI + chart data recompute | Legend entries + displayData only |
| Period change | Full recompute (correct) | Full recompute (correct) |
| Unrelated re-render | Full recompute | Zero recompute (stable refs) |

### Verification

Tests in `src/pages/__tests__/Analytics.test.tsx` verify:
- Stable `chartData` reference across unrelated re-renders
- Exact-once recomputation when `period` changes
- Stable KPI object reference when period unchanged
- Stable legend entries when comparison toggles off/on
- No derived data recomputation on theme change
- Zero recomputation on identical props/state render

Run with:
```bash
npm test -- src/pages/__tests__/Analytics.test.tsx
```

### Files Modified

- `src/pages/Analytics.tsx` — Main component with memoization
- `src/pages/analyticsData.ts` — Extracted stable data constants (new)
- `src/pages/analyticsTheme.ts` — Existing token utilities (unchanged)
- `src/utils/analyticsKpis.ts` — Pure KPI computation (unchanged)
- `src/pages/__tests__/Analytics.test.tsx` — Added memoization stability tests
- `docs/PERFORMANCE.md` — This documentation