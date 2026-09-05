import { vi, describe, beforeEach, test, expect } from 'vitest';

const walletState = vi.hoisted(() => ({
    connect: vi.fn(),
    isConnecting: false,
    error: null as string | null,
    address: null as string | null,
}));

vi.mock('@/context/WalletContext', () => ({
    useWallet: () => walletState,
}));

import { act, render, screen, fireEvent, within } from '@testing-library/react';
import { WalletSelectionModal } from '../WalletSelectionModal';

function renderModal(onClose = vi.fn()) {
    return { onClose, ...render(<WalletSelectionModal onClose={onClose} />) };
}

describe('WalletSelectionModal', () => {
    beforeEach(() => {
        walletState.connect = vi.fn().mockResolvedValue(true);
        walletState.isConnecting = false;
        walletState.error = null;
        walletState.address = null;
    });

    describe('Basic rendering and structure', () => {
        test('renders the title and Freighter option', () => {
            renderModal();
            expect(screen.getByText('Connect Wallet')).toBeInTheDocument();
            expect(screen.getByText('Freighter')).toBeInTheDocument();
        });

        test('renders help section with external link', () => {
            renderModal();
            const helpLink = screen.getByRole('link', { name: /what is a wallet/i });
            expect(helpLink).toHaveAttribute('href', expect.stringContaining('stellar.org'));
            expect(helpLink).toHaveAttribute('target', '_blank');
            expect(helpLink).toHaveAttribute('rel', 'noopener noreferrer');
        });

        test('renders Albedo as coming soon and disabled', () => {
            renderModal();
            const albedoButton = screen.getByRole('button', { name: /albedo wallet \(coming soon\)/i });
            expect(albedoButton).toBeDisabled();
            expect(albedoButton).toHaveAttribute('aria-disabled', 'true');
        });
    });

    describe('Successful connection flow', () => {
        test('calls connect then onClose when Freighter button is clicked', async () => {
            const { onClose } = renderModal();

            await act(async () => {
                screen.getByText('Freighter').closest('button')!.click();
            });

            expect(walletState.connect).toHaveBeenCalledTimes(1);
            expect(onClose).toHaveBeenCalledTimes(1);
        });

        test('supports Enter key for wallet selection', async () => {
            const { onClose } = renderModal();
            const freighterBtn = screen.getByText('Freighter').closest('button')!;

            await act(async () => {
                fireEvent.keyDown(freighterBtn, { key: 'Enter' });
            });

            expect(walletState.connect).toHaveBeenCalledTimes(1);
            expect(onClose).toHaveBeenCalledTimes(1);
        });

        test('supports Space key for wallet selection', async () => {
            const { onClose } = renderModal();
            const freighterBtn = screen.getByText('Freighter').closest('button')!;

            await act(async () => {
                fireEvent.keyDown(freighterBtn, { key: ' ' });
            });

            expect(walletState.connect).toHaveBeenCalledTimes(1);
            expect(onClose).toHaveBeenCalledTimes(1);
        });
    });

    describe('Loading and connection states', () => {
        test('disables the button and shows loader while isConnecting', () => {
            walletState.isConnecting = true;
            renderModal();

            const btn = screen.getByText('Freighter').closest('button')!;
            expect(btn).toBeDisabled();
            expect(btn).toHaveAttribute('aria-busy', 'true');
            expect(btn.querySelector('.loader')).toBeInTheDocument();
            expect(screen.getByText(/connecting to freighter wallet/i)).toBeInTheDocument();
        });

        test('shows "Connected" status when wallet is already connected', () => {
            walletState.address = 'GABC123';
            renderModal();
            expect(screen.getByText('Connected')).toBeInTheDocument();
        });

        test('shows "Available" status when wallet is not connected', () => {
            walletState.address = null;
            renderModal();
            expect(screen.getByText('Available')).toBeInTheDocument();
        });
    });

    describe('Error handling', () => {
        test('renders context error message with alert role', () => {
            walletState.error = 'Wallet access denied.';
            renderModal();
            const errorAlert = screen.getByRole('alert');
            expect(errorAlert).toHaveTextContent('Wallet access denied.');
        });

        test('does not call onClose and shows error after connect rejection', async () => {
            walletState.connect.mockImplementation(() => {
                walletState.error = 'Failed to connect wallet. Make sure Freighter is installed and unlocked.';
                return Promise.resolve(false);
            });
            const onClose = vi.fn();
            const { rerender } = render(<WalletSelectionModal onClose={onClose} />);

            await act(async () => {
                screen.getByText('Freighter').closest('button')!.click();
            });

            expect(onClose).not.toHaveBeenCalled();
            rerender(<WalletSelectionModal onClose={onClose} />);
            expect(screen.getByText('Failed to connect wallet. Make sure Freighter is installed and unlocked.')).toBeInTheDocument();
        });

        test('shows helpful retry message after multiple failed attempts', async () => {
            walletState.connect.mockResolvedValue(false);
            const { rerender } = renderModal();

            // First attempt
            await act(async () => {
                screen.getByText('Freighter').closest('button')!.click();
            });
            rerender(<WalletSelectionModal onClose={vi.fn()} />);

            // Second attempt - should show additional help
            await act(async () => {
                screen.getByText('Freighter').closest('button')!.click();
            });

            expect(screen.getByText(/having trouble/i)).toBeInTheDocument();
            expect(screen.getByText(/make sure freighter is installed, unlocked, and up to date/i)).toBeInTheDocument();
        });

        test('clears local error when context error changes', async () => {
            walletState.connect.mockResolvedValue(false);
            const { rerender } = renderModal();

            await act(async () => {
                screen.getByText('Freighter').closest('button')!.click();
            });

            // Simulate context error update
            walletState.error = 'New error from context';
            rerender(<WalletSelectionModal onClose={vi.fn()} />);

            expect(screen.getByText('New error from context')).toBeInTheDocument();
        });
    });

    describe('Concurrent connection prevention', () => {
        test('prevents multiple connect calls on double click', async () => {
            let resolveConnect: (value: boolean) => void;
            walletState.connect.mockImplementation(() => new Promise((resolve) => {
                resolveConnect = resolve;
            }));
            const { onClose } = renderModal();

            const btn = screen.getByText('Freighter').closest('button')!;
            
            await act(async () => {
                btn.click();
                btn.click();
                btn.click();
            });

            expect(walletState.connect).toHaveBeenCalledTimes(1);

            await act(async () => {
                resolveConnect(true);
            });
            
            expect(onClose).toHaveBeenCalledTimes(1);
        });

        test('prevents connection while isConnecting is true from context', async () => {
            walletState.isConnecting = true;
            renderModal();

            const btn = screen.getByText('Freighter').closest('button')!;
            await act(async () => {
                btn.click();
            });

            expect(walletState.connect).not.toHaveBeenCalled();
        });
    });

    describe('Component lifecycle and cleanup', () => {
        test('does not call onClose if unmounted before connect resolves', async () => {
            let resolveConnect: (value: boolean) => void;
            walletState.connect.mockImplementation(() => new Promise((resolve) => {
                resolveConnect = resolve;
            }));
            
            const onClose = vi.fn();
            const { unmount } = render(<WalletSelectionModal onClose={onClose} />);
            
            const btn = screen.getByText('Freighter').closest('button')!;
            
            await act(async () => {
                btn.click();
            });

            unmount();

            await act(async () => {
                resolveConnect(true);
            });

            expect(onClose).not.toHaveBeenCalled();
        });

        test('does not crash when wallet is already connected', () => {
            walletState.address = 'GABC123';
            expect(() => renderModal()).not.toThrow();
        });
    });

    describe('Modal interaction', () => {
        test('calls onClose when the X button is clicked', () => {
            const { onClose } = renderModal();
            const closeBtn = screen.getByRole('button', { name: /close wallet selection modal/i });
            closeBtn.click();
            expect(onClose).toHaveBeenCalledTimes(1);
        });

        test('calls onClose when the backdrop overlay is clicked', () => {
            const { onClose } = renderModal();
            const overlay = document.querySelector('.wallet-modal-overlay') as HTMLElement;
            fireEvent.click(overlay);
            expect(onClose).toHaveBeenCalledTimes(1);
        });

        test('does not call onClose when the modal content area is clicked', () => {
            const { onClose } = renderModal();
            const content = document.querySelector('.wallet-modal-content') as HTMLElement;
            fireEvent.click(content);
            expect(onClose).not.toHaveBeenCalled();
        });
    });

    describe('Accessibility', () => {
        test('modal has proper ARIA labeling', () => {
            renderModal();
            const title = document.getElementById('wallet-modal-title');
            expect(title).toHaveTextContent('Connect Wallet');
        });

        test('wallet list has group role and label', () => {
            renderModal();
            const walletList = document.querySelector('.wallet-list');
            expect(walletList).toHaveAttribute('role', 'group');
            expect(walletList).toHaveAttribute('aria-label', 'Available wallets');
        });

        test('error message has alert role and live region', () => {
            walletState.error = 'Test error';
            renderModal();
            const error = screen.getByRole('alert');
            expect(error).toHaveAttribute('aria-live', 'assertive');
        });

        test('connection status has live region for screen readers', () => {
            walletState.isConnecting = true;
            renderModal();
            const status = screen.getByText(/connecting to freighter wallet/i).closest('[aria-live]');
            expect(status).toHaveAttribute('aria-live', 'polite');
        });

        test('all buttons have proper type attribute', () => {
            renderModal();
            const buttons = screen.getAllByRole('button');
            buttons.forEach(button => {
                expect(button).toHaveAttribute('type');
            });
        });

        test('external link has proper security attributes', () => {
            renderModal();
            const link = screen.getByRole('link', { name: /what is a wallet/i });
            expect(link).toHaveAttribute('rel', 'noopener noreferrer');
            expect(link).toHaveAttribute('target', '_blank');
        });

        test('decorative icons are hidden from screen readers', () => {
            renderModal();
            const images = document.querySelectorAll('img[role="presentation"]');
            expect(images.length).toBeGreaterThan(0);
        });
    });
});
