import { useState, useRef, useEffect } from 'react';
import { useWallet } from '../../context/WalletContext';
import { Wallet } from 'lucide-react';
import './wallet.css';
import { WalletDropdown } from './WalletDropdown';
import { WalletSelectionModal } from './WalletSelectionModal';

export function WalletConnectButton() {
    const { address, network } = useWallet();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

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

    return (
        <>
            {address ? (
                <div className="wallet-dropdown-container" ref={dropdownRef}>
                    <button
                        className="wallet-connect-btn connected"
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    >
                        <Wallet size={16} />
                        <span>{truncateAddress(address)}</span>
                        {network && (
                            <span className="wallet-network-badge">
                                {network === 'TESTNET' ? 'Testnet' : 'Mainnet'}
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
