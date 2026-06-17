# VaultProgressBar

`VaultProgressBar` is the shared vault completion primitive for card, dashboard, and detail surfaces.

## Component

- Source: `src/components/VaultProgressBar.tsx`
- Styles: `src/components/VaultProgressBar.css`
- Props: `value: number`, `label?: string`

## Behavior

- `value` is clamped to `0-100` before rendering.
- `NaN`, `Infinity`, and other non-finite values render as `0`.
- The progress track exposes `role="progressbar"`, `aria-valuemin="0"`, `aria-valuemax="100"`, `aria-valuenow`, and `aria-label`.
- When `label` is provided, the label and rounded percentage render above the track.
- Without `label`, the component uses `Vault progress` as the screen-reader label.

## Tokens

- Incomplete progress uses `--accent`.
- Full completion uses `--success`.
- The track uses `--surface-raised` and `--border`.

## Usage

```tsx
<VaultProgressBar value={progressPct} label="Vault progress" />
```

`VaultCard` renders this primitive from its existing `progressPct` prop. `Dashboard` consumes it through `VaultCard`, and `VaultDetail` uses the same primitive for timeline progress.
