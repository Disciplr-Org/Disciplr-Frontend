import { createContext, useContext, useState, useEffect, useRef, ReactNode, useCallback } from 'react';
import { isAllowed, setAllowed, requestAccess, getAddress, getNetworkDetails } from '@stellar/freighter-api';
import { fetchUsdcBalance } from '../utils/horizon';
import { logger } from '../utils/logger';

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

export const BALANCE_REFRESH_INTERVAL = 30_000;
export const ACCOUNT_POLL_INTERVAL = 2_000; // Check account explicitly every 2s

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
    const checkConnectionInProgress = useRef(false);

    const normalizeNetwork = (networkName: string): WalletNetwork => {
        return networkName === 'PUBLIC' ? 'PUBLIC' : 'TESTNET';
    };

    const fetchNetworkAndBalance = useCallback(async (pubKey: string) => {
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
                if (pubKey && !addrError) {
                    setAddress(pubKey);
                    
                    // Skip redundant fetch if address hasn't changed
                    if (pubKey !== lastKnownAddressRef.current) {
                        lastKnownAddressRef.current = pubKey;
                        await fetchNetworkAndBalance(pubKey);
                    }
                }
            }
        } catch (err) {
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
        };
    }, [checkConnection]);

    // Fast polling for account changes & standard polling for balance
    useEffect(() => {
        if (!address) return;

        let lastBalanceCheck = Date.now();
        
        const tick = async () => {
            if (document.hidden) return;
            try {
                const { address: currentAddr, error: addrError } = await getAddress();
                if (currentAddr && !addrError && currentAddr !== lastKnownAddressRef.current) {
                    // Account changed! Update state and fetch immediately
                    setAddress(currentAddr);
                    lastKnownAddressRef.current = currentAddr;
                    lastBalanceCheck = Date.now();
                    await fetchNetworkAndBalance(currentAddr);
                } else if (Date.now() - lastBalanceCheck >= BALANCE_REFRESH_INTERVAL) {
                    // Refresh balance on the existing account
                    lastBalanceCheck = Date.now();
                    await fetchNetworkAndBalance(currentAddr || address);
                }
            } catch {
                // If it fails, fallback
                if (Date.now() - lastBalanceCheck >= BALANCE_REFRESH_INTERVAL) {
                    lastBalanceCheck = Date.now();
                    await fetchNetworkAndBalance(address);
                }
            }
        };

        const id = setInterval(tick, ACCOUNT_POLL_INTERVAL);

        const onVisibilityChange = () => {
            if (!document.hidden && address) {
                lastBalanceCheck = Date.now();
                fetchNetworkAndBalance(address);
            }
        };
        document.addEventListener('visibilitychange', onVisibilityChange);

        return () => {
            clearInterval(id);
            document.removeEventListener('visibilitychange', onVisibilityChange);
        };
    }, [address, fetchNetworkAndBalance]);

    const connect = async (): Promise<boolean> => {
        setIsConnecting(true);
        setError(null);
        try {
            await setAllowed();
            const access = await requestAccess();
            if (access) {
                const { address: pubKey, error: addrError } = await getAddress();
                if (pubKey && !addrError) {
                    localStorage.removeItem(WALLET_DISCONNECTED_KEY);
                    setAddress(pubKey);
                    lastKnownAddressRef.current = pubKey;
                    await fetchNetworkAndBalance(pubKey);
                    return true;
                } else {
                    setError(addrError || 'Failed to get wallet address.');
                }
            } else {
                setError('Wallet access denied.');
            }
        } catch (err: unknown) {
            logger.error('Connection error', err);
            const message = err instanceof Error ? err.message : undefined;
            setError(message || 'Failed to connect wallet. Make sure Freighter is installed and unlocked.');
        } finally {
            setIsConnecting(false);
        }
        return false;
    };

    const disconnect = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
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
