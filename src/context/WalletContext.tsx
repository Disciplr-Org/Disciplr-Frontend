import { createContext, useContext, useEffect, useReducer, useRef, ReactNode, useCallback } from 'react';
import { isAllowed, setAllowed, requestAccess, getAddress, getNetworkDetails } from '@stellar/freighter-api';
import { fetchUsdcBalance } from '../utils/horizon';
import { logger } from '../utils/logger';
import {
    recordWalletTelemetry,
    classifyConnectError,
    resolveConnectTimeoutMs,
    type ConnectErrorCode,
} from '../utils/walletTelemetry';
import { setDemoMode } from '../services/vaultService';
import { resetDemoStore } from '../services/demoStore';
import { withTimeout, ConnectTimeoutError } from '../utils/withTimeout';

export type WalletNetwork = 'TESTNET' | 'PUBLIC';
export type BalanceStatus = 'idle' | 'loading' | 'success' | 'no_trustline' | 'error';
export type WalletStatus = 'disconnected' | 'restoring' | 'connecting' | 'connected' | 'error';
export type SessionStatus = 'resolving' | 'authenticated' | 'anonymous';

interface WalletState {
    status: WalletStatus;
    sessionStatus: SessionStatus;
    address: string | null;
    network: WalletNetwork | null;
    balance: string | null;
    balanceStatus: BalanceStatus;
    balanceError: string | null;
    error: string | null;
    isDemo: boolean;
}

export const WALLET_DISCONNECTED_KEY = 'disciplr:wallet:userDisconnected';
export const DEMO_MODE_KEY = 'disciplr:wallet:demo';

/** Public, keyless demo account used by "Try demo mode". Not a real funded account. */
export const DEMO_ADDRESS = 'GBVAQKGA5P4TIZSZJBS5AW3XNJOTYG6I3Y5CLIGCBBUZDHMVF7YE7XCQ';
const DEMO_NETWORK: WalletNetwork = 'TESTNET';
const DEMO_BALANCE = '10000.0000000';

const readInitialDemoMode = (): boolean => {
    if (typeof window === 'undefined') return false;
    try {
        const fromSession = window.sessionStorage?.getItem(DEMO_MODE_KEY) === 'true';
        const fromLocal = window.localStorage?.getItem(DEMO_MODE_KEY) === 'true';
        return fromSession || fromLocal;
    } catch {
        return false;
    }
};

const persistDemoSession = (active: boolean) => {
    if (typeof window === 'undefined') return;
    try {
        if (active) {
            window.sessionStorage?.setItem(DEMO_MODE_KEY, 'true');
            window.localStorage?.setItem(DEMO_MODE_KEY, 'true');
        } else {
            window.sessionStorage?.removeItem(DEMO_MODE_KEY);
            window.localStorage?.removeItem(DEMO_MODE_KEY);
        }
    } catch {
        // Fall back gracefully if storage is restricted
    }
};

const getInitialSessionStatus = (): { sessionStatus: SessionStatus; status: WalletStatus } => {
    if (typeof window !== 'undefined' && localStorage.getItem(WALLET_DISCONNECTED_KEY) === 'true') {
        return { sessionStatus: 'anonymous', status: 'disconnected' };
    }
    return { sessionStatus: 'resolving', status: 'restoring' };
};

const disconnectedState: WalletState = {
    status: 'disconnected',
    sessionStatus: 'anonymous',
    address: null,
    network: null,
    balance: null,
    balanceStatus: 'idle',
    balanceError: null,
    error: null,
    isDemo: false,
};

/** Wallet state for an active demo session (shared by connectDemo and reload restore). */
const demoState: WalletState = {
    status: 'connected',
    sessionStatus: 'authenticated',
    address: DEMO_ADDRESS,
    network: DEMO_NETWORK,
    balance: DEMO_BALANCE,
    balanceStatus: 'success',
    balanceError: null,
    error: null,
    isDemo: true,
};

const getInitialState = (): WalletState => {
    // A persisted demo session is restored synchronously so deep links and
    // reloads render as connected without waiting on (or consulting) Freighter.
    if (readInitialDemoMode()) {
        setDemoMode(true);
        return { ...demoState };
    }
    setDemoMode(false);
    const initialSession = getInitialSessionStatus();
    return {
        ...disconnectedState,
        status: initialSession.status,
        sessionStatus: initialSession.sessionStatus,
    };
};

