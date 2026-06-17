import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { isAllowed, setAllowed, requestAccess, getAddress, getNetworkDetails } from '@stellar/freighter-api';
import { fetchUsdcBalance } from '../utils/horizon';

export type WalletNetwork = 'TESTNET' | 'PUBLIC';

interface WalletContextType {
    address: string | null;
    network: WalletNetwork | null;
    balance: string | null;
    balanceStatus: 'idle' | 'loading' | 'loaded' | 'error';
    balanceError: string | null;
    hasUsdcTrustline: boolean;
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
    const [balanceStatus, setBalanceStatus] = useState<WalletContextType['balanceStatus']>('idle');
    const [balanceError, setBalanceError] = useState<string | null>(null);
    const [hasUsdcTrustline, setHasUsdcTrustline] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchNetworkAndBalance = async (publicKey: string) => {
        setBalanceStatus('loading');
        setBalanceError(null);
        try {
            const allowedState = await isAllowed();
            if (!allowedState.isAllowed) {
                setBalance(null);
                setHasUsdcTrustline(false);
                setBalanceStatus('idle');
                return;
            }
            const netDetails = await getNetworkDetails();
            const walletNetwork = netDetails.network as WalletNetwork;
            setNetwork(walletNetwork);
            const result = await fetchUsdcBalance(publicKey, walletNetwork);
            setBalance(result.balance);
            setHasUsdcTrustline(result.hasTrustline);
            setBalanceStatus('loaded');
        } catch (err) {
            console.error('Failed to get network details', err);
            setBalance(null);
            setHasUsdcTrustline(false);
            setBalanceError('Unable to load USDC balance from Horizon.');
            setBalanceStatus('error');
        }
    };

    const checkConnection = async () => {
        try {
            const allowedState = await isAllowed();
            if (allowedState.isAllowed) {
                const { address: pubKey, error: addrError } = await getAddress();
                if (pubKey && !addrError) {
                    setAddress(pubKey);
                    await fetchNetworkAndBalance(pubKey);
                }
            }
        } catch (err) {
            console.error('Check connection error', err);
        }
    };

    useEffect(() => {
        checkConnection();
    }, []);

    const connect = async () => {
        setIsConnecting(true);
        setError(null);
        try {
            // Prompt user to allow access
            await setAllowed();
            const access = await requestAccess();
            if (access.address && !access.error) {
                const { address: pubKey, error: addrError } = await getAddress();
                if (pubKey && !addrError) {
                    setAddress(pubKey);
                    await fetchNetworkAndBalance(pubKey);
                } else {
                    setError(addrError || 'Failed to get wallet address.');
                }
            } else {
                setError(access.error || 'Wallet access denied.');
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
        setAddress(null);
        setNetwork(null);
        setBalance(null);
        setBalanceStatus('idle');
        setBalanceError(null);
        setHasUsdcTrustline(false);
    };

    return (
        <WalletContext.Provider
            value={{
                address,
                network,
                balance,
                balanceStatus,
                balanceError,
                hasUsdcTrustline,
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
