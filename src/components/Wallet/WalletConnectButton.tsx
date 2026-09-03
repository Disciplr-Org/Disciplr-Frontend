import { useState, useRef, useEffect, useMemo } from 'react';
import { useWallet } from '../../context/WalletContext';
import { Wallet, Loader2, AlertCircle } from 'lucide-react';
import './wallet.css';
import { WalletDropdown } from './WalletDropdown';
import { networkLabel } from '../../utils/explorer';
import { WalletSelectionModal } from './WalletSelectionModal';
import { logger } from '../../utils/logger';
import {
    validateWalletAddress,
    validateNetwork,
    sanitizeWalletError,
} from '../../utils/walletValidation';

export function WalletConnectButton() {
    const { address, network, isConnecting, error } = useWallet();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Validate address and network at the boundary
    const addressValid = useMemo(
        () => (address != null ? validateWalletAddress(address) : ({ valid: false, error: 'No address.' } as const)),
        [address],
    );
    const networkValid = useMemo(
        () => (network != null ? validateNetwork(network) : ({ valid: false, error: 'No network.' } as const)),
        [network],
    );

    const safeAddress = addressValid.valid && address ? address : null;
    const safeNetwork = networkValid.valid && networkValid.value ? networkValid.value : null;

    // Warn on invalid wallet state (shouldn't happen in production but guards against tampering)
    useEffect(() => {
        if (address && !addressValid.valid) {
            logger.error('Wallet returned invalid address — refusing to display', {
                error: addressValid.error,
                hasNetwork: !!network,
            });
        }
        if (network && !networkValid.valid) {
            logger.error('Wallet returned invalid network — refusing to display', {
                error: networkValid.error,
                hasAddress: !!address,
            });
        }
    }, [address, network, addressValid, networkValid]);

    // Telemetry: Expose structured diagnostics for failures
    useEffect(() => {
        if (error) {
            logger.error('Wallet connection error encountered in UI state', {
                timestamp: new Date().toISOString(),
                hasAddress: !!address,
                network,
                error: sanitizeWalletError(error),
            });
        }
    }, [error, address, network]);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const truncateAddress = (addr: string) => {
        return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
    };

    // Sanitize error for display — never render raw wallet error strings
    const displayError = error ? sanitizeWalletError(error) : null;

    if (displayError && !safeAddress) {
        return (
            <div className="wallet-dropdown-container">
                <button
                    className="wallet-connect-btn error"
                    onClick={() => setIsModalOpen(true)}
                    title="Connection failed — click to retry"
                >
                    <AlertCircle size={16} />
                    <span>Connection Failed</span>
                </button>
                {isModalOpen && (
                    <WalletSelectionModal onClose={() => setIsModalOpen(false)} />
                )}
            </div>
        );
    }

    if (isConnecting && !safeAddress) {
        return (
            <button className="wallet-connect-btn connecting" disabled>
                <Loader2 size={16} className="animate-spin" />
                <span>Connecting...</span>
            </button>
        );
    }

    return (
        <>
            {safeAddress ? (
                <div className="wallet-dropdown-container" ref={dropdownRef}>
                    <button
                        className="wallet-connect-btn connected"
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    >
                        <Wallet size={16} />
                        <span>{truncateAddress(safeAddress)}</span>
                        {safeNetwork && (
                            <span className="wallet-network-badge">
                                {networkLabel(safeNetwork)}
                            </span>
                        )}
                    </button>

                    {isDropdownOpen && (
                        <WalletDropdown onClose={() => setIsDropdownOpen(false)} onSwitch={() => {
                            setIsDropdownOpen(false);
                            setIsModalOpen(true);
                        }} />
                    )}
                </div>
            ) : (
                <button
                    className="wallet-connect-btn"
                    onClick={() => setIsModalOpen(true)}
                >
                    <Wallet size={16} />
                    Connect Wallet
                </button>
            )}

            {isModalOpen && (
                <WalletSelectionModal onClose={() => setIsModalOpen(false)} />
            )}
        </>
    );
}
