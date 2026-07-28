# Network Mismatch Banner

`NetworkMismatchBanner` warns connected-wallet users when the Freighter network
differs from the network expected by the Disciplr deployment.

- Expected network comes from `VITE_DISCIPLR_NETWORK`.
- Valid values are `TESTNET` and `PUBLIC`; missing or unsupported values fall
  back to `TESTNET`.
- The banner only renders when a wallet address is connected and the connected
  wallet network differs from the expected network.
- Disconnected wallets and wallets with a matching network never show the banner.
- The banner can be dismissed for the current mismatch and reappears after the
  mismatch clears and returns.
- Styling uses danger tokens so the warning is consistent with the design system.

The pure `isNetworkMismatch(walletNetwork, expectedNetwork)` helper lives in
`src/utils/networkMismatch.ts` and is covered separately from the React banner.
