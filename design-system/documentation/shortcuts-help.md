# ShortcutsHelp

A self-contained overlay that lists all registered keyboard shortcuts. Triggered by pressing `?` anywhere in the app outside of a text-entry context.

## Usage

`ShortcutsHelp` is mounted once in `Layout.tsx` and manages its own open/closed state — no props are required at the call-site:

```tsx
import { ShortcutsHelp } from '@/components/ShortcutsHelp';

// inside Layout render
<ShortcutsHelp />
```

## Shortcut Registry

All shortcuts live in **`src/utils/shortcuts.ts`** as a single exported constant:

```ts
import type { ShortcutEntry } from '@/utils/shortcuts';

export const SHORTCUTS: ShortcutEntry[] = [
  { key: '?',   description: 'Show keyboard shortcuts' },
  { key: 'Esc', description: 'Close modal or overlay'  },
];
```

To add a new shortcut, append an entry to `SHORTCUTS`. The overlay re-renders automatically on the next open.

## Trigger Suppression

The `?` handler is registered on `document` and skipped when `document.activeElement` is an `<input>`, `<textarea>`, `<select>`, or a `contenteditable` element. This prevents the overlay from firing while the user is typing.

## Keyboard Behaviour

| Key     | Action |
|---------|--------|
| `?`     | Open (or toggle-close) the overlay |
| `Esc`   | Close via the Modal focus-trap deactivation |

## Accessibility

- `role="dialog"` with `aria-modal="true"` on the overlay.
- `aria-labelledby` points to the "Keyboard Shortcuts" `<h2>`.
- `aria-describedby` points to the shortcuts table container.
- Focus is trapped inside the overlay while it is open (via `focus-trap-react`).
- Animations are disabled when `prefers-reduced-motion: reduce` is set.

## Props

`ShortcutsHelp` accepts one optional prop, primarily useful in tests:

| Prop        | Type             | Default      | Description                        |
|-------------|------------------|--------------|------------------------------------|
| `shortcuts` | `ShortcutEntry[]`| `SHORTCUTS`  | Override the shortcuts list        |

## Testing

```tsx
// open with ? key
fireEvent.keyDown(document, { key: '?' });
expect(screen.getByRole('dialog')).toBeInTheDocument();

// empty registry
render(<ShortcutsHelp shortcuts={[]} />);
fireEvent.keyDown(document, { key: '?' });
expect(screen.getByText(/no shortcuts registered/i)).toBeInTheDocument();
```
