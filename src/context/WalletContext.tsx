import { createContext, useContext, useReducer, useEffect, useRef, ReactNode, useCallback } from 'react';
import { isAllowed, setAllowed, requestAccess, getAddress, getNetworkDetails } from '@stellar/freighter-api';
import { fetchUsdcBalance } from '../utils/horizon';
import { logger } from '../utils/logger';
import {
    recordWalletTelemetry,
    resolveConnectTimeoutMs,
} from '../utils/walletTelemetry';

export type WalletNetwork = 'TESTNET' | 'PUBLIC';
export type BalanceStatus = 'idle' | 'loading' | 'success' | 'no_trustline' | 'error';
export type WalletStatus = 'disconnected' | 'restoring' | 'connecting' | 'connected' | 'error';

interface WalletState {
    status: WalletStatus;
    address: string | null;
    network: WalletNetwork | null;
    balance: string | null;
    balanceStatus: BalanceStatus;
    balanceError: string | null;
    error: string | null;
}

const initialState: WalletState = {
    status: 'disconnected',
    address: null,
    network: null,
    balance: null,
    balanceStatus: 'idle',
    balanceError: null,
    error: null,
};

type Action =
    | { type: 'RESTORE_START' }
    | { type: 'RESTORE_ABORT' }
    | { type: 'CONNECT_START' }
    | { type: 'CONNECT_SUCCESS'; payload: { address: string; network: WalletNetwork } }
    | { type: 'CONNECT_ERROR'; payload: { error: string } }
    | { type: 'DISCONNECT' }
    | { type: 'BALANCE_FETCH_START' }
    | { type: 'BALANCE_FETCH_SUCCESS'; payload: { balance: string | null; status: BalanceStatus; network: WalletNetwork } }
    | { type: 'BALANCE_FETCH_ERROR'; payload: { error: string } }
    | { type: 'UPDATE_NETWORK'; payload: { network: WalletNetwork } }
    | { type: 'UPDATE_ADDRESS'; payload: { address: string } };

export function walletReducer(state: WalletState, action: Action): WalletState {
    switch (action.type) {
        case 'RESTORE_START':
            return state.status === 'disconnected' || state.status === 'error' ? { ...state, status: 'restoring', error: null } : state;
        case 'RESTORE_ABORT':
            return state.status === 'restoring' ? { ...state, status: 'disconnected' } : state;
        case 'CONNECT_START':
            return { ...state, status: 'connecting', error: null };
        case 'CONNECT_SUCCESS':
            return { ...state, status: 'connected', address: action.payload.address, network: action.payload.network, error: null };
        case 'CONNECT_ERROR':
            return { ...state, status: 'error', error: action.payload.error };
        case 'DISCONNECT':
            return initialState;
        case 'BALANCE_FETCH_START':
            return { ...state, balanceStatus: 'loading', balanceError: null };
        case 'BALANCE_FETCH_SUCCESS':
            return { ...state, balance: action.payload.balance, balanceStatus: action.payload.status, network: action.payload.network };
        case 'BALANCE_FETCH_ERROR':
            return { ...state, balance: null, balanceStatus: 'error', balanceError: action.payload.error };
        case 'UPDATE_NETWORK':
            return { ...state, network: action.payload.network };
        case 'UPDATE_ADDRESS':
            return { ...state, address: action.payload.address };
        default:
            return state;
    }
}

