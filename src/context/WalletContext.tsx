import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { isAllowed, setAllowed, requestAccess, getAddress, getNetworkDetails } from '@stellar/freighter-api';

export type WalletNetwork = 'TESTNET' | 'PUBLIC';

interface WalletContextType {
    address: string | null;
    network: WalletNetwork | null;
    balance: string | null;
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
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchNetworkAndBalance = async () => {
        try {
            const netDetails = await getNetworkDetails();
            setNetwork(netDetails.network as WalletNetwork);
            // For a real app, you would query the Horizon API here to get the real balance.
            // For this implementation, we will mock a balance.
            setBalance('0.00');
        } catch (err) {
            console.error('Failed to get network details', err);
        }
    };

    const checkConnection = async () => {
        try {
            if (await isAllowed()) {
                const { address: pubKey, error: addrError } = await getAddress();
                if (pubKey && !addrError) {
                    setAddress(pubKey);
                    await fetchNetworkAndBalance();
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
            if (access) {
                const { address: pubKey, error: addrError } = await getAddress();
                if (pubKey && !addrError) {
                    setAddress(pubKey);
                    await fetchNetworkAndBalance();
                } else {
                    setError(addrError || 'Failed to get wallet address.');
                }
            } else {
                setError('Wallet access denied.');
            }
        } catch (err: any) {
            console.error('Connection error', err);
            setError(err?.message || 'Failed to connect wallet. Make sure Freighter is installed and unlocked.');
        } finally {
            setIsConnecting(false);
        }
    };

    const disconnect = () => {
        setAddress(null);
        setNetwork(null);
        setBalance(null);
    };

    return (
        <WalletContext.Provider
            value={{
                address,
                network,
                balance,
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
