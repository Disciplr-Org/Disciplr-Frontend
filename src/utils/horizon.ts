import type { WalletNetwork } from '../context/WalletContext';

type HorizonBalance = {
  asset_type: string;
  asset_code?: string;
  balance: string;
};

type HorizonAccount = {
  balances?: HorizonBalance[];
};

export const HORIZON_URLS: Record<WalletNetwork, string> = {
  TESTNET: 'https://horizon-testnet.stellar.org',
  PUBLIC: 'https://horizon.stellar.org',
};

export type UsdcBalanceResult = {
  balance: string;
  hasTrustline: boolean;
};

export function horizonUrl(network: WalletNetwork): string {
  return HORIZON_URLS[network];
}

export async function fetchUsdcBalance(
  address: string,
  network: WalletNetwork,
  fetcher: typeof fetch = fetch,
): Promise<UsdcBalanceResult> {
  const endpoint = `${horizonUrl(network)}/accounts/${encodeURIComponent(address)}`;
  const response = await fetcher(endpoint);

  if (response.status === 404) {
    return { balance: '0.00', hasTrustline: false };
  }

  if (!response.ok) {
    throw new Error(`Horizon account lookup failed with ${response.status}`);
  }

  const account = (await response.json()) as HorizonAccount;
  const usdcBalance = account.balances?.find(
    (balance) => balance.asset_type !== 'native' && balance.asset_code === 'USDC',
  );

  return {
    balance: usdcBalance?.balance ?? '0.00',
    hasTrustline: Boolean(usdcBalance),
  };
}
