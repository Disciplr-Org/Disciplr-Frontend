import type { WalletNetwork } from '../context/WalletContext';

const EXPLORER_BASE = 'https://stellar.expert/explorer'

export function getExplorerTxUrl(txHash: string, network: 'TESTNET' | 'PUBLIC' | null): string {
  const segment = network === 'PUBLIC' ? 'public' : 'testnet'
  return `${EXPLORER_BASE}/${segment}/tx/${txHash}`
}

export function getExplorerAccountUrl(address: string, network: 'TESTNET' | 'PUBLIC' | null): string {
  const segment = network === 'PUBLIC' ? 'public' : 'testnet'
  return `${EXPLORER_BASE}/${segment}/account/${address}`
}

const EXPLORER_BASES: Record<WalletNetwork, string> = {
  TESTNET: 'https://stellar.expert/explorer/testnet',
  PUBLIC: 'https://stellar.expert/explorer/public',
};

/**
 * Builds a Stellar Expert contract/account explorer URL for the given
 * address and network.
 *
 * Returns an empty string when `address` is falsy so callers can guard
 * the link render without additional null checks.
 */
export function contractExplorerUrl(address: string, network: string): string {
  if (!address) return '';
  const base =
    EXPLORER_BASES[(network as WalletNetwork)] ??
    EXPLORER_BASES.TESTNET;
  return `${base}/contract/${address}`;
}

/**
 * Human-readable label for the given network string.
 * Falls back to "Testnet" for unknown values so the UI is never blank.
 */
export function networkLabel(network: string | null | undefined): string {
  if (network === 'PUBLIC') return 'Mainnet';
  if (network === 'TESTNET') return 'Testnet';
  return 'Testnet';
}
