# Command Palette

The command palette gives power users a keyboard-first way to jump across vaults
and core routes from anywhere in the app.

## Entry Points

- The header search button opens the palette.
- `Cmd+K` and `Ctrl+K` open the same palette globally.

The palette is mounted in `Layout` so every route gets the same command surface.

## Results

The palette lists quick actions first:

- Create Vault
- Verifier Queue
- Analytics

Vault results are loaded from `listVaults()` and search by vault name and id.
Matching uses lightweight fuzzy subsequence matching so short queries still work
without adding another dependency.

## Keyboard And Focus

- `ArrowDown` and `ArrowUp` move the selected result and wrap around.
- `Enter` navigates to the selected result.
- `Escape` closes the palette.
- Backdrop click closes the palette.
- Focus is trapped while the palette is open and returns to the header trigger on
  close.

## Motion

The open surface uses the shared motion duration token and disables transitions
when `prefers-reduced-motion: reduce` is active.
