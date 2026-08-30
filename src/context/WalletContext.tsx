import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { isAllowed, setAllowed, requestAccess, getAddress, getNetworkDetails } from '@stellar/freighter-api';
import { fetchUsdcBalance } from '../utils/horizon';
import { logger } from '../utils/logger';
import {
    recordWalletTelemetry,
    resolveConnectTimeoutMs,
    type ConnectErrorCode,
} from '../utils/walletTelemetry';

export type WalletNetwork = 'TESTNET' | 'PUBLIC';
export type BalanceStatus = 'idle' | 'loading' | 'success' | 'no_trustline' | 'error';

interface WalletContextType {
    address: string | null;
    network: WalletNetwork | null;
    balance: string | null;
    balanceStatus: BalanceStatus;
    balanceError: string | null;
    isConnecting: boolean;
    error: string | null;
    connect: () => Promise<boolean>;
    disconnect: () => void;
    checkConnection: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

/** Polling interval in milliseconds. Override in tests via module augmentation or dependency injection. */
export const BALANCE_REFRESH_INTERVAL = 30_000;

/**
 * Upper bound for a single wallet connect attempt. A hung Freighter prompt
 * must not leave the user stuck in an indeterminate connecting state
 * forever. Configurable via VITE_WALLET_CONNECT_TIMEOUT_MS, clamped to
 * [5_000, 120_000]ms (see resolveConnectTimeoutMs).
 */
export const CONNECT_TIMEOUT_MS = resolveConnectTimeoutMs(
    import.meta.env.VITE_WALLET_CONNECT_TIMEOUT_MS as string | undefined,
);

/** localStorage key that records an explicit user-initiated disconnect.
 *  While this key is set, checkConnection will not auto-reconnect even
 *  if Freighter still reports the site as allowed.
 */
export const WALLET_DISCONNECTED_KEY = 'disciplr:wallet:userDisconnected';

export function WalletProvider({ children }: { children: ReactNode }) {
    const [address, setAddress] = useState<string | null>(null);
    const [network, setNetwork] = useState<WalletNetwork | null>(null);
    const [balance, setBalance] = useState<string | null>(null);
    const [balanceStatus, setBalanceStatus] = useState<BalanceStatus>('idle');
    const [balanceError, setBalanceError] = useState<string | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);
    const lastKnownAddressRef = useRef<string | null>(null);
    const lastKnownNetworkRef = useRef<WalletNetwork | null>(null);
    // Single-flight guard: at most one Freighter authorization prompt and one
    // set of balance fetches may be in flight at a time, even when several
    // UI surfaces call connect() during the same tick.
    const connectInFlightRef = useRef<Promise<boolean> | null>(null);
    const connectAttemptRef = useRef(0);

    const normalizeNetwork = (networkName: string): WalletNetwork => {
        return networkName === 'PUBLIC' ? 'PUBLIC' : 'TESTNET';
    };

    const fetchNetworkAndBalance = async (pubKey: string) => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();

        setBalanceStatus('loading');
        setBalanceError(null);

