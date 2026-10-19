import { createContext, useContext, useEffect, useReducer, useRef, ReactNode, useCallback } from 'react';
import {
    isAllowed,
    setAllowed,
    requestAccess,
    getAddress,
    getNetworkDetails,
    WatchWalletChanges,
} from '@stellar/freighter-api';
import { fetchUsdcBalance } from '../utils/horizon';
import { logger } from '../utils/logger';
import { recordWalletTelemetry, classifyConnectError } from '../utils/walletTelemetry';

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
}

export const WALLET_DISCONNECTED_KEY = 'disciplr:wallet:userDisconnected';
export const DEMO_MODE_KEY = 'disciplr:wallet:demoMode';

/** Public, keyless demo account used by "Try demo mode". Not a real funded account. */
export const DEMO_ADDRESS = 'GBVAQKGA5P4TIZSZJBS5AW3XNJOTYG6I3Y5CLIGCBBUZDHMVF7YE7XCQ';
const DEMO_NETWORK: WalletNetwork = 'TESTNET';
const DEMO_BALANCE = '10000.0000000';

const readInitialDemoMode = (): boolean => {
    if (typeof window === 'undefined') return false;
    try {
        return localStorage.getItem(DEMO_MODE_KEY) === 'true';
    } catch {
        return false;
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
};

const getInitialState = (): WalletState => {
    // A persisted demo session is restored synchronously so deep links and
    // reloads render as connected without waiting on (or consulting) Freighter.
    if (readInitialDemoMode()) {
        return { ...demoState };
    }
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

export function walletReducer(state: WalletState, action: Action): WalletState {
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
    disconnect: () => void;
    checkConnection: () => Promise<void>;
    connectDemo: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const BALANCE_REFRESH_INTERVAL = 30_000;
export const WALLET_WATCH_INTERVAL = 3_000;

const normalizeNetwork = (networkName: string): WalletNetwork => {
    return networkName === 'PUBLIC' ? 'PUBLIC' : 'TESTNET';
};

export function WalletProvider({ children }: { children: ReactNode }) {
    const [state, dispatch] = useReducer(walletReducer, undefined, getInitialState);
    const operationSeqRef = useRef(0);
    const connectInFlightRef = useRef<Promise<boolean> | null>(null);
    const connectAttemptRef = useRef(0);
    const abortControllerRef = useRef<AbortController | null>(null);
    const checkConnectionInProgress = useRef(false);
    const isMountedRef = useRef(true);
    // True when the provider mounted with a persisted demo session (state was
    // initialised from demoState by getInitialState above).
    const demoModeRef = useRef(state.address === DEMO_ADDRESS);
    const lastKnownAddressRef = useRef<string | null>(demoModeRef.current ? DEMO_ADDRESS : null);
    const lastKnownNetworkRef = useRef<WalletNetwork | null>(demoModeRef.current ? DEMO_NETWORK : null);

    const fetchNetworkAndBalance = useCallback(
        async (pubKey: string, providedSeq?: number, knownNetwork?: WalletNetwork) => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
            const controller = new AbortController();
            abortControllerRef.current = controller;

            dispatch({ type: 'BALANCE_FETCH_START' });
            const seq = providedSeq ?? operationSeqRef.current;

            try {
                let activeNetwork = knownNetwork;
                if (!activeNetwork) {
                    const netDetails = await getNetworkDetails();
                    if (controller.signal.aborted || seq !== operationSeqRef.current) return;
                    if (netDetails.error || !netDetails.network) {
                        throw new Error('Unable to determine wallet network.');
                    }
                    activeNetwork = normalizeNetwork(netDetails.network);
                }
                lastKnownNetworkRef.current = activeNetwork;

                const usdcBalance = await fetchUsdcBalance(pubKey, activeNetwork, fetch, {
                    signal: controller.signal,
                });
                if (controller.signal.aborted || seq !== operationSeqRef.current) return;

                dispatch({
                    type: 'BALANCE_FETCH_SUCCESS',
                    payload: {
                        balance: usdcBalance.balance,
                        status: usdcBalance.hasTrustline ? 'success' : 'no_trustline',
                        network: activeNetwork,
                    },
                });
            } catch (err) {
                if (controller.signal.aborted) return;
                if (err instanceof Error && err.name === 'AbortError') return;
                if (seq !== operationSeqRef.current) return;
                logger.error('Failed to get network details', err);
                const message = err instanceof Error ? err.message : 'Unable to load USDC balance.';
                dispatch({ type: 'BALANCE_FETCH_ERROR', payload: { error: message } });
            }
        },
        [],
    );

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

            const allowed = await isAllowed();
            if (seq !== operationSeqRef.current || demoModeRef.current) return;
            if (allowed.error || !allowed.isAllowed) {
                dispatch({ type: 'RESTORE_ABORT' });
                return;
            }

            const { address: pubKey, error: addrError } = await getAddress();
            if (seq !== operationSeqRef.current || demoModeRef.current) return;
            if (!pubKey || addrError) {
                dispatch({ type: 'RESTORE_ABORT' });
                return;
            }

            const netDetails = await getNetworkDetails();
            if (seq !== operationSeqRef.current || demoModeRef.current) return;
            if (netDetails.error || !netDetails.network) {
                dispatch({ type: 'RESTORE_ABORT' });
                return;
            }
            const activeNetwork = normalizeNetwork(netDetails.network);

            lastKnownAddressRef.current = pubKey;
            lastKnownNetworkRef.current = activeNetwork;
            dispatch({ type: 'CONNECT_SUCCESS', payload: { address: pubKey, network: activeNetwork } });
            await fetchNetworkAndBalance(pubKey, seq, activeNetwork);
        } catch (err) {
            if (seq !== operationSeqRef.current || demoModeRef.current) return;
            logger.error('Check connection error', err);
            dispatch({ type: 'RESTORE_ABORT' });
        } finally {
            checkConnectionInProgress.current = false;
        }
    }, [fetchNetworkAndBalance]);

    useEffect(() => {
        isMountedRef.current = true;
        checkConnection();
        return () => {
            isMountedRef.current = false;
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
            operationSeqRef.current++;
        };
    }, [checkConnection]);

    // Watch Freighter for account/network changes instead of polling getAddress.
    useEffect(() => {
        if (!state.address || demoModeRef.current) return;

        const watcher = new WatchWalletChanges(WALLET_WATCH_INTERVAL);
        watcher.watch(({ address, network, error }) => {
            if (!isMountedRef.current || demoModeRef.current || !lastKnownAddressRef.current) return;
            if (error || !address) return;

            const activeNetwork = normalizeNetwork(network);
            const addressChanged = address !== lastKnownAddressRef.current;
            const networkChanged = activeNetwork !== lastKnownNetworkRef.current;

            if (!addressChanged && !networkChanged) return;

            if (addressChanged) {
                lastKnownAddressRef.current = address;
                dispatch({ type: 'UPDATE_ADDRESS', payload: { address } });
            }
            if (networkChanged) {
                lastKnownNetworkRef.current = activeNetwork;
                dispatch({ type: 'UPDATE_NETWORK', payload: { network: activeNetwork } });
            }

            void fetchNetworkAndBalance(address, undefined, activeNetwork);
        });

        return () => {
            watcher.stop();
        };
    }, [state.address, fetchNetworkAndBalance]);

    // Standard balance refresh, paused while the tab is hidden.
    useEffect(() => {
        if (!state.address || demoModeRef.current) return;
        const address = state.address;

        const refresh = () => {
            if (document.hidden) return;
            void fetchNetworkAndBalance(address);
        };

        const id = setInterval(refresh, BALANCE_REFRESH_INTERVAL);

        const onVisibilityChange = () => {
            if (!document.hidden) {
                refresh();
            }
        };
        document.addEventListener('visibilitychange', onVisibilityChange);

        return () => {
            clearInterval(id);
            document.removeEventListener('visibilitychange', onVisibilityChange);
        };
    }, [state.address, fetchNetworkAndBalance]);

    const performConnect = async (attempt: number): Promise<boolean> => {
        const seq = ++operationSeqRef.current;
        const startedAt = Date.now();
        dispatch({ type: 'CONNECT_START' });
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
                    // A real wallet connection supersedes demo mode.
                    demoModeRef.current = false;
                    localStorage.removeItem(DEMO_MODE_KEY);
                    lastKnownAddressRef.current = pubKey;
                    const netDetails = await getNetworkDetails();
                    if (seq !== operationSeqRef.current) return false;
                    const activeNetwork = normalizeNetwork(netDetails.network);
                    lastKnownNetworkRef.current = activeNetwork;
                    
                    dispatch({ type: 'CONNECT_SUCCESS', payload: { address: pubKey, network: activeNetwork } });
                    await fetchNetworkAndBalance(pubKey, seq, activeNetwork);
                    recordWalletTelemetry({
                        event: 'wallet.connect.success',
                        ts: Date.now(),
                        wallet: 'freighter',
                        durationMs: Date.now() - startedAt,
                        attempt,
                    });
                    return true;
                } else {
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
                }
            } else {
                const errorMsg = 'Wallet access denied.';
                dispatch({ type: 'CONNECT_ERROR', payload: { error: errorMsg } });
                recordWalletTelemetry({
                    event: 'wallet.connect.failure',
                    ts: Date.now(),
                    wallet: 'freighter',
                    durationMs: Date.now() - startedAt,
                    attempt,
                    errorCode: classifyConnectError(errorMsg),
                });
            }

            return false;
        } catch (err: unknown) {
            if (seq !== operationSeqRef.current) return false;
            logger.error('Connection error', err);
            const message = err instanceof Error ? err.message : undefined;
            dispatch({ type: 'CONNECT_ERROR', payload: { error: message || 'Failed to connect wallet. Make sure Freighter is installed and unlocked.' } });
            recordWalletTelemetry({
                event: 'wallet.connect.failure',
                ts: Date.now(),
                wallet: 'freighter',
                durationMs: Date.now() - startedAt,
                attempt,
                errorCode: classifyConnectError(message),
            });
            return false;
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

    const disconnect = useCallback(() => {
        demoModeRef.current = false;
        operationSeqRef.current++;
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        connectInFlightRef.current = null;
        localStorage.setItem(WALLET_DISCONNECTED_KEY, 'true');
        localStorage.removeItem(DEMO_MODE_KEY);
        lastKnownAddressRef.current = null;
        lastKnownNetworkRef.current = null;
        dispatch({ type: 'DISCONNECT' });
    }, []);

    // Demo mode: lets visitors without Freighter explore the app on testnet with a built-in account.
    const connectDemo = useCallback(() => {
        operationSeqRef.current++;
        demoModeRef.current = true;
        localStorage.removeItem(WALLET_DISCONNECTED_KEY);
        localStorage.setItem(DEMO_MODE_KEY, 'true');
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        lastKnownAddressRef.current = DEMO_ADDRESS;
        lastKnownNetworkRef.current = DEMO_NETWORK;
        dispatch({ type: 'DEMO_CONNECT' });
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
                connectDemo,
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
