import type { WalletNetwork } from '../context/WalletContext';

export const DEFAULT_EXPECTED_NETWORK: WalletNetwork = 'TESTNET';

export function parseExpectedNetwork(value: unknown): WalletNetwork {
  const normalized = String(value ?? '').trim().toUpperCase();
  return normalized === 'PUBLIC' ? 'PUBLIC' : DEFAULT_EXPECTED_NETWORK;
}

export function getExpectedNetwork(
  value: unknown = import.meta.env.VITE_DISCIPLR_NETWORK,
): WalletNetwork {
  return parseExpectedNetwork(value);
}

export function isNetworkMismatch(
  connectedNetwork: WalletNetwork | null | undefined,
  expectedNetwork: WalletNetwork,
): boolean {
  return connectedNetwork != null && connectedNetwork !== expectedNetwork;
}
