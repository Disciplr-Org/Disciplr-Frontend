# Vault Data Layer

`src/services/vaultService.ts` is the single vault data seam for the current frontend mocks. Pages should import shared types from `src/types/vault.ts` and read vault data through `vaultService` instead of declaring page-local vault, milestone, or transaction arrays.

## Public API

- `listVaults(): Promise<Vault[]>` returns the list used by vault list/detail routes.
- `getVault(id): Promise<Vault | undefined>` returns one typed vault or `undefined` for unknown ids.
- `getTransactions(id): Promise<VaultTransaction[]>` returns transactions scoped to one vault id.
- `listTransactions(): Promise<VaultTransaction[]>` returns the transaction-ledger projection used by `/transactions`.

Dashboard-specific methods (`getDashboardSummary`, `listDashboardVaults`, `listDashboardActivity`, and `listDashboardDeadlines`) keep the existing dashboard fixture values intact while moving the data out of the page.

Snapshot methods exist for the mock implementation so pages can preserve the current first render without a loading flicker. New integration code should prefer the Promise methods.

## Integration Seam

When real contract data is available, replace the backing fixtures inside `vaultService` with adapters for:

- Soroban contract reads for vault state, contract addresses, milestones, and release destinations.
- Horizon or indexer reads for transaction hashes, ledger numbers, fees, status, and timestamps.
- Any app backend cache that joins contract state with user-facing names or verifier metadata.

Keep the exported service method signatures stable. That lets page components remain unchanged while the implementation moves from local mock data to network-backed reads.

## Data Rules

- Preserve the shared `Vault`, `Milestone`, and `VaultTransaction` contracts in `src/types/vault.ts`.
- Return cloned values from the mock service so callers cannot mutate the backing fixtures.
- Convert external timestamps to ISO strings at the service boundary; pages can format them for display.
- Represent missing vault ids with `undefined` and missing transaction lists with an empty array.