type Action =
    | { type: 'RESTORE_START' }
    | { type: 'RESTORE_ABORT' }
    | { type: 'CONNECT_START' }
    | { type: 'CONNECT_SUCCESS'; payload: { address: string; network: WalletNetwork } }
    | { type: 'CONNECT_ERROR'; payload: { error: string } }
    | { type: 'DISCONNECT' }
    | { type: 'DEMO_CONNECT' }
    | { type: 'BALANCE_FETCH_START' }
    | { type: 'BALANCE_FETCH_SUCCESS'; payload: { balance: string | null; status: BalanceStatus; network: WalletNetwork } }
    | { type: 'BALANCE_FETCH_ERROR'; payload: { error: string } }
    | { type: 'UPDATE_NETWORK'; payload: { network: WalletNetwork } }
    | { type: 'UPDATE_ADDRESS'; payload: { address: string } };

function walletReducer(state: WalletState, action: Action): WalletState {
    switch (action.type) {
        case 'RESTORE_START':
            return {
                ...state,
                status: 'restoring',
                sessionStatus: 'resolving',
                error: null,
            };
        case 'RESTORE_ABORT':
            return {
                ...state,
                status: state.status === 'restoring' ? 'disconnected' : state.status,
                sessionStatus: 'anonymous',
            };
        case 'CONNECT_START':
            return { ...state, status: 'connecting', error: null };
        case 'CONNECT_SUCCESS':
            return {
                ...state,
                status: 'connected',
                sessionStatus: 'authenticated',
                address: action.payload.address,
                network: action.payload.network,
                isDemo: false,
                error: null,
            };
        case 'CONNECT_ERROR':
            return {
                ...state,
                status: 'error',
                sessionStatus: state.address ? 'authenticated' : 'anonymous',
                error: action.payload.error,
            };
        case 'DISCONNECT':
            return { ...disconnectedState };
        case 'DEMO_CONNECT':
            return { ...demoState };
        case 'BALANCE_FETCH_START':
            return { ...state, balanceStatus: 'loading', balanceError: null };
        case 'BALANCE_FETCH_SUCCESS':
            return { ...state, balance: action.payload.balance, balanceStatus: action.payload.status, network: action.payload.network };
        case 'BALANCE_FETCH_ERROR':
            return { ...state, balance: null, balanceStatus: 'error', balanceError: action.payload.error };
        case 'UPDATE_NETWORK':
            return { ...state, network: action.payload.network };
        case 'UPDATE_ADDRESS':
            return {
                ...state,
                status: 'connected',
                sessionStatus: 'authenticated',
                address: action.payload.address,
            };
        default:
            return state;
    }
}

interface WalletContextType extends WalletState {
    isConnecting: boolean;
    connect: () => Promise<boolean>;
    cancelConnect: () => void;
    disconnect: () => void;
    checkConnection: () => Promise<void>;
    connectDemo: () => void;
    resetDemo: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const BALANCE_REFRESH_INTERVAL = 30_000;
export const ACCOUNT_POLL_INTERVAL = 2_000; // Check account explicitly every 2s

export function WalletProvider({ children }: { children: ReactNode }) {
    const [state, dispatch] = useReducer(walletReducer, undefined, getInitialState);
    const operationSeqRef = useRef(0);
    const connectInFlightRef = useRef<Promise<boolean> | null>(null);
    const connectAttemptRef = useRef(0);
    const connectStartTsRef = useRef<number | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);
    const checkConnectionInProgress = useRef(false);
    // True when the provider mounted with a persisted demo session (state was
    // initialised from demoState by getInitialState above).
    const demoModeRef = useRef(state.isDemo);
    const lastKnownAddressRef = useRef<string | null>(demoModeRef.current ? DEMO_ADDRESS : null);
    const lastKnownNetworkRef = useRef<WalletNetwork | null>(demoModeRef.current ? DEMO_NETWORK : null);

    // Keep vaultService demo routing synced with state.isDemo
    useEffect(() => {
        demoModeRef.current = state.isDemo;
        setDemoMode(state.isDemo);
    }, [state.isDemo]);

    const normalizeNetwork = (networkName: string): WalletNetwork => {
        return networkName === 'PUBLIC' ? 'PUBLIC' : 'TESTNET';
    };

