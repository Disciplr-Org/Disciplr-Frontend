# Wallet USDC Balance

Connected wallets display the Circle USDC trustline balance for the active Stellar network.

- `TESTNET` accounts query `https://horizon-testnet.stellar.org`.
- `PUBLIC` accounts query `https://horizon.stellar.org`.
- The balance helper only accepts the configured Circle USDC issuer for the active network.
- Matched USDC trustlines must return a finite decimal balance string before the value is shown.
- Accounts without that USDC trustline show `0.00 USDC` with a no-trustline note.
- Horizon request failures and missing accounts show a balance-unavailable state instead of a stale or mocked value.
- The dropdown renders a loading state while the Horizon request is in flight.
