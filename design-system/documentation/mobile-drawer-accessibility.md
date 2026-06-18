# Mobile Drawer Accessibility

The mobile navigation drawer is a modal navigation surface. While it is open:

- Focus is trapped inside `MobileDrawer` with `focus-trap-react`.
- Escape closes the drawer through the shared `onClose` path.
- Focus returns to the hamburger trigger after close.
- The drawer is announced as a labelled modal dialog with `role="dialog"`, `aria-modal="true"`, and `aria-labelledby`.
- The page `<main>` is marked `aria-hidden` while the drawer is open.
- Drawer controls use the shared `--touch-target` token so close and navigation targets meet the 44 px touch-target baseline.
