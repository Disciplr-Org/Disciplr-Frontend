import type { WalletNetwork } from '../context/WalletContext';

export type ExplorerKind = 'account' | 'contract' | 'tx';

export const STELLAR_EXPERT_BASE_BY_NETWORK: Record<WalletNetwork, string> = {
  TESTNET: 'https://stellar.expert/explorer/testnet',
  PUBLIC: 'https://stellar.expert/explorer/public',
};

function explorerBase(network: WalletNetwork | null | undefined): string {
  return STELLAR_EXPERT_BASE_BY_NETWORK[network ?? 'TESTNET'];
}

// Stellar Expert paths are /account/:id, /contract/:id, and /tx/:id.
export function explorerUrl(
  network: WalletNetwork | null | undefined,
  kind: ExplorerKind,
  id: string,
): string | null {
  const trimmed = id.trim();

  if (!trimmed) {
    return null;
  }

  return `${explorerBase(network)}/${kind}/${encodeURIComponent(trimmed)}`;
}