    const fetchNetworkAndBalance = useCallback(async (pubKey: string, providedSeq?: number) => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();

        dispatch({ type: 'BALANCE_FETCH_START' });
        const seq = providedSeq ?? operationSeqRef.current;

        try {
            const netDetails = await getNetworkDetails();
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
            if (seq !== operationSeqRef.current) return;
            logger.error('Failed to get network details', err);
            const message = err instanceof Error ? err.message : 'Unable to load USDC balance.';
            dispatch({ type: 'BALANCE_FETCH_ERROR', payload: { error: message } });
        }
    }, []);

    const checkConnection = useCallback(async () => {
        if (checkConnectionInProgress.current) return;
        checkConnectionInProgress.current = true;
        const seq = operationSeqRef.current;
        try {
            // An active demo session is never overridden by Freighter restore.
            if (demoModeRef.current) return;
            if (localStorage.getItem(WALLET_DISCONNECTED_KEY) === 'true') {
                dispatch({ type: 'RESTORE_ABORT' });
                return;
            }
            dispatch({ type: 'RESTORE_START' });
            if ((await isAllowed()).isAllowed) {
                const { address: pubKey, error: addrError } = await getAddress();
                if (seq !== operationSeqRef.current || demoModeRef.current) return;
                
                if (pubKey && !addrError) {
                    dispatch({ type: 'UPDATE_ADDRESS', payload: { address: pubKey } });
                    
                    // Skip redundant fetch if address hasn't changed
                    if (pubKey !== lastKnownAddressRef.current) {
                        lastKnownAddressRef.current = pubKey;
                        await fetchNetworkAndBalance(pubKey);
                    }
                } else {
                    dispatch({ type: 'RESTORE_ABORT' });
                }
            } else {
                dispatch({ type: 'RESTORE_ABORT' });
            }
        } catch (err) {
            if (seq !== operationSeqRef.current) return;
            logger.error('Check connection error', err);
            dispatch({ type: 'RESTORE_ABORT' });
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
            connectInFlightRef.current = null;
            connectStartTsRef.current = null;
            operationSeqRef.current++;
        };
    }, [checkConnection]);

    // Fast polling for account changes & standard polling for balance
    useEffect(() => {
        if (!state.address || demoModeRef.current) return;

        let lastBalanceCheck = Date.now();
        
        const tick = async () => {
            if (document.hidden) return;
            const seq = ++operationSeqRef.current;
            try {
                const { address: currentAddr, error: addrError } = await getAddress();
                if (seq !== operationSeqRef.current) return;
                
                if (currentAddr && !addrError && currentAddr !== lastKnownAddressRef.current) {
                    // Account changed! Update state and fetch immediately
                    dispatch({ type: 'UPDATE_ADDRESS', payload: { address: currentAddr } });
                    lastKnownAddressRef.current = currentAddr;
                    lastBalanceCheck = Date.now();
                    await fetchNetworkAndBalance(currentAddr);
                } else if (Date.now() - lastBalanceCheck >= BALANCE_REFRESH_INTERVAL) {
                    // Refresh balance on the existing account
                    lastBalanceCheck = Date.now();
                    const addrToFetch = currentAddr || state.address;
                    if (addrToFetch) {
                        await fetchNetworkAndBalance(addrToFetch);
                    }
                }
            } catch {
                // If it fails, fallback
                if (Date.now() - lastBalanceCheck >= BALANCE_REFRESH_INTERVAL) {
                    lastBalanceCheck = Date.now();
                    if (state.address) {
                        await fetchNetworkAndBalance(state.address);
                    }
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
        connectStartTsRef.current = startedAt;
        dispatch({ type: 'CONNECT_START' });
        const timeoutMs = resolveConnectTimeoutMs(import.meta.env.VITE_WALLET_CONNECT_TIMEOUT_MS);
        let wasTimedOut = false;

        try {
            const connected = await withTimeout((async () => {
                await setAllowed();
                if (seq !== operationSeqRef.current) return false;

                const access = await requestAccess();
                if (seq !== operationSeqRef.current) return false;

                if (!access) {
                    const errorMsg = 'Wallet access denied.';
                    dispatch({ type: 'CONNECT_ERROR', payload: { error: errorMsg } });
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

                const { address: pubKey, error: addrError } = await getAddress();
                if (seq !== operationSeqRef.current) return false;

                if (!pubKey || addrError) {
                    const errorMsg = addrError || 'Failed to get wallet address.';
                    dispatch({ type: 'CONNECT_ERROR', payload: { error: errorMsg } });
                    recordWalletTelemetry({
                        event: 'wallet.connect.failure',
                        ts: Date.now(),
                        wallet: 'freighter',
                        durationMs: Date.now() - startedAt,
                        attempt,
                        errorCode: classifyConnectError(errorMsg),
                    });
                    return false;
                }

                localStorage.removeItem(WALLET_DISCONNECTED_KEY);
                // A real wallet connection supersedes demo mode.
                demoModeRef.current = false;
                setDemoMode(false);
                persistDemoSession(false);
                lastKnownAddressRef.current = pubKey;
                const netDetails = await getNetworkDetails();
                if (seq !== operationSeqRef.current) return false;

                const activeNetwork = normalizeNetwork(netDetails.network);
                lastKnownNetworkRef.current = activeNetwork;

                dispatch({ type: 'CONNECT_SUCCESS', payload: { address: pubKey, network: activeNetwork } });
                await fetchNetworkAndBalance(pubKey, seq);
                recordWalletTelemetry({
                    event: 'wallet.connect.success',
                    ts: Date.now(),
                    wallet: 'freighter',
                    durationMs: Date.now() - startedAt,
                    attempt,
                });
                return true;
            })(), timeoutMs, () => {
                if (seq !== operationSeqRef.current) return;
                wasTimedOut = true;
                operationSeqRef.current += 1;
            });

            return connected;
        } catch (err: unknown) {
            if (err instanceof ConnectTimeoutError) {
                if (!wasTimedOut || seq !== operationSeqRef.current - 1) {
                    return false;
                }
                const durationMs = Date.now() - startedAt;
                dispatch({ type: 'CONNECT_ERROR', payload: { error: "Freighter didn't respond. Check the extension popup and try again." } });
                recordWalletTelemetry({
                    event: 'wallet.connect.timeout',
                    ts: Date.now(),
                    wallet: 'freighter',
                    durationMs,
                    timeoutMs,
                    attempt,
                });
                return false;
            }
            if (seq !== operationSeqRef.current) return false;

            logger.error('Connection error', err);
            const message = err instanceof Error ? err.message : 'Failed to connect wallet. Make sure Freighter is installed and unlocked.';
            const errorCode = classifyConnectError(message);
            dispatch({ type: 'CONNECT_ERROR', payload: { error: message } });
            recordWalletTelemetry({
                event: 'wallet.connect.failure',
                ts: Date.now(),
                wallet: 'freighter',
                durationMs: Date.now() - startedAt,
                attempt,
                errorCode,
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
        const attempt = connectAttemptRef.current;
        recordWalletTelemetry({
            event: 'wallet.connect.attempt',
            ts: Date.now(),
            wallet: 'freighter',
            attempt,
        });

        const promise = performConnect(attempt);
        connectInFlightRef.current = promise;
        void promise.finally(() => {
            if (connectInFlightRef.current === promise) {
                connectInFlightRef.current = null;
            }
            // Clear the start timestamp only if a newer attempt hasn't started.
            if (connectAttemptRef.current === attempt) {
                connectStartTsRef.current = null;
            }
        });
        return promise;
    }, [performConnect]);

    const cancelConnect = useCallback(() => {
        const attempt = connectAttemptRef.current;
        const startedAt = connectStartTsRef.current ?? Date.now();
        operationSeqRef.current += 1;
        connectInFlightRef.current = null;
        connectStartTsRef.current = null;

        dispatch({ type: 'CONNECT_ERROR', payload: { error: 'Freighter connection cancelled. Close the popup and try again.' } });
        recordWalletTelemetry({
            event: 'wallet.connect.failure',
            ts: Date.now(),
            wallet: 'freighter',
            durationMs: Date.now() - startedAt,
            attempt,
            errorCode: 'cancelled',
        });
    }, []);

    const disconnect = useCallback(() => {
        demoModeRef.current = false;
        setDemoMode(false);
        resetDemoStore();
        operationSeqRef.current++;
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        connectInFlightRef.current = null;
        connectStartTsRef.current = null;
        localStorage.setItem(WALLET_DISCONNECTED_KEY, 'true');
        persistDemoSession(false);
        lastKnownAddressRef.current = null;
        lastKnownNetworkRef.current = null;
        dispatch({ type: 'DISCONNECT' });
    }, []);

    // Demo mode: lets visitors without Freighter explore the app on testnet with a built-in account.
    const connectDemo = useCallback(() => {
        operationSeqRef.current++;
        demoModeRef.current = true;
        setDemoMode(true);
        localStorage.removeItem(WALLET_DISCONNECTED_KEY);
        persistDemoSession(true);
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        lastKnownAddressRef.current = DEMO_ADDRESS;
        lastKnownNetworkRef.current = DEMO_NETWORK;
        dispatch({ type: 'DEMO_CONNECT' });
    }, []);

    const resetDemo = useCallback(() => {
        resetDemoStore();
        // Trigger re-render or notification if needed
        if (demoModeRef.current) {
            dispatch({ type: 'DEMO_CONNECT' });
        }
    }, []);

    const isConnecting = state.status === 'connecting' || state.status === 'restoring';

    return (
        <WalletContext.Provider
            value={{
                ...state,
                isConnecting,
                connect,
                cancelConnect,
                disconnect,
                checkConnection,
                connectDemo,
                resetDemo,
            }}
        >
            {children}
        </WalletContext.Provider>
    );
}

export function useOptionalWallet(): WalletContextType | undefined {
    return useContext(WalletContext);
}

export function useWallet() {
    const context = useContext(WalletContext);
    if (context === undefined) {
        throw new Error('useWallet must be used within a WalletProvider');
    }
    return context;
}

