import type { WalletNetwork } from '../context/WalletContext';

export const HORIZON_URLS: Record<WalletNetwork, string> = {
    TESTNET: 'https://horizon-testnet.stellar.org',
    PUBLIC: 'https://horizon.stellar.org',
};

export const USDC_ISSUERS: Record<WalletNetwork, string> = {
    TESTNET: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
    PUBLIC: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
};

export type HorizonBalanceErrorCode = 'ACCOUNT_NOT_FOUND' | 'REQUEST_FAILED' | 'INVALID_RESPONSE';

export class HorizonBalanceError extends Error {
    code: HorizonBalanceErrorCode;

    constructor(code: HorizonBalanceErrorCode, message: string) {
        super(message);
        this.name = 'HorizonBalanceError';
        this.code = code;
    }
}

interface HorizonBalanceLine {
    asset_type: string;
    asset_code?: string;
    asset_issuer?: string;
    balance: string;
}

interface HorizonAccountResponse {
    balances?: HorizonBalanceLine[];
}

export interface UsdcBalanceResult {
    balance: string;
    hasTrustline: boolean;
    issuer: string;
    network: WalletNetwork;
}

export function horizonUrl(network: WalletNetwork) {
    return HORIZON_URLS[network];
}

function isFiniteDecimalString(value: unknown): value is string {
    return typeof value === 'string' && /^\d+(?:\.\d+)?$/.test(value) && Number.isFinite(Number(value));
}

export async function fetchUsdcBalance(
    address: string,
    network: WalletNetwork,
    fetcher: typeof fetch = fetch,
): Promise<UsdcBalanceResult> {
    const issuer = USDC_ISSUERS[network];
    const response = await fetcher(`${horizonUrl(network)}/accounts/${encodeURIComponent(address)}`);

    if (response.status === 404) {
        throw new HorizonBalanceError('ACCOUNT_NOT_FOUND', 'Stellar account was not found on Horizon.');
    }

    if (!response.ok) {
        throw new HorizonBalanceError(
            'REQUEST_FAILED',
            `Horizon balance request failed with status ${response.status}.`,
        );
    }

    const account = (await response.json()) as HorizonAccountResponse;

    if (!Array.isArray(account.balances)) {
        throw new HorizonBalanceError('INVALID_RESPONSE', 'Horizon account response did not include balances.');
    }

    const usdcBalance = account.balances.find(
        (balanceLine) =>
            balanceLine.asset_type !== 'native' &&
            balanceLine.asset_code === 'USDC' &&
            balanceLine.asset_issuer === issuer,
    );

    if (usdcBalance && !isFiniteDecimalString(usdcBalance.balance)) {
        throw new HorizonBalanceError('INVALID_RESPONSE', 'Horizon USDC balance was not a finite numeric string.');
    }

    return {
        balance: usdcBalance?.balance ?? '0.00',
        hasTrustline: Boolean(usdcBalance),
        issuer,
        network,
    };
}
