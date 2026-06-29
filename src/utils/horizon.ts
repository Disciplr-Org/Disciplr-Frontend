import type { WalletNetwork } from '../context/WalletContext';

export const HORIZON_URLS: Record<WalletNetwork, string> = {
    TESTNET: 'https://horizon-testnet.stellar.org',
    PUBLIC: 'https://horizon.stellar.org',
};

export const USDC_ISSUERS: Record<WalletNetwork, string> = {
    TESTNET: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
    PUBLIC: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
};

export const MAX_HORIZON_BALANCES = 100;

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
    balance?: unknown;
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

function isFiniteNumericString(value: unknown): value is string {
    if (typeof value !== 'string' || value.length === 0) {
        return false;
    }

    return /^[+-]?(?:\d+\.?\d*|\.\d+)$/.test(value) && Number.isFinite(Number(value));
}

export async function fetchUsdcBalance(
    address: string,
    network: WalletNetwork,
    fetcher: typeof fetch = fetch,
    { signal, timeoutMs = 10000 }: { signal?: AbortSignal; timeoutMs?: number } = {},
): Promise<UsdcBalanceResult> {
    const issuer = USDC_ISSUERS[network];
    const controller = new AbortController();
    const combinedSignal = signal ? AbortSignal.any([signal, controller.signal]) : controller.signal;
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetcher(`${horizonUrl(network)}/accounts/${encodeURIComponent(address)}`, {
            signal: combinedSignal,
        });

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

    if (account.balances.length > MAX_HORIZON_BALANCES) {
        throw new HorizonBalanceError('INVALID_RESPONSE', 'Horizon account response included too many balances.');
    }

    const usdcBalance = account.balances.find(
        (balanceLine) =>
            balanceLine.asset_type !== 'native' &&
            balanceLine.asset_code === 'USDC' &&
            balanceLine.asset_issuer === issuer,
    );

    return {
        balance: usdcBalance?.balance ?? '0.00',
        hasTrustline: Boolean(usdcBalance),
        issuer,
        network,
    };
        const usdcBalance = account.balances.find(
            (balanceLine) =>
                balanceLine.asset_type !== 'native' &&
                balanceLine.asset_code === 'USDC' &&
                balanceLine.asset_issuer === issuer,
        );

        if (usdcBalance && !isFiniteNumericString(usdcBalance.balance)) {
            throw new HorizonBalanceError(
                'INVALID_RESPONSE',
                'Horizon USDC balance was missing or not a finite numeric string.',
            );
        }

        return {
            balance: usdcBalance?.balance ?? '0.00',
            hasTrustline: Boolean(usdcBalance),
            issuer,
            network,
        };
    } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
            throw new HorizonBalanceError('REQUEST_FAILED', 'Horizon balance request was aborted or timed out.');
        }
        throw err;
    } finally {
        clearTimeout(timeoutId);
    }
}
