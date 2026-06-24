# Network Guard Banner

`NetworkGuardBanner` warns connected-wallet users when Freighter is on a network
that does not match the deployment network.

- Expected network comes from `VITE_DISCIPLR_NETWORK`.
- Valid values are `TESTNET` and `PUBLIC`; unset or invalid values default to
  `TESTNET`.
- The banner only renders when a wallet address is connected and the connected
  network differs from the expected network.
- Users may dismiss the current mismatch for the session; the warning appears
  again after the wallet returns to a matching state and then mismatches again.
- The banner uses `role="alert"` and `--warning` token styling so the warning is
  not communicated by color alone.
