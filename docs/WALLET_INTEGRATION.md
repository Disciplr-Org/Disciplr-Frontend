# Wallet Integration Guide

This document explains how the wallet connection, balance fetching, and USDC trustline detection work in Disciplr.

## Connection Flow

```mermaid
sequenceDiagram
    participant User
    participant UI
    participant WalletContext
    participant Freighter
    participant Horizon

    User->>UI: Clicks "Connect Wallet"
    UI->>WalletContext: connect()
    WalletContext->>Freighter: setAllowed()
    Freighter-->>WalletContext: Access granted
    WalletContext->>Freighter: requestAccess()
    Freighter-->>WalletContext: Access confirmed
    WalletContext->>Freighter: getAddress()
    Freighter-->>WalletContext: Public key
    WalletContext->>Freighter: getNetworkDetails()
    Freighter-->>WalletContext: Network (TESTNET/PUBLIC)
    WalletContext->>Horizon: fetchUsdcBalance(address, network)
    Horizon-->>WalletContext: USDC balance / trustline status
    WalletContext->>UI: Update balance, status, network
    UI->>User: Show wallet address + balance