import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WalletConnectButton } from './WalletConnectButton';

// Mock the WalletContext hook
const mockWalletState = {
    address: null as string | null,
    network: null as 'TESTNET' | 'PUBLIC' | null,
    isConnecting: false,
    error: null as string | null,
    balance: null as string | null,
    balanceStatus: 'idle' as const,
    balanceError: null as string | null,
    status: 'disconnected' as const,
    connect: vi.fn().mockResolvedValue(true),
    disconnect: vi.fn(),
    checkConnection: vi.fn(),
};

vi.mock('../../context/WalletContext', () => ({
    useWallet: () => mockWalletState,
}));

// Mock child components to isolate WalletConnectButton
vi.mock('./WalletDropdown', () => ({
    WalletDropdown: ({ onClose, onSwitch }: { onClose: () => void; onSwitch: () => void }) => (
        <div data-testid="wallet-dropdown">
            <button data-testid="dropdown-close" onClick={onClose}>Close</button>
            <button data-testid="dropdown-switch" onClick={onSwitch}>Switch</button>
        </div>
    ),
}));

vi.mock('./WalletSelectionModal', () => ({
    WalletSelectionModal: ({ onClose }: { onClose: () => void }) => (
        <div data-testid="wallet-modal">
            <button data-testid="modal-close" onClick={onClose}>Close</button>
        </div>
    ),
}));

vi.mock('../../utils/logger', () => ({
    logger: {
        error: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
    },
}));

describe('WalletConnectButton', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Reset to default disconnected state
        Object.assign(mockWalletState, {
            address: null,
            network: null,
            isConnecting: false,
            error: null,
            status: 'disconnected',
        });
    });

    describe('disconnected state', () => {
        it('renders Connect Wallet button when disconnected', () => {
            render(<WalletConnectButton />);
            expect(screen.getByRole('button', { name: /connect wallet/i })).toBeInTheDocument();
        });

        it('opens the modal when clicked', async () => {
            render(<WalletConnectButton />);
            const btn = screen.getByRole('button', { name: /connect wallet/i });
            await userEvent.click(btn);
            expect(screen.getByTestId('wallet-modal')).toBeInTheDocument();
        });
    });

    describe('connecting state', () => {
        it('shows connecting spinner when isConnecting and no address', () => {
            Object.assign(mockWalletState, { isConnecting: true, address: null });
            render(<WalletConnectButton />);
            expect(screen.getByText('Connecting...')).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /connecting/i })).toBeDisabled();
        });
    });

    describe('error state', () => {
        it('shows Connection Failed button when error and no address', () => {
            Object.assign(mockWalletState, { error: 'Wallet access denied', address: null });
            render(<WalletConnectButton />);
            expect(screen.getByText('Connection Failed')).toBeInTheDocument();
        });

        it('opens the modal on error button click', async () => {
            Object.assign(mockWalletState, { error: 'Timeout', address: null });
            render(<WalletConnectButton />);
            await userEvent.click(screen.getByText('Connection Failed'));
            expect(screen.getByTestId('wallet-modal')).toBeInTheDocument();
        });

        it('sanitizes long error messages', () => {
            const longError = 'x'.repeat(1000);
            Object.assign(mockWalletState, { error: longError, address: null });
            render(<WalletConnectButton />);
            // The error title should be sanitized (not the long raw string)
            const btn = screen.getByText('Connection Failed');
            expect(btn.getAttribute('title')).not.toBe(longError);
        });
    });

    describe('connected state', () => {
        const VALID_ADDR = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';

        beforeEach(() => {
            Object.assign(mockWalletState, {
                address: VALID_ADDR,
                network: 'TESTNET' as const,
                isConnecting: false,
                error: null,
                status: 'connected',
            });
        });

        it('shows truncated address', () => {
            render(<WalletConnectButton />);
            expect(screen.getByText('GBBD...FLA5')).toBeInTheDocument();
        });

        it('shows network badge', () => {
            render(<WalletConnectButton />);
            expect(screen.getByText('Testnet')).toBeInTheDocument();
        });

        it('toggles dropdown on click', async () => {
            render(<WalletConnectButton />);
            const btn = screen.getByText('GBBD...FLA5');
            await userEvent.click(btn);
            expect(screen.getByTestId('wallet-dropdown')).toBeInTheDocument();
        });

        it('closes dropdown when clicking outside', async () => {
            render(
                <div>
                    <span data-testid="outside">Outside</span>
                    <WalletConnectButton />
                </div>,
            );
            // Open dropdown
            await userEvent.click(screen.getByText('GBBD...FLA5'));
            expect(screen.getByTestId('wallet-dropdown')).toBeInTheDocument();
            // Click outside
            fireEvent.mouseDown(screen.getByTestId('outside'));
            expect(screen.queryByTestId('wallet-dropdown')).not.toBeInTheDocument();
        });

        it('opens modal when switching wallet', async () => {
            render(<WalletConnectButton />);
            // Open dropdown
            await userEvent.click(screen.getByText('GBBD...FLA5'));
            // Click Switch Wallet
            await userEvent.click(screen.getByTestId('dropdown-switch'));
            expect(screen.getByTestId('wallet-modal')).toBeInTheDocument();
            expect(screen.queryByTestId('wallet-dropdown')).not.toBeInTheDocument();
        });

        it('does not show network badge for null network', () => {
            Object.assign(mockWalletState, { network: null });
            render(<WalletConnectButton />);
            expect(screen.queryByText('Testnet')).not.toBeInTheDocument();
            expect(screen.queryByText('Mainnet')).not.toBeInTheDocument();
        });
    });

    describe('invalid wallet state (hostile input boundary)', () => {
        const INVALID_ADDR = 'NOT-A-REAL-ADDRESS!!!';

        it('falls back to Connect Wallet for invalid address', () => {
            Object.assign(mockWalletState, { address: INVALID_ADDR, network: 'TESTNET' });
            render(<WalletConnectButton />);
            expect(screen.getByRole('button', { name: /connect wallet/i })).toBeInTheDocument();
        });

        it('falls back to Connect Wallet for invalid network', () => {
            const VALID_ADDR = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';
            Object.assign(mockWalletState, { address: VALID_ADDR, network: 'STANDALONE' as unknown });
            render(<WalletConnectButton />);
            // Should render the connected button but without the invalid network badge
            expect(screen.getByText('GBBD...FLA5')).toBeInTheDocument();
            expect(screen.queryByText('STANDALONE')).not.toBeInTheDocument();
        });

        it('logs error for invalid address', async () => {
            // Dynamic import to access the mocked logger
            const loggerMod = await import('../../utils/logger');
            const loggerMock = vi.mocked(loggerMod.logger);
            Object.assign(mockWalletState, { address: INVALID_ADDR, network: 'TESTNET' });
            render(<WalletConnectButton />);
            await vi.waitFor(() => {
                expect(loggerMock.error).toHaveBeenCalledWith(
                    expect.stringContaining('invalid address'),
                    expect.anything(),
                );
            });
        });
    });
});
