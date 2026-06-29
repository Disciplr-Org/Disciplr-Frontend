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

## Component Rendering Optimization

### VaultTransactions
The `VaultTransactions` component manages heavy data processing including filtering, sorting, pagination (windowing), and aggregate computations. To ensure fluid interaction and prevent unnecessary layout or computation cycles:
- **Filter derivations** (`pending`, `failed`, `confirmed`) are memoized and only recompute when the underlying dataset or filter criteria changes.
- **Window slices** (`windowRange`) are independently memoized per status section to avoid recalculating the slice for one section when another is modified.
- **Totals and aggregations** (`computeTxTotals`, `stats`) are memoized to skip intensive reduction loops on unrelated state changes (e.g. copying a hash or opening a modal).

Integration tests in `src/pages/__tests__/VaultTransactions.test.tsx` assert that these derivation pipelines do not fire during unrelated re-renders.
