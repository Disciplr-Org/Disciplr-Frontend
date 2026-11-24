import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useRef,
  useCallback,
  type ReactNode,
} from 'react';
import { fetchUsdcBalance } from '../utils/horizon';
import { clearDraft as clearCreateVaultDraft } from '../utils/createVaultDraft';
import { logger } from '../utils/logger';
import {
    classifyConnectError,
  recordWalletTelemetry,
  resolveConnectTimeoutMs,
  classifyConnectError,
} from '../utils/walletTelemetry';
import { setDemoMode } from '../services/vaultService';
import { resetDemoStore } from '../services/demoStore';
import { withTimeout, ConnectTimeoutError } from '../utils/withTimeout';
import { defaultFreighterAdapter, type FreighterAdapter } from './freighterAdapter';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type WalletNetwork = 'TESTNET' | 'PUBLIC';
export type BalanceStatus = 'idle' | 'loading' | 'success' | 'no_trustline' | 'error';
export type WalletStatus = 'disconnected' | 'restoring' | 'connecting' | 'connected' | 'error';
export type SessionStatus = 'resolving' | 'authenticated' | 'anonymous';

interface WalletState {
    sessionStatus: SessionStatus;
    isDemo: boolean;
  status: WalletStatus;
  address: string | null;
  network: WalletNetwork | null;
  balance: string | null;
  balanceStatus: BalanceStatus;
  balanceError: string | null;
  error: string | null;
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
// ---------------------------------------------------------------------------
// Constants & storage keys (unchanged public API)
// ---------------------------------------------------------------------------

export const BALANCE_REFRESH_INTERVAL = 30_000;
export const ACCOUNT_POLL_INTERVAL = 2_000;
export const WALLET_DISCONNECTED_KEY = 'disciplr:wallet:userDisconnected';
export const CONNECT_TIMEOUT_MS = resolveConnectTimeoutMs(
  import.meta.env?.VITE_WALLET_CONNECT_TIMEOUT_MS,
);

// ---------------------------------------------------------------------------
// Reducer (unchanged public API)
// ---------------------------------------------------------------------------

    sessionStatus: 'anonymous',
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
  status: 'disconnected',
  address: null,
  network: null,
  balance: null,
  balanceStatus: 'idle',
  balanceError: null,
  error: null,
};

    | { type: 'DEMO_CONNECT' }
export type Action =
  | { type: 'RESTORE_START' }
  | { type: 'RESTORE_ABORT' }
  | { type: 'CONNECT_START' }
  | { type: 'CONNECT_SUCCESS'; payload: { address: string; network: WalletNetwork } }
  | { type: 'CONNECT_ERROR'; payload: { error: string } }
  | { type: 'DISCONNECT' }
  | { type: 'BALANCE_FETCH_START' }
  | {
      type: 'BALANCE_FETCH_SUCCESS';
      payload: { balance: string | null; status: BalanceStatus; network: WalletNetwork };
    }
  | { type: 'BALANCE_FETCH_ERROR'; payload: { error: string } }
  | { type: 'UPDATE_NETWORK'; payload: { network: WalletNetwork } }
  | { type: 'UPDATE_ADDRESS'; payload: { address: string } };

