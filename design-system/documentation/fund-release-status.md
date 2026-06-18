# FundReleaseStatus

`FundReleaseStatus` gives vault owners and verifiers a single settlement panel for locked funds. It shows whether the funds were released to the success destination, redirected to the failure destination, or are still pending settlement.

## Props

| Prop | Type | Notes |
|---|---|---|
| `outcome` | `'released' \| 'redirected' \| 'pending'` | Drives the icon, label, color token, and explanatory copy. |
| `destinationAddress` | `string \| undefined` | Full Stellar address is kept in `title` and `aria-label`; the visible value is truncated. |
| `amount` | `number` | Rendered with locale formatting. |
| `assetCode` | `string` | Defaults to `USDC`. |
| `transaction` | `{ hash?: string; timestamp?: string }` | When a hash exists, the component links to Stellar Expert for the active wallet network. |

## Outcome Matrix

| Outcome | Token | Icon | Destination | Transaction |
|---|---|---|---|---|
| `released` | `--success` | `CheckCircle2` | Success destination | Explorer link when hash is present. |
| `redirected` | `--danger` | `AlertTriangle` | Failure destination | Explorer link when hash is present. |
| `pending` | `--muted` | `Clock` | `Not assigned yet` when missing | `Awaiting transaction hash` when missing. |

## Accessibility

- Outcome is conveyed with icon plus text, not color alone.
- Truncated destination addresses and transaction hashes preserve the full value in `title` and `aria-label`.
- The transaction link uses the active `WalletContext` network: `TESTNET` links to Stellar Expert testnet, while `PUBLIC` and unknown networks use public mainnet.

## VaultDetail Integration

`VaultDetail` derives settlement from the existing vault state and transaction history:

- `completed` vaults use the `release` transaction and success destination.
- `failed` vaults use the `redirect` transaction and failure destination.
- active or pending-validation vaults render the pending state.
