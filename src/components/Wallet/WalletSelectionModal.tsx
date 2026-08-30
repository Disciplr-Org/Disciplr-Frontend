import { useEffect, useRef, useState } from 'react';
import { X, ExternalLink, ShieldCheck, AlertCircle } from 'lucide-react';
import { useWallet } from '../../context/WalletContext';
import { Modal } from '../Modal';
import freighterLogo from './freighter-logo.svg';
import './wallet.css';

/**
 * WalletSelectionModal Component
 * 
 * Purpose: Provides a consistent wallet connection interface for users
 * to select and connect their Stellar wallet (currently Freighter).
 * 
 * Invariants:
 * - Only one connection attempt can be in flight at a time
 * - Modal closes automatically on successful connection
 * - Modal remains open on connection failure to allow retry
 * - Component cleans up pending operations on unmount
 * - Error state is preserved until next connection attempt
 * 
 * Accessibility:
 * - Modal is properly labeled with aria-labelledby
 * - Focus is trapped within modal during interaction
 * - Keyboard navigation fully supported (Tab, Enter, Escape)
 * - Screen reader announcements for connection state changes
 * - Disabled wallets clearly marked with aria-disabled
 * 
 * @param onClose - Callback invoked when modal should close (successful connection or user dismissal)
 */
interface WalletSelectionModalProps {
    onClose: () => void;
}

export function WalletSelectionModal({ onClose }: WalletSelectionModalProps) {
    const { connect, isConnecting, error, address } = useWallet();
    const isConnected = address !== null;

    const isMounted = useRef(true);
    const connectPending = useRef(false);
    const [localError, setLocalError] = useState<string | null>(null);
    const retryCountRef = useRef(0);

    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
            // Clean up any pending operations
            connectPending.current = false;
        };
    }, []);

    // Clear local error when wallet context error changes
    useEffect(() => {
        if (error) {
            setLocalError(null);
        }
    }, [error]);

    const handleConnect = async () => {
        // Invariant: prevent concurrent connection attempts
        if (connectPending.current || isConnecting) return;
        
        connectPending.current = true;
        setLocalError(null);
        retryCountRef.current += 1;

        try {
            const connected = await connect();
            // Invariant: only close modal on successful connection while mounted
            if (isMounted.current && connected) {
                retryCountRef.current = 0;
                onClose();
            } else if (isMounted.current && !connected) {
                // Connection failed but no error from context - set fallback
                if (!error) {
                    setLocalError('Connection unsuccessful. Please try again.');
                }
            }
        } catch (err) {
            // Defensive: handle unexpected errors not caught by context
            if (isMounted.current) {
                const message = err instanceof Error ? err.message : 'An unexpected error occurred';
                setLocalError(message);
            }
        } finally {
            if (isMounted.current) {
                connectPending.current = false;
            }
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
        // Ensure Enter and Space work consistently for wallet selection
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleConnect();
        }
    };

    // Determine which error to display (context error takes precedence)
    const displayError = error || localError;
    const hasRetried = retryCountRef.current > 1;

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            overlayClassName="wallet-modal-overlay"
            contentClassName="wallet-modal-content"
            ariaLabelledBy="wallet-modal-title"
        >
            <div className="wallet-modal-header">
                <h2 id="wallet-modal-title" className="wallet-modal-title">Connect Wallet</h2>
                <button 
                    className="wallet-close-btn" 
                    onClick={onClose}
                    aria-label="Close wallet selection modal"
                    type="button"
                >
                    <X size={20} aria-hidden="true" />
                </button>
            </div>

            {displayError && (
                <div 
                    className="wallet-error" 
                    role="alert"
                    aria-live="assertive"
                >
                    <AlertCircle size={16} aria-hidden="true" style={{ flexShrink: 0 }} />
                    <span>{displayError}</span>
                    {hasRetried && (
                        <span style={{ display: 'block', marginTop: '0.5rem', fontSize: '0.875rem' }}>
                            Having trouble? Make sure Freighter is installed, unlocked, and up to date.
                        </span>
                    )}
                </div>
            )}

            <div className="wallet-list" role="group" aria-label="Available wallets">
                <button
                    className="wallet-option"
                    onClick={handleConnect}
                    onKeyDown={handleKeyDown}
                    disabled={isConnecting}
                    aria-busy={isConnecting}
                    aria-describedby={isConnected ? 'freighter-connected' : undefined}
                    type="button"
                >
                    <div className="wallet-option-info">
                        <div className="wallet-icon">
                            <img src={freighterLogo} alt="" role="presentation" />
                        </div>
                        <span className="wallet-name">Freighter</span>
                    </div>
                    <span 
                        className="wallet-status"
                        id={isConnected ? 'freighter-connected' : undefined}
                        aria-live="polite"
                    >
                        {isConnecting ? (
                            <>
                                <div className="loader" role="status" aria-label="Connecting" />
                                <span className="sr-only">Connecting to Freighter wallet</span>
                            </>
                        ) : isConnected ? (
                            'Connected'
                        ) : (
                            'Available'
                        )}
                    </span>
                </button>

                {/* Albedo support is not yet implemented */}
                <button
                    className="wallet-option"
                    disabled
                    aria-disabled="true"
                    aria-label="Albedo wallet (coming soon)"
                    title="Albedo support is coming soon"
                    type="button"
                >
                    <div className="wallet-option-info">
                        <div className="wallet-icon">
                            <ShieldCheck size={20} color="var(--accent)" aria-hidden="true" />
                        </div>
                        <span className="wallet-name">Albedo</span>
                    </div>
                    <span className="wallet-coming-soon">Coming soon</span>
                </button>
            </div>

            <div className="wallet-help-section">
                <span className="wallet-help-text">New to Web3?</span>
                <a
                    href="https://stellar.org/learn/wallets-to-store-send-and-receive-lumens"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="wallet-help-link"
                    aria-label="Learn what a wallet is (opens in new tab)"
                >
                    What is a wallet? <ExternalLink size={12} aria-hidden="true" style={{ display: 'inline', marginLeft: '4px' }} />
                </a>
            </div>
        </Modal>
    );
}
