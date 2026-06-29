# Analytics Chart Tokens

Analytics charts resolve runtime CSS variables from `src/index.css`, which mirrors `design-system/tokens/colors.json`:

- Success series use `--success`.
- Failed/error series use `--danger`.
- Comparison series use `--info`.
- Milestone and primary bars use `--accent`.
- Axes, grid lines, legends, and tooltip supporting text use neutral tokens such as `--muted`, `--border`, `--surface`, and `--text`.

`src/pages/Analytics.tsx` recomputes chart colors when `data-theme` changes so Recharts receives concrete color values for the active light or dark theme. Chart containers use Recharts `ResponsiveContainer` for fluid width behavior.

Each chart includes a screen-reader summary adjacent to the visual chart. Animated Recharts series are disabled when the user prefers reduced motion.

When the active period has an empty series, the period-driven charts render a shared empty-state placeholder with the message `No data for this period (...)` instead of showing empty axes.

## CSV Export

The Analytics page provides a CSV export feature alongside the PDF report export. It integrates with `src/utils/csv.ts` via `toCsv(chartData, 'analytics')` and `downloadCsv`.

- **Stable header row**: `Period,Success %,Failed %,Capital (USDC),Milestones`
- **Filename format**: `disciplr-analytics-<period>.csv` (e.g., `disciplr-analytics-30d.csv`)
- **Disabled state**: The CSV button is disabled when `chartData` is empty for the selected period
- **Cell sanitization**: All cell values are passed through `escapeCell` to prevent CSV formula injection attacks (characters `=`, `+`, `-`, `@`, tab, CR are prefixed with `'` and values containing `,` or `"` are properly quoted)
