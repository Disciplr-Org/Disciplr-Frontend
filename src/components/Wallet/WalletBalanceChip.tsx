import { useEffect, useRef } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useWallet } from '../../context/WalletContext';
import { Skeleton } from '../Skeleton';
import './wallet-balance-chip.css';


export function WalletBalanceChip() {
    const { address, balance, balanceStatus } = useWallet();
    const lastBalanceRef = useRef<{ address: string; balance: string } | null>(null);

    useEffect(() => {
        if (address && balance && balanceStatus !== 'error') {
            lastBalanceRef.current = { address, balance };
        }
    }, [address, balance, balanceStatus]);

    const previousBalance =
        balance && address
            ? balance
            : lastBalanceRef.current?.address === address
              ? lastBalanceRef.current.balance
              : null;

    if (!address || balanceStatus === 'idle') return null;

    if (balanceStatus === 'loading') {
        return (
            <div
                className="wallet-balance-chip"
                data-testid="wallet-balance-chip"
                role="status"
                aria-label="Loading balance"
            >
                <Skeleton className="wallet-balance-skeleton" />
            </div>
        );
    }

    if (balanceStatus === 'error') {
        if (previousBalance) {
            return (
                <div
                    className="wallet-balance-chip wallet-balance-chip--error wallet-balance-chip--stale"
                    data-testid="wallet-balance-chip"
                    role="status"
                    title="Balance may be out of date"
                >
                    <AlertTriangle className="wallet-balance-warning-icon" size={14} aria-hidden="true" />
                    <span className="wallet-balance-value">{previousBalance}</span>
                    <span className="wallet-balance-currency">USDC</span>
                    <span className="visually-hidden">Balance may be out of date</span>
                </div>
            );
        }

        return (
            <div
                className="wallet-balance-chip wallet-balance-chip--error"
                data-testid="wallet-balance-chip"
                role="status"
                aria-label="Balance unavailable"
                title="Balance unavailable"
            >
                <AlertTriangle className="wallet-balance-warning-icon" size={14} aria-hidden="true" />
                <span className="wallet-balance-value">Balance unavailable</span>
            </div>
        );
    }

    if (balanceStatus === 'no_trustline') {
        return (
            <div
                className="wallet-balance-chip wallet-balance-chip--no-trustline"
                data-testid="wallet-balance-chip"
                title="No USDC trustline on this network"
            >
                <span className="wallet-balance-value">0.00</span>
                <span className="wallet-balance-currency">USDC</span>
            </div>
        );
    }

    // balanceStatus === 'success'
    return (
        <div className="wallet-balance-chip" data-testid="wallet-balance-chip">
            <span className="wallet-balance-value">{balance}</span>
            <span className="wallet-balance-currency">USDC</span>
        </div>
    );
}