interface WalletContextType extends WalletState {
    isConnecting: boolean;
    connect: () => Promise<boolean>;
    disconnect: () => void;
    checkConnection: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const BALANCE_REFRESH_INTERVAL = 30_000;
export const ACCOUNT_POLL_INTERVAL = 2_000;

export const WALLET_DISCONNECTED_KEY = 'disciplr:wallet:userDisconnected';

export function WalletProvider({ children }: { children: ReactNode }) {
    const [state, dispatch] = useReducer(walletReducer, initialState);
    const operationSeqRef = useRef(0);
    const abortControllerRef = useRef<AbortController | null>(null);
    const lastKnownAddressRef = useRef<string | null>(null);
    const lastKnownNetworkRef = useRef<WalletNetwork | null>(null);
    const checkConnectionInProgress = useRef(false);
    const connectInFlightRef = useRef<Promise<boolean> | null>(null);
    const connectAttemptRef = useRef(0);

    const normalizeNetwork = (networkName: string): WalletNetwork => {
        return networkName === 'PUBLIC' ? 'PUBLIC' : 'TESTNET';
    };

    const fetchNetworkAndBalance = useCallback(async (pubKey: string) => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();

        dispatch({ type: 'BALANCE_FETCH_START' });

        try {
            const netDetails = await getNetworkDetails();
            const seq = operationSeqRef.current;
            if (seq !== operationSeqRef.current) return;

            const activeNetwork = normalizeNetwork(netDetails.network);
            lastKnownNetworkRef.current = activeNetwork;

            const usdcBalance = await fetchUsdcBalance(pubKey, activeNetwork, fetch, {
                signal: abortControllerRef.current.signal,
            });
            if (seq !== operationSeqRef.current) return;

            dispatch({
                type: 'BALANCE_FETCH_SUCCESS',
                payload: {
                    balance: usdcBalance.balance,
                    status: usdcBalance.hasTrustline ? 'success' : 'no_trustline',
                    network: activeNetwork,
                },
            });
        } catch (err) {
            if (err instanceof Error && err.name === 'AbortError') return;
            const seq = operationSeqRef.current;
            if (seq !== operationSeqRef.current) return;
            logger.error('Failed to get network details', err);
            const message = err instanceof Error ? err.message : 'Unable to load USDC balance.';
            dispatch({ type: 'BALANCE_FETCH_ERROR', payload: { error: message } });
        }
    }, []);

    const checkConnection = useCallback(async () => {
        if (checkConnectionInProgress.current) return;
        checkConnectionInProgress.current = true;
        try {
            if (localStorage.getItem(WALLET_DISCONNECTED_KEY) === 'true') {
                return;
            }
            if ((await isAllowed()).isAllowed) {
                const { address: pubKey, error: addrError } = await getAddress();
                const seq = operationSeqRef.current;
                if (seq !== operationSeqRef.current) return;

                if (pubKey && !addrError) {
                    dispatch({ type: 'UPDATE_ADDRESS', payload: { address: pubKey } });

                    if (pubKey !== lastKnownAddressRef.current) {
                        lastKnownAddressRef.current = pubKey;
                        await fetchNetworkAndBalance(pubKey);
                    }
                }
            } else {
                dispatch({ type: 'RESTORE_ABORT' });
            }
        } catch (err) {
            const seq = operationSeqRef.current;
            if (seq !== operationSeqRef.current) return;
            logger.error('Check connection error', err);
        } finally {
            checkConnectionInProgress.current = false;
        }
    }, [fetchNetworkAndBalance]);

