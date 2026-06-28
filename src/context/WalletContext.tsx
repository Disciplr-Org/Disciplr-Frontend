import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
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
    connect: () => Promise<void>;
    disconnect: () => void;
    checkConnection: () => Promise<void>;
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
    const abortControllerRef = useRef<AbortController | null>(null);

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
            if (await isAllowed()) {
                const { address: pubKey, error: addrError } = await getAddress();
                if (pubKey && !addrError) {
                    setAddress(pubKey);
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
            logger.error('Connection error', err);
            const message = err instanceof Error ? err.message : undefined;
            setError(message || 'Failed to connect wallet. Make sure Freighter is installed and unlocked.');
        } finally {
            setIsConnecting(false);
        }
    };

    const disconnect = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
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
