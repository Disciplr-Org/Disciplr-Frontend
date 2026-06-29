# Vault Lifecycle

`VaultLifecycle` renders a token-styled horizontal stepper for the high-level
vault lifecycle on `VaultDetail`.

## Stages

The `vaultLifecycleStages(status)` utility returns four ordered stages:

- `Created`
- `Active`
- `Pending Validation`
- `Completed`, or a terminal `Failed` / `Cancelled` stage

Each stage is marked as `done`, `current`, or `upcoming`. Unknown statuses fall
back to `Created` as the current stage so the component stays render-safe.

## Accessibility

The component renders an ordered list with the accessible label `Vault lifecycle`.
Each step exposes a combined label such as `Active, current` so screen-reader
users get both the stage name and its state.

## Token Usage

- Current stages use `--accent` and `--accent-transparent`.
- Completed previous stages use `--success`.
- Terminal failed/cancelled stages use `--danger`.
- Upcoming stages use `--muted`, `--bg`, and `--border`.
