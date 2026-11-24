import type { WalletNetwork } from '../context/WalletContext';

type NetworkLike = WalletNetwork | string | null | undefined;

export const DEFAULT_EXPECTED_NETWORK: WalletNetwork = 'TESTNET';

export function resolveExpectedNetwork(value: NetworkLike): WalletNetwork {
  return value === 'PUBLIC' ? 'PUBLIC' : DEFAULT_EXPECTED_NETWORK;
}

export const APP_EXPECTED_NETWORK = resolveExpectedNetwork(
  import.meta.env.VITE_DISCIPLR_NETWORK,
);

function isKnownNetwork(value: NetworkLike): value is WalletNetwork {
  return value === 'TESTNET' || value === 'PUBLIC';
}

export function isNetworkMismatch(
  walletNetwork: NetworkLike,
  expectedNetwork: NetworkLike = APP_EXPECTED_NETWORK,
) {
  if (walletNetwork == null) {
    return false;
  }

  if (!isKnownNetwork(walletNetwork)) {
    return true;
  }

  return walletNetwork !== resolveExpectedNetwork(expectedNetwork);
}
