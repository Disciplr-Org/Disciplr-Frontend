import { useWallet } from '../../context/WalletContext';
import { Skeleton } from '../Skeleton';
import './wallet-balance-chip.css';

/**
 * WalletBalanceChip — compact header chip showing live USDC balance.
 *
 * Behaviour per balanceStatus:
 * - idle / disconnected → renders nothing
 * - loading              → Skeleton shimmer
 * - success              → balance amount + "USDC"
 * - no_trustline         → "0.00 USDC" (dimmed)
 * - error                → "! USDC"     (danger color)
 */
export function WalletBalanceChip() {
    const { address, balance, balanceStatus } = useWallet();

    if (!address || balanceStatus === 'idle') return null;

    if (balanceStatus === 'loading') {
        return (
            <div className="wallet-balance-chip" data-testid="wallet-balance-chip">
                <Skeleton className="wallet-balance-skeleton" />
            </div>
        );
    }

    if (balanceStatus === 'error') {
        return (
            <div
                className="wallet-balance-chip wallet-balance-chip--error"
                data-testid="wallet-balance-chip"
                role="status"
            >
                <span className="wallet-balance-value">!</span>
                <span className="wallet-balance-currency">USDC</span>
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
