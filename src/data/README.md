# src/data

Shared data types and accessors. This is the single seam between UI and the data layer.

## vaults.ts

Exports:

| Export | Description |
|---|---|
| `VaultStatus` | Union type of all valid vault states |
| `Vault` | Typed vault shape consumed by all pages and hooks |
| `MOCK_VAULTS` | Static array used during development |
| `getVaults()` | Async accessor — returns `Promise<Vault[]>` |

### Swapping in real data

Replace `getVaults()` with a real Horizon/contract call:

```ts
export async function getVaults(): Promise<Vault[]> {
  const res = await fetch('/api/vaults')
  return res.json()
}
```

No page or hook changes required.
