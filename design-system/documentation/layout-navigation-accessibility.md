# Layout navigation accessibility

The header exposes two navigation surfaces:

- Desktop header links live in `nav[aria-label="Primary navigation"]`.
- The mobile drawer keeps its modal dialog semantics separate from `nav[aria-label="Mobile navigation"]`.

Only the link for the current route should carry `aria-current="page"` across the visible header navigation set. The Disciplr brand link stays a home shortcut and does not receive `aria-current`, so the active page has a single programmatic current link.

Header controls must keep accessible names:

- Wallet connection controls expose their visible wallet action text.
- The mobile drawer trigger uses `aria-label="Open navigation menu"` and keeps `aria-expanded` synchronized with drawer state.
