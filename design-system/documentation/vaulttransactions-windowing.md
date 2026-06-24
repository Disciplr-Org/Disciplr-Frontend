# VaultTransactions windowing

`VaultTransactions` keeps the current small-list output unchanged. Windowing only turns on when the rendered confirmed transaction count exceeds `VAULT_TRANSACTION_WINDOW_THRESHOLD` (`30`).

## Pure Range Helper

`getWindowRange` in `src/utils/windowRange.ts` owns the virtualization math:

- Lists at or below the threshold return `isWindowed: false` and render all rows.
- Larger lists calculate `start`, `end`, `beforeHeight`, and `afterHeight` from `scrollTop`, row height, viewport height, and overscan.
- `sliceWindow` returns the original array for non-windowed ranges so small lists keep referential behavior.

## Page Behavior

The confirmed transaction section uses the helper to render only the visible rows plus overscan for large histories. Pending and failed sections remain unwindowed because they are short, high-priority status groups.

The section header shows the active rendered range, for example `Rendering 10-13 of 80`, so the behavior is inspectable during performance testing.
