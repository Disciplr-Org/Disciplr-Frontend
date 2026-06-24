import { createContext, useCallback, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { isAllowed, setAllowed, requestAccess, getAddress, getNetworkDetails } from '@stellar/freighter-api';
import { fetchUsdcBalance } from '../utils/horizon';

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
    connect: () => Promise<void>;
    disconnect: () => void;
    checkConnection: () => Promise<void>;
    /** Retries the current wallet's network and USDC balance lookup; no-ops without an address. */
    refreshBalance: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
    const [address, setAddress] = useState<string | null>(null);
    const [network, setNetwork] = useState<WalletNetwork | null>(null);
    const [balance, setBalance] = useState<string | null>(null);
    const [balanceStatus, setBalanceStatus] = useState<BalanceStatus>('idle');
    const [balanceError, setBalanceError] = useState<string | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const balanceRefreshRef = useRef<Promise<void> | null>(null);

    const normalizeNetwork = (networkName: string): WalletNetwork => {
        return networkName === 'PUBLIC' ? 'PUBLIC' : 'TESTNET';
    };

    const fetchNetworkAndBalance = useCallback(async (pubKey: string) => {
        setBalanceStatus('loading');
        setBalanceError(null);

        try {
            const netDetails = await getNetworkDetails();
            const activeNetwork = normalizeNetwork(netDetails.network);
            setNetwork(activeNetwork);

            const usdcBalance = await fetchUsdcBalance(pubKey, activeNetwork);
            setBalance(usdcBalance.balance);
            setBalanceStatus(usdcBalance.hasTrustline ? 'success' : 'no_trustline');
        } catch (err) {
            console.error('Failed to get network details', err);
            const message = err instanceof Error ? err.message : 'Unable to load USDC balance.';
            setBalance(null);
            setBalanceStatus('error');
            setBalanceError(message);
        }
    }, []);

    const checkConnection = useCallback(async () => {
        try {
            if (await isAllowed()) {
                const { address: pubKey, error: addrError } = await getAddress();
                if (pubKey && !addrError) {
                    setAddress(pubKey);
                    await fetchNetworkAndBalance(pubKey);
                }
            }
        } catch (err) {
            console.error('Check connection error', err);
        }
    }, [fetchNetworkAndBalance]);

    useEffect(() => {
        void checkConnection();
    }, [checkConnection]);

    const refreshBalance = useCallback(async () => {
        if (!address) return;
        if (balanceRefreshRef.current) return balanceRefreshRef.current;

        const refresh = fetchNetworkAndBalance(address).finally(() => {
            if (balanceRefreshRef.current === refresh) {
                balanceRefreshRef.current = null;
            }
        });
        balanceRefreshRef.current = refresh;
        return refresh;
    }, [address, fetchNetworkAndBalance]);

    const connect = async () => {
        setIsConnecting(true);
        setError(null);
        try {
            // Prompt user to allow access
            await setAllowed();
            const access = await requestAccess();
            if (access) {
                const { address: pubKey, error: addrError } = await getAddress();
                if (pubKey && !addrError) {
                    setAddress(pubKey);
                    await fetchNetworkAndBalance(pubKey);
                } else {
                    setError(addrError || 'Failed to get wallet address.');
                }
            } else {
                setError('Wallet access denied.');
            }
        } catch (err: unknown) {
            console.error('Connection error', err);
            const message = err instanceof Error ? err.message : undefined;
            setError(message || 'Failed to connect wallet. Make sure Freighter is installed and unlocked.');
        } finally {
            setIsConnecting(false);
        }
    };

    const disconnect = () => {
        balanceRefreshRef.current = null;
        setAddress(null);
        setNetwork(null);
        setBalance(null);
        setBalanceStatus('idle');
        setBalanceError(null);
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
                refreshBalance,
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
