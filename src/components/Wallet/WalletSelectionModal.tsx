import { X, ExternalLink, ShieldCheck } from 'lucide-react';
import { useWallet } from '../../context/WalletContext';
import './wallet.css';

interface WalletSelectionModalProps {
    onClose: () => void;
}

export function WalletSelectionModal({ onClose }: WalletSelectionModalProps) {
    const { connect, isConnecting, error } = useWallet();

    const handleConnect = async () => {
        await connect();
        // Assuming connect throws or handles error internally, we wait for it
        // If successful, the context will update address, which will re-render
        // the parent component and unmount this modal automatically usually,
        // or we can close it manually
        onClose();
    };

    return (
        <div className="wallet-modal-overlay" onClick={onClose}>
            <div className="wallet-modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="wallet-modal-header">
                    <h2 className="wallet-modal-title">Connect Wallet</h2>
                    <button className="wallet-close-btn" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                {error && (
                    <div className="wallet-error">
                        {error}
                    </div>
                )}

                <div className="wallet-list">
                    <button
                        className="wallet-option"
                        onClick={handleConnect}
                        disabled={isConnecting}
                    >
                        <div className="wallet-option-info">
                            <div className="wallet-icon">
                                {/* A placeholder SVG for Freighter */}
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M2 17L12 22L22 17" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M2 12L12 17L22 12" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                            <span className="wallet-name">Freighter</span>
                        </div>
                        <span className="wallet-status">
                            {isConnecting ? <div className="loader" /> : 'Connected'}
                        </span>
                    </button>

                    {/* Placeholder for other wallets like Albedo */}
                    <button className="wallet-option">
                        <div className="wallet-option-info">
                            <div className="wallet-icon">
                                <ShieldCheck size={20} color="var(--accent)" />
                            </div>
                            <span className="wallet-name">Albedo</span>
                        </div>
                    </button>
                </div>

                <div className="wallet-help-section">
                    <span className="wallet-help-text">New to Web3?</span>
                    <a
                        href="https://stellar.org/learn/wallets-to-store-send-and-receive-lumens"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="wallet-help-link"
                    >
                        What is a wallet? <ExternalLink size={12} style={{ display: 'inline', marginLeft: '4px' }} />
                    </a>
                </div>
            </div>
        </div>
    );
}
