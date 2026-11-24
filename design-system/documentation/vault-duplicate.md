# Vault Duplicate Prefill

The duplicate-vault action lets creators start a new vault from an existing
vault without copying fields manually.

## Entry Points

- `VaultDetail` exposes a `Duplicate Vault` action in the header actions.
- `Vaults` exposes a `Duplicate` action for each vault row.

Both actions navigate to `/vaults/create` with React Router location state under
`createVaultPrefill`.

## Prefilled Fields

The prefill state carries:

- source vault id and name for user-facing context
- amount
- success destination address
- failure destination address
- milestone title and criteria metadata for the creation flow to consume as the
  form grows

The current `CreateVault` form seeds the fields it owns today: amount, success
destination, and failure destination.

## Deadline Handling

Deadline is intentionally never copied. A duplicated vault is a new contract, so
the creator must choose a fresh deadline before validation can pass.

## Validation

Prefill does not bypass `validateCreateVault`. Invalid copied values remain in
the fields so the creator can edit them, and the existing inline validation
surfaces errors on submit.
