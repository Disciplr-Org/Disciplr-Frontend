# Wallet Integration Guide

This document explains how wallet connection, balance fetching, and USDC trustline detection work in Disciplr.

## Module Map

```
src/context/
├── WalletContext.tsx        – Provider, reducer, public API (useWallet, WalletProvider)
├── freighterAdapter.ts      – FreighterAdapter interface + defaultFreighterAdapter
├── useBalancePolling.ts     – 30-second balance refresh hook (pauses when tab hidden)
└── useWalletWatcher.ts      – Fast poll for address/network changes (ACCOUNT_POLL_INTERVAL)
```

## Connection Flow

```mermaid
sequenceDiagram
    participant User
    participant UI
    participant WalletProvider
    participant FreighterAdapter
    participant Horizon

    User->>UI: Clicks "Connect Wallet"
    UI->>WalletProvider: connect()
    WalletProvider->>FreighterAdapter: setAllowed()
    FreighterAdapter-->>WalletProvider: granted
    WalletProvider->>FreighterAdapter: requestAccess()
    FreighterAdapter-->>WalletProvider: confirmed
    WalletProvider->>FreighterAdapter: getAddress()
    FreighterAdapter-->>WalletProvider: public key
    WalletProvider->>FreighterAdapter: getNetworkDetails()
    FreighterAdapter-->>WalletProvider: TESTNET | PUBLIC
    WalletProvider->>Horizon: fetchUsdcBalance(address, network)
    Horizon-->>WalletProvider: balance / trustline status
    WalletProvider->>UI: Update balance, status, network
    UI->>User: Show wallet address + balance
```

## Balance Polling Sequence

```mermaid
sequenceDiagram
    participant Timer as setInterval (30s)
    participant Visibility as visibilitychange
    participant useBalancePolling
    participant WalletProvider
    participant Horizon

    Timer->>useBalancePolling: tick (tab visible)
    useBalancePolling->>WalletProvider: onTick()
    WalletProvider->>Horizon: fetchUsdcBalance
    Horizon-->>WalletProvider: updated balance

    Visibility->>useBalancePolling: document becomes visible
    useBalancePolling->>WalletProvider: onTick() immediately
    WalletProvider->>Horizon: fetchUsdcBalance
    Horizon-->>WalletProvider: updated balance
```

## Swapping the Adapter (testing)

Pass a `FreighterAdapter` fake to `WalletProvider` via the `adapter` prop:

```tsx
const fakeAdapter: FreighterAdapter = {
  isAllowed: async () => ({ isAllowed: true }),
  setAllowed: async () => {},
  requestAccess: async () => true,
  getAddress: async () => ({ address: 'GFAKE...', error: null }),
  getNetworkDetails: async () => ({ network: 'TESTNET' }),
};

render(
  <WalletProvider adapter={fakeAdapter}>
    <App />
  </WalletProvider>
);
```

## Public API (unchanged)

| Export | Description |
|---|---|
| `WalletProvider` | React provider — composes adapter + hooks |
| `useWallet` | Context hook |
| `walletReducer` | Pure state reducer |
| `BALANCE_REFRESH_INTERVAL` | 30 000 ms |
| `ACCOUNT_POLL_INTERVAL` | 2 000 ms |
| `CONNECT_TIMEOUT_MS` | Env-driven, clamped to [5 000, 120 000] ms |
| `WALLET_DISCONNECTED_KEY` | localStorage key |
| `WalletNetwork` | `'TESTNET' \| 'PUBLIC'` |
| `WalletStatus` | `'disconnected' \| 'restoring' \| 'connecting' \| 'connected' \| 'error'` |
| `BalanceStatus` | `'idle' \| 'loading' \| 'success' \| 'no_trustline' \| 'error'` |