        try {
            const netDetails = await getNetworkDetails();
            const activeNetwork = normalizeNetwork(netDetails.network);
            setNetwork(activeNetwork);
            lastKnownNetworkRef.current = activeNetwork;

            const usdcBalance = await fetchUsdcBalance(pubKey, activeNetwork, fetch, {
                signal: abortControllerRef.current.signal,
            });
            setBalance(usdcBalance.balance);
            setBalanceStatus(usdcBalance.hasTrustline ? 'success' : 'no_trustline');
        } catch (err) {
            if (err instanceof Error && err.name === 'AbortError') {
                return;
            }
            logger.error('Failed to get network details', err);
            const message = err instanceof Error ? err.message : 'Unable to load USDC balance.';
            setBalance(null);
            setBalanceStatus('error');
            setBalanceError(message);
        }
    };

    const checkConnection = async () => {
        try {
            // Skip auto-reconnect if the user explicitly disconnected this session.
            if (localStorage.getItem(WALLET_DISCONNECTED_KEY) === 'true') {
                return;
            }
            // isAllowed() resolves to { isAllowed: boolean }, not a plain
            // boolean — checking the object itself is always truthy and
            // would auto-reconnect regardless of the actual permission state.
            if ((await isAllowed()).isAllowed) {
                const { address: pubKey, error: addrError } = await getAddress();
                if (pubKey && !addrError) {
                    setAddress(pubKey);
                    lastKnownAddressRef.current = pubKey;
                    await fetchNetworkAndBalance(pubKey);
                }
            }
        } catch (err) {
            logger.error('Check connection error', err);
        }
    };

    useEffect(() => {
        checkConnection();
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

    // ── Balance auto-refresh ──────────────────────────────────────────────────
    // Polls the balance at a configurable interval; pauses when the tab is
    // hidden to avoid wasted Horizon calls. Never overlaps in-flight requests
    // (fetchNetworkAndBalance already cancels the previous one via AbortController).
    // No polling when disconnected (address is null).
    // Also detects address changes via Freighter and updates state accordingly.
    useEffect(() => {
        if (!address) return;

        const tick = async () => {
            if (document.hidden) return;
            try {
                const { address: currentAddr, error: addrError } = await getAddress();
                if (currentAddr && !addrError && currentAddr !== lastKnownAddressRef.current) {
                    // Address changed — update the ref and re-fetch everything
                    setAddress(currentAddr);
                    lastKnownAddressRef.current = currentAddr;
                    await fetchNetworkAndBalance(currentAddr);
                } else {
                    await fetchNetworkAndBalance(lastKnownAddressRef.current ?? address);
                }
            } catch {
                await fetchNetworkAndBalance(address);
            }
        };

        const id = setInterval(tick, BALANCE_REFRESH_INTERVAL);

        const onVisibilityChange = () => {
            if (!document.hidden && address) {
                fetchNetworkAndBalance(address);
            }
        };
        document.addEventListener('visibilitychange', onVisibilityChange);

        return () => {
            clearInterval(id);
            document.removeEventListener('visibilitychange', onVisibilityChange);
        };
    }, [address]);

    type ConnectResult =
        | { ok: true; pubKey: string }
        | { ok: false; code: ConnectErrorCode; message: string };

    class ConnectTimeoutError extends Error {
        constructor() {
            super('Wallet connect timed out');
            this.name = 'ConnectTimeoutError';
        }
    }

    const performConnect = async (attempt: number): Promise<boolean> => {
        const startedAt = Date.now();
        setIsConnecting(true);
        setError(null);
        recordWalletTelemetry({ event: 'wallet.connect.attempt', ts: startedAt, wallet: 'freighter', attempt });

        // Guard against late Freighter resolutions clobbering state after a
        // timeout or a previous attempt already settled.
        let settled = false;
        let timeoutHandle: ReturnType<typeof setTimeout> | null = null;

        try {
            const result = await Promise.race<ConnectResult>([
                (async (): Promise<ConnectResult> => {
                    // Prompt user to allow access
                    await setAllowed();
                    const access = await requestAccess();
                    if (access) {
                        const { address: pubKey, error: addrError } = await getAddress();
                        if (pubKey && !addrError) {
                            return { ok: true, pubKey };
                        }
                        return { ok: false, code: 'address_unavailable', message: addrError || 'Failed to get wallet address.' };
                    }
                    return { ok: false, code: 'access_denied', message: 'Wallet access denied.' };
                })(),
                new Promise<never>((_, reject) => {
                    timeoutHandle = setTimeout(() => reject(new ConnectTimeoutError()), CONNECT_TIMEOUT_MS);
                }),
            ]);

            if (settled) return result.ok;
            settled = true;

            if (result.ok) {
                // Clear the explicit-disconnect flag so future page loads
                // can auto-reconnect again.
                localStorage.removeItem(WALLET_DISCONNECTED_KEY);
                setAddress(result.pubKey);
                lastKnownAddressRef.current = result.pubKey;
                await fetchNetworkAndBalance(result.pubKey);
                setIsConnecting(false);
                recordWalletTelemetry({
                    event: 'wallet.connect.success',
                    ts: Date.now(),
                    wallet: 'freighter',
                    durationMs: Date.now() - startedAt,
                    attempt,
                });
                return true;
            }

            setError(result.message);
            setIsConnecting(false);
            recordWalletTelemetry({
                event: 'wallet.connect.failure',
                ts: Date.now(),
                wallet: 'freighter',
                durationMs: Date.now() - startedAt,
                attempt,
                errorCode: result.code,
            });
            return false;
        } catch (err: unknown) {
            if (settled) return false;
            settled = true;
            setIsConnecting(false);
            if (err instanceof ConnectTimeoutError) {
                setError(`Connection attempt timed out after ${CONNECT_TIMEOUT_MS}ms. Please retry.`);
                recordWalletTelemetry({
                    event: 'wallet.connect.timeout',
                    ts: Date.now(),
                    wallet: 'freighter',
                    durationMs: Date.now() - startedAt,
                    timeoutMs: CONNECT_TIMEOUT_MS,
                    attempt,
                });
                return false;
            }
            logger.error('Connection error', err);
            const message = err instanceof Error ? err.message : undefined;
            setError(message || 'Failed to connect wallet. Make sure Freighter is installed and unlocked.');
            recordWalletTelemetry({
                event: 'wallet.connect.failure',
                ts: Date.now(),
                wallet: 'freighter',
                durationMs: Date.now() - startedAt,
                attempt,
                errorCode: 'wallet_error',
            });
            return false;
        } finally {
            if (timeoutHandle !== null) {
                clearTimeout(timeoutHandle);
            }
        }
    };

    const connect = (): Promise<boolean> => {
        // Bounded concurrency: a second connect() call while one is already in
        // flight returns the in-flight promise instead of prompting Freighter
        // again, so rapid user interaction never stacks authorization prompts.
        if (connectInFlightRef.current) {
            recordWalletTelemetry({
                event: 'wallet.connect.ignored',
                ts: Date.now(),
                wallet: 'freighter',
                reason: 'already_in_flight',
            });
            return connectInFlightRef.current;
        }
        connectAttemptRef.current += 1;
        const promise = performConnect(connectAttemptRef.current);
        connectInFlightRef.current = promise;
        void promise.then(
            () => {
                connectInFlightRef.current = null;
            },
            () => {
                connectInFlightRef.current = null;
            },
        );
        return promise;
    };

    const disconnect = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        // Record the explicit disconnect so checkConnection does not
        // silently reconnect on the next page load.
        localStorage.setItem(WALLET_DISCONNECTED_KEY, 'true');
        setAddress(null);
        setNetwork(null);
        setBalance(null);
        setBalanceStatus('idle');
        setBalanceError(null);
        lastKnownAddressRef.current = null;
        lastKnownNetworkRef.current = null;
    };

    return (
        <WalletContext.Provider
            value={{
                address,
                network,
                balance,
                balanceStatus,
                balanceError,
                isConnecting,
                error,
                connect,
                disconnect,
                checkConnection,
            }}
        >
            {children}
        </WalletContext.Provider>
    );
}

export function useWallet() {
    const context = useContext(WalletContext);
    if (context === undefined) {
        throw new Error('useWallet must be used within a WalletProvider');
    }
    return context;
}