export function walletReducer(state: WalletState, action: Action): WalletState {
  switch (action.type) {
    case 'RESTORE_START':
      return state.status === 'disconnected' || state.status === 'error'
        ? { ...state, status: 'restoring', error: null }
        : state;
    case 'RESTORE_ABORT':
      return state.status === 'restoring' ? { ...state, status: 'disconnected' } : state;
    case 'CONNECT_START':
      return { ...state, status: 'connecting', error: null };
    case 'CONNECT_SUCCESS':
      return {
        ...state,
        status: 'connected',
        address: action.payload.address,
        network: action.payload.network,
        error: null,
      };
    case 'CONNECT_ERROR':
      return { ...state, status: 'error', error: action.payload.error };
    case 'DISCONNECT':
      return initialState;
    case 'BALANCE_FETCH_START':
      return { ...state, balanceStatus: 'loading', balanceError: null };
    case 'BALANCE_FETCH_SUCCESS':
      return {
        ...state,
        balance: action.payload.balance,
        balanceStatus: action.payload.status,
        network: action.payload.network,
      };
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

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface WalletContextType extends WalletState {
    cancelConnect: () => void;
    connectDemo: () => void;
    resetDemo: () => void;
  isConnecting: boolean;
  connect: () => Promise<boolean>;
  disconnect: () => void;
  checkConnection: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

interface WalletProviderProps {
  children: ReactNode;
  /** Injected adapter — defaults to real Freighter. Override in tests. */
  adapter?: FreighterAdapter;
}

    const isMountedRef = useRef(true);
    // True when the provider mounted with a persisted demo session (state was
    // initialised from demoState by getInitialState above).
    const demoModeRef = useRef(state.isDemo);
    const lastKnownAddressRef = useRef<string | null>(demoModeRef.current ? DEMO_ADDRESS : null);
    const lastKnownNetworkRef = useRef<WalletNetwork | null>(demoModeRef.current ? DEMO_NETWORK : null);
export function WalletProvider({
  children,
  adapter = defaultFreighterAdapter,
}: WalletProviderProps) {
  const [state, dispatch] = useReducer(walletReducer, initialState);

    // Keep vaultService demo routing synced with state.isDemo
    useEffect(() => {
        demoModeRef.current = state.isDemo;
        setDemoMode(state.isDemo);
    }, [state.isDemo]);
  // Monotonically-increasing sequence number. Any async operation captures
  // the value at start; before writing state it checks whether the captured
  // value is still current, discarding stale responses.
  const operationSeqRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastKnownAddressRef = useRef<string | null>(null);
  const lastKnownNetworkRef = useRef<WalletNetwork | null>(null);
  const checkConnectionInProgress = useRef(false);

    const fetchNetworkAndBalance = useCallback(
        async (pubKey: string, providedSeq?: number, knownNetwork?: WalletNetwork) => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
            const controller = new AbortController();
            abortControllerRef.current = controller;
  // In-flight connect promise for bounded concurrency.
  const connectInFlightRef = useRef<Promise<boolean> | null>(null);
  const connectAttemptRef = useRef(0);

  // Tracks the last time the balance was refreshed, used by the combined tick.
  const lastBalanceCheckRef = useRef<number>(0);

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  const normalizeNetwork = (networkName: string): WalletNetwork =>
    networkName === 'PUBLIC' ? 'PUBLIC' : 'TESTNET';

  const fetchNetworkAndBalance = useCallback(
    async (pubKey: string, seq?: number) => {
      const capturedSeq = seq ?? operationSeqRef.current;

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      dispatch({ type: 'BALANCE_FETCH_START' });

      try {
        const netDetails = await adapter.getNetworkDetails();
        if (capturedSeq !== operationSeqRef.current) return;

        const activeNetwork = normalizeNetwork(netDetails.network);
        lastKnownNetworkRef.current = activeNetwork;

        const usdcBalance = await fetchUsdcBalance(pubKey, activeNetwork, fetch, {
          signal: abortControllerRef.current.signal,
        });
        if (capturedSeq !== operationSeqRef.current) return;

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
        if (capturedSeq !== operationSeqRef.current) return;
        logger.error('Failed to get network details', err);
        const message = err instanceof Error ? err.message : 'Unable to load USDC balance.';
        dispatch({ type: 'BALANCE_FETCH_ERROR', payload: { error: message } });
      }
    },
    [adapter],
  );

  // ---------------------------------------------------------------------------
  // checkConnection — auto-restore on mount
  // ---------------------------------------------------------------------------

  const checkConnection = useCallback(async () => {
    if (checkConnectionInProgress.current) return;
    checkConnectionInProgress.current = true;
    try {
      if (localStorage.getItem(WALLET_DISCONNECTED_KEY) === 'true') return;

      const result = await adapter.isAllowed();
      if (result.isAllowed) {
        const { address: pubKey, error: addrError } = await adapter.getAddress();
        if (pubKey && !addrError) {
          dispatch({ type: 'UPDATE_ADDRESS', payload: { address: pubKey } });
          if (pubKey !== lastKnownAddressRef.current) {
            lastKnownAddressRef.current = pubKey;
            await fetchNetworkAndBalance(pubKey);
          }
      } else {
        dispatch({ type: 'RESTORE_ABORT' });
      }
    } catch (err) {
      logger.error('Check connection error', err);
    } finally {
      checkConnectionInProgress.current = false;
    }
  }, [adapter, fetchNetworkAndBalance]);

  // Run once on mount.
  useEffect(() => {
    void checkConnection();
    return () => {
      abortControllerRef.current?.abort();
      operationSeqRef.current++;
    };
  }, [checkConnection]);

  // ---------------------------------------------------------------------------
  // Combined watcher + balance-polling tick (single setInterval)
  //
  // Using a single interval matches the shape the tests expect: they mock
  // globalThis.setInterval and capture the first (and only) callback, then
  // invoke it manually to drive both address/network detection and balance
  // refresh. Pauses when document is hidden (for the balance-refresh path).
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!state.address) return;

        const seq = operationSeqRef.current;
            // An active demo session is never overridden by Freighter restore.
            if (demoModeRef.current) return;
                dispatch({ type: 'RESTORE_ABORT' });
                return;

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
            dispatch({ type: 'RESTORE_ABORT' });
    const address = state.address;
    lastBalanceCheckRef.current = Date.now();

    const tick = async () => {
      if (document.hidden) return;
      const seq = ++operationSeqRef.current;

      try {
        // 1. Check for address change.
        const { address: currentAddr, error: addrError } = await adapter.getAddress();
        if (seq !== operationSeqRef.current) return;

        if (currentAddr && !addrError && currentAddr !== lastKnownAddressRef.current) {
          // Address changed — update state and refresh balance immediately.
          lastKnownAddressRef.current = currentAddr;
          lastBalanceCheckRef.current = Date.now();
          dispatch({ type: 'UPDATE_ADDRESS', payload: { address: currentAddr } });
          await fetchNetworkAndBalance(currentAddr, seq);
          return;
        }

        isMountedRef.current = true;
            isMountedRef.current = false;
            connectInFlightRef.current = null;
            connectStartTsRef.current = null;
        // 2. Check for network change.
        const { network } = await adapter.getNetworkDetails();
        if (seq !== operationSeqRef.current) return;

        const normalised = normalizeNetwork(network);
        const networkChanged = normalised !== lastKnownNetworkRef.current;

        const startedAt = Date.now();
        connectStartTsRef.current = startedAt;
        const timeoutMs = resolveConnectTimeoutMs(import.meta.env.VITE_WALLET_CONNECT_TIMEOUT_MS);
        let wasTimedOut = false;

            if (seq !== operationSeqRef.current) return false;
        // 3. Refresh balance on schedule or when network changed.
        const now = Date.now();
        if (networkChanged || now - lastBalanceCheckRef.current >= BALANCE_REFRESH_INTERVAL) {
          lastBalanceCheckRef.current = now;
          await fetchNetworkAndBalance(currentAddr ?? address, seq);
        }
    }, [fetchNetworkAndBalance]);
      } catch {
        // Non-fatal; next tick retries.
      }


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
    const id = setInterval(tick, ACCOUNT_POLL_INTERVAL);

    const onVisibilityChange = () => {
      if (!document.hidden) {
        lastBalanceCheckRef.current = Date.now();
        void fetchNetworkAndBalance(address);
      }
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [state.address, adapter, fetchNetworkAndBalance]);

  // ---------------------------------------------------------------------------
  // connect
  // ---------------------------------------------------------------------------

  const performConnect = useCallback(
    async (attempt: number): Promise<boolean> => {
      const seq = ++operationSeqRef.current;
      const startedAt = Date.now();
      dispatch({ type: 'CONNECT_START' });

      recordWalletTelemetry({
        event: 'wallet.connect.attempt',
        ts: startedAt,
        wallet: 'freighter',
        attempt,
      });

      try {
        await adapter.setAllowed();
        if (seq !== operationSeqRef.current) return false;

        const access = await adapter.requestAccess();
        if (seq !== operationSeqRef.current) return false;

        demoModeRef.current = false;
        setDemoMode(false);
        resetDemoStore();
        if (!access) {
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
          return false;
        }
        connectInFlightRef.current = null;
        connectStartTsRef.current = null;
        persistDemoSession(false);
        // The disconnecting wallet's Create Vault draft must not outlive the
        // session, and must never be offered to whichever wallet connects next.
        clearCreateVaultDraft(lastKnownAddressRef.current);
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

        const { address: pubKey, error: addrError } = await adapter.getAddress();
        if (seq !== operationSeqRef.current) return false;

                cancelConnect,
                connectDemo,
                resetDemo,
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
        lastKnownAddressRef.current = pubKey;

        // Dispatch CONNECT_SUCCESS immediately with a provisional network.
        // fetchNetworkAndBalance will resolve the real network and update it
        // via BALANCE_FETCH_SUCCESS. This keeps network-fetch failures isolated
        // to balanceStatus/balanceError rather than polluting connectionError.
        const provisionalNetwork: WalletNetwork = lastKnownNetworkRef.current ?? 'TESTNET';
        dispatch({ type: 'CONNECT_SUCCESS', payload: { address: pubKey, network: provisionalNetwork } });

        recordWalletTelemetry({
          event: 'wallet.connect.success',
          ts: Date.now(),
          wallet: 'freighter',
          durationMs: Date.now() - startedAt,
          attempt,
        });

        await fetchNetworkAndBalance(pubKey, seq);
        return true;
      } catch (err: unknown) {
        if (seq !== operationSeqRef.current) return false;
        logger.error('Connection error', err);
        const message =
          err instanceof Error
            ? err.message
            : 'Failed to connect wallet. Make sure Freighter is installed and unlocked.';
        dispatch({ type: 'CONNECT_ERROR', payload: { error: message } });
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
    },
    [adapter, fetchNetworkAndBalance],
  );

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
    void promise.finally(() => {
      connectInFlightRef.current = null;
    });
    return promise;
  }, [performConnect]);

  // ---------------------------------------------------------------------------
  // disconnect
  // ---------------------------------------------------------------------------

  const disconnect = useCallback(() => {
    operationSeqRef.current++;
    abortControllerRef.current?.abort();
    localStorage.setItem(WALLET_DISCONNECTED_KEY, 'true');
    lastKnownAddressRef.current = null;
    lastKnownNetworkRef.current = null;
    dispatch({ type: 'DISCONNECT' });
  }, []);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

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

