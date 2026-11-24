# Breadcrumb

`Breadcrumb` renders a compact, token-styled navigation trail for detail pages.
It is driven by ordered `{ label, to }` segments.

## Usage

```tsx
import Breadcrumb from '@/components/Breadcrumb';

<Breadcrumb
  segments={[
    { label: 'Home', to: '/' },
    { label: 'Vaults', to: '/vaults' },
    { label: vault.name },
  ]}
/>
```

## Behavior

- The final segment represents the current page, renders as text, and receives `aria-current="page"`.
- Ancestor segments with `to` render as router links.
- Ancestor segments without `to` render as text, which supports incomplete trails without broken links.
- Very long current labels are shortened with the shared `truncateMiddle` helper and keep the full label in `title`.

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `segments` | `{ label: string; to?: string }[]` | Required | Ordered breadcrumb trail. |
| `ariaLabel` | `string` | `'Breadcrumb'` | Accessible label for the `nav` landmark. |
| `className` | `string` | `undefined` | Optional class name for layout integration. |
| `style` | `CSSProperties` | `undefined` | Optional inline style for page spacing. |
| `maxCurrentLabelLength` | `number` | `36` | Current-label length before middle truncation is applied. |

## Accessibility

- Uses a `nav` landmark with an ordered list.
- Separators are marked `aria-hidden`.
- Only the last segment receives `aria-current="page"`.
- The current segment is never a link, so screen readers receive a clear page location.

## Design Tokens

| Token | Usage |
| --- | --- |
| `--spacing-2` | Segment and separator spacing |
| `--font-size-caption` | Breadcrumb text size |
| `--line-height-caption` | Breadcrumb line height |
| `--muted` | Ancestor text |
| `--accent` | Ancestor links |
| `--text` | Current page segment |
| `--border` | Separator color |