    useEffect(() => {
        checkConnection();
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
            operationSeqRef.current++;
        };
    }, [checkConnection]);

    // Fast polling for account changes & standard polling for balance
    useEffect(() => {
        if (!state.address) return;

        let lastBalanceCheck = Date.now();

        const tick = async () => {
            if (document.hidden) return;
            const seq = ++operationSeqRef.current;
            try {
                const { address: currentAddr, error: addrError } = await getAddress();
                if (seq !== operationSeqRef.current) return;

                if (currentAddr && !addrError && currentAddr !== lastKnownAddressRef.current) {
                    dispatch({ type: 'UPDATE_ADDRESS', payload: { address: currentAddr } });
                    lastKnownAddressRef.current = currentAddr;
                    lastBalanceCheck = Date.now();
                    await fetchNetworkAndBalance(currentAddr);
                } else if (Date.now() - lastBalanceCheck >= BALANCE_REFRESH_INTERVAL) {
                    lastBalanceCheck = Date.now();
                    const fallbackAddr = currentAddr || state.address;
                    if (fallbackAddr) await fetchNetworkAndBalance(fallbackAddr);
                }
            } catch {
                if (Date.now() - lastBalanceCheck >= BALANCE_REFRESH_INTERVAL) {
                    lastBalanceCheck = Date.now();
                    if (state.address) await fetchNetworkAndBalance(state.address);
                }
            }
        };

        const id = setInterval(tick, ACCOUNT_POLL_INTERVAL);

        const onVisibilityChange = () => {
            if (!document.hidden && state.address) {
                lastBalanceCheck = Date.now();
                fetchNetworkAndBalance(state.address);
            }
        };
        document.addEventListener('visibilitychange', onVisibilityChange);

        return () => {
            clearInterval(id);
            document.removeEventListener('visibilitychange', onVisibilityChange);
        };
    }, [state.address, fetchNetworkAndBalance]);

    const performConnect = useCallback(async (attempt: number): Promise<boolean> => {
        const seq = ++operationSeqRef.current;
        const startedAt = Date.now();
        dispatch({ type: 'CONNECT_START' });

        const timeoutMs = resolveConnectTimeoutMs(
            import.meta.env.VITE_WALLET_CONNECT_TIMEOUT_MS as string | undefined,
        );
        const timeoutId = setTimeout(() => {
            if (seq === operationSeqRef.current) {
                recordWalletTelemetry({
                    event: 'wallet.connect.timeout',
                    ts: Date.now(),
                    wallet: 'freighter',
                    durationMs: Date.now() - startedAt,
                    timeoutMs,
                    attempt,
                });
                dispatch({ type: 'CONNECT_ERROR', payload: { error: 'Wallet connection timed out.' } });
            }
        }, timeoutMs);

        try {
            await setAllowed();
            if (seq !== operationSeqRef.current) return false;

            const access = await requestAccess();
            if (seq !== operationSeqRef.current) return false;

            if (access) {
                const { address: pubKey, error: addrError } = await getAddress();
                if (seq !== operationSeqRef.current) return false;

                if (pubKey && !addrError) {
                    localStorage.removeItem(WALLET_DISCONNECTED_KEY);
                    lastKnownAddressRef.current = pubKey;

                    const netDetails = await getNetworkDetails();
                    if (seq !== operationSeqRef.current) return false;

                    const activeNetwork = normalizeNetwork(netDetails.network);
                    lastKnownNetworkRef.current = activeNetwork;

                    clearTimeout(timeoutId);
                    dispatch({ type: 'CONNECT_SUCCESS', payload: { address: pubKey, network: activeNetwork } });
                    recordWalletTelemetry({
                        event: 'wallet.connect.success',
                        ts: Date.now(),
                        wallet: 'freighter',
                        durationMs: Date.now() - startedAt,
                        attempt,
                    });
                    await fetchNetworkAndBalance(pubKey);
                    return true;
                } else {
                    clearTimeout(timeoutId);
                    dispatch({ type: 'CONNECT_ERROR', payload: { error: addrError || 'Failed to get wallet address.' } });
                    recordWalletTelemetry({
                        event: 'wallet.connect.failure',
                        ts: Date.now(),
                        wallet: 'freighter',
                        durationMs: Date.now() - startedAt,
                        attempt,
                        errorCode: 'address_unavailable',
                    });
                    return false;
                }
            } else {
                clearTimeout(timeoutId);
                dispatch({ type: 'CONNECT_ERROR', payload: { error: 'Wallet access denied.' } });
                recordWalletTelemetry({
                    event: 'wallet.connect.failure',
                    ts: Date.now(),
                    wallet: 'freighter',
                    durationMs: Date.now() - startedAt,
                    attempt,
                    errorCode: 'access_denied',
                });
                return false;
            }
        } catch (err: unknown) {
            if (seq !== operationSeqRef.current) return false;
            clearTimeout(timeoutId);
            logger.error('Connection error', err);
            const message = err instanceof Error ? err.message : undefined;
            dispatch({ type: 'CONNECT_ERROR', payload: { error: message || 'Failed to connect wallet. Make sure Freighter is installed and unlocked.' } });
            recordWalletTelemetry({
                event: 'wallet.connect.failure',
                ts: Date.now(),
                wallet: 'freighter',
                durationMs: Date.now() - startedAt,
                attempt,
                errorCode: 'wallet_error',
            });
            return false;
        }
    }, [fetchNetworkAndBalance]);

    const connect = useCallback((): Promise<boolean> => {
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
            () => { connectInFlightRef.current = null; },
            () => { connectInFlightRef.current = null; },
        );
        return promise;
    }, [performConnect]);

    const disconnect = useCallback(() => {
        operationSeqRef.current++;
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        localStorage.setItem(WALLET_DISCONNECTED_KEY, 'true');
        lastKnownAddressRef.current = null;
        lastKnownNetworkRef.current = null;
        dispatch({ type: 'DISCONNECT' });
    }, []);

    const isConnecting = state.status === 'connecting' || state.status === 'restoring';

    return (
        <WalletContext.Provider
            value={{
                ...state,
                isConnecting,
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
