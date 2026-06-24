# Vaults filtering

The Vaults list exposes a compact toolbar for status filtering, name search, and deterministic sorting.

## Helper API

Use `filterVaults(vaults, { status, query })` for pure list filtering:

- `status` accepts `all`, `active`, `pending_validation`, `completed`, `failed`, or `cancelled`.
- `query` is trimmed and matched case-insensitively against the vault name.
- The helper returns a new filtered list and does not mutate the source array.

Use `sortVaults(vaults, { by, dir })` for pure list sorting:

- `by` accepts `deadline` or `amount`.
- `dir` accepts `asc` or `desc`.
- Ties keep the original order so repeated renders remain stable.

## UI rules

- Status filters are native buttons with `aria-pressed`, so mouse, touch, and keyboard activation share the same behavior.
- Empty results use semantic design tokens for the surface, border, and muted copy.
- Vault row links keep the `/vaults/:id` target so existing navigation behavior remains unchanged.
