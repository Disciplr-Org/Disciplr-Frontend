import { useState } from 'react';
import { useWallet } from '../../context/WalletContext';
import { Copy, Plus, LogOut, Check, ExternalLink } from 'lucide-react';
import './wallet.css';

interface WalletDropdownProps {
    onClose: () => void;
    onSwitch: () => void;
}

export function WalletDropdown({ onClose, onSwitch }: WalletDropdownProps) {
    const { address, balance, network, disconnect } = useWallet();
    const [copied, setCopied] = useState(false);

    if (!address) return null;

    const truncateAddress = (addr: string) => {
        return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
    };

    const copyAddress = async () => {
        try {
            await navigator.clipboard.writeText(address);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy', err);
        }
    };

    const openExplorer = () => {
        const baseUrl = network === 'TESTNET'
            ? 'https://stellar.expert/explorer/testnet'
            : 'https://stellar.expert/explorer/public';
        window.open(`${baseUrl}/account/${address}`, '_blank');
    };

    return (
        <div className="wallet-dropdown-menu">
            <div className="wallet-dropdown-header">
                <div className="wallet-dropdown-address-container">
                    <span className="wallet-dropdown-address">{truncateAddress(address)}</span>
                    <button className="wallet-copy-btn" onClick={copyAddress} title="Copy Address">
                        {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                    </button>
                </div>
                <div className="wallet-dropdown-balance">
                    {balance !== null ? balance : '0.00'} <span>USDC</span>
                </div>
            </div>

            <div className="wallet-dropdown-actions">
                <button className="wallet-dropdown-item" onClick={openExplorer}>
                    <ExternalLink size={16} />
                    View on Stellar Explorer
                </button>
                <button className="wallet-dropdown-item" onClick={onSwitch}>
                    <Plus size={16} />
                    Switch Wallet
                </button>
                <button
                    className="wallet-dropdown-item danger"
                    onClick={() => {
                        disconnect();
                        onClose();
                    }}
                >
                    <LogOut size={16} />
                    Disconnect
                </button>
            </div>
        </div>
    );
}
