import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// ── Module-level mocks ─────────────────────────────────────────────

const mockConnect = vi.fn().mockResolvedValue(false);

vi.mock('../../context/WalletContext', () => ({
    useWallet: vi.fn(() => ({
        connect: mockConnect,
        isConnecting: false,
        error: null,
        address: null,
    })),
}));

vi.mock('../../utils/walletTelemetry', () => ({
    recordWalletTelemetry: vi.fn(),
}));

vi.mock('../Modal', () => ({
    Modal: ({ children, isOpen }: { children: React.ReactNode; isOpen: boolean }) =>
        isOpen ? <div role="dialog" data-testid="modal">{children}</div> : null,
}));

// Import after mocks
import { WalletSelectionModal } from './WalletSelectionModal';
import { useWallet } from '../../context/WalletContext';
import { recordWalletTelemetry } from '../../utils/walletTelemetry';

const mockUseWallet = vi.mocked(useWallet);
const mockRecordTelemetry = vi.mocked(recordWalletTelemetry);

// ── Helpers ────────────────────────────────────────────────────────

function renderModal(overrides: Partial<ReturnType<typeof useWallet>> = {}) {
    const onClose = vi.fn();
    mockUseWallet.mockReturnValue({
        connect: mockConnect,
        isConnecting: false,
        error: null,
        address: null,
        status: 'disconnected',
        network: null,
        balance: null,
        balanceStatus: 'idle',
        balanceError: null,
        checkConnection: vi.fn(),
        disconnect: vi.fn(),
        ...overrides,
    } as ReturnType<typeof useWallet>);

    const result = render(<WalletSelectionModal onClose={onClose} />);
    return { ...result, onClose };
}

// ── Tests ──────────────────────────────────────────────────────────

describe('WalletSelectionModal', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ── Happy path ────────────────────────────────────────────────

    it('renders the modal dialog with title', () => {
        renderModal();
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText('Connect Wallet')).toBeInTheDocument();
    });

    it('renders the Freighter wallet option', () => {
        renderModal();
        expect(screen.getByText('Freighter')).toBeInTheDocument();
        expect(screen.getByLabelText(/connect freighter wallet/i)).toBeInTheDocument();
    });

    it('renders the Albedo wallet option as disabled', () => {
        renderModal();
        expect(screen.getByText('Albedo')).toBeInTheDocument();
        const albedoBtn = screen.getByText('Albedo').closest('button');
        expect(albedoBtn).toBeDisabled();
    });

    it('renders the "What is a wallet?" help link', () => {
        renderModal();
        const link = screen.getByText(/what is a wallet/i);
        expect(link).toHaveAttribute('target', '_blank');
        expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('calls onClose when close button is clicked', () => {
        const { onClose } = renderModal();
        const closeBtn = screen.getByLabelText('Close wallet modal');
        fireEvent.click(closeBtn);
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    // ── Connect behavior ─────────────────────────────────────────

    it('calls connect and closes modal on success', async () => {
        mockConnect.mockResolvedValueOnce(true);
        const { onClose } = renderModal();
        const connectBtn = screen.getByLabelText(/connect freighter wallet/i);
        fireEvent.click(connectBtn);
        await vi.waitFor(() => {
            expect(mockConnect).toHaveBeenCalledTimes(1);
            expect(onClose).toHaveBeenCalled();
        });
    });

    it('does not close modal when connect returns false', async () => {
        mockConnect.mockResolvedValueOnce(false);
        const { onClose } = renderModal();
        const connectBtn = screen.getByLabelText(/connect freighter wallet/i);
        fireEvent.click(connectBtn);
        await vi.waitFor(() => {
            expect(mockConnect).toHaveBeenCalledTimes(1);
        });
        expect(onClose).not.toHaveBeenCalled();
    });

    it('shows "Connecting…" label while isConnecting is true', () => {
        renderModal({ isConnecting: true });
        expect(screen.getByLabelText(/connecting to freighter/i)).toBeInTheDocument();
    });

    it('shows "Connected" when address is a valid Stellar address', () => {
        const VALID_ADDR = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';
        renderModal({ address: VALID_ADDR });
        expect(screen.getByText('Connected')).toBeInTheDocument();
    });

    // ── Error handling ───────────────────────────────────────────

    it('displays sanitized error when wallet reports an error', () => {
        renderModal({ error: 'Wallet access denied.' });
        expect(screen.getByRole('alert')).toHaveTextContent('Wallet access denied.');
    });

    it('sanitizes extremely long error messages', () => {
        const longError = 'x'.repeat(600);
        renderModal({ error: longError });
        const alert = screen.getByRole('alert');
        expect(alert.textContent!.length).toBeLessThan(600);
        expect(alert.textContent).toMatch(/…$/);
    });

    it('does not render raw HTML from error messages', () => {
        const maliciousError = '<img src=x onerror=alert(1)>';
        renderModal({ error: maliciousError });
        const alert = screen.getByRole('alert');
        expect(alert.innerHTML).not.toContain('<img');
    });

    // ── Reconnect / double-click boundary ────────────────────────

    it('ignores duplicate connect calls while one is pending', async () => {
        let resolveConnect!: (val: boolean) => void;
        mockConnect.mockImplementation(
            () => new Promise<boolean>((r) => { resolveConnect = r; }),
        );
        renderModal();
        const connectBtn = screen.getByLabelText(/connect freighter wallet/i);

        fireEvent.click(connectBtn);
        fireEvent.click(connectBtn);

        await vi.waitFor(() => {
            expect(mockConnect).toHaveBeenCalledTimes(1);
        });

        resolveConnect(false);
    });

    it('re-enables connect button after previous attempt finishes', async () => {
        mockConnect.mockResolvedValueOnce(false);
        renderModal();
        const connectBtn = screen.getByLabelText(/connect freighter wallet/i);

        fireEvent.click(connectBtn);
        await vi.waitFor(() => {
            expect(mockConnect).toHaveBeenCalledTimes(1);
        });

        mockConnect.mockResolvedValueOnce(true);
        fireEvent.click(connectBtn);
        await vi.waitFor(() => {
            expect(mockConnect).toHaveBeenCalledTimes(2);
        });
    });

    // ── Hostile input boundary ───────────────────────────────────

    it('does not crash with null error', () => {
        expect(() => renderModal({ error: null })).not.toThrow();
    });

    it('does not crash with undefined address', () => {
        expect(() => renderModal({ address: undefined as unknown as null })).not.toThrow();
    });

    it('does not crash with empty string address', () => {
        expect(() => renderModal({ address: '' })).not.toThrow();
    });

    it('marks invalid address as "Available" (not "Connected")', () => {
        renderModal({ address: 'not-a-real-address' });
        expect(screen.getByText('Available')).toBeInTheDocument();
        expect(screen.queryByText('Connected')).not.toBeInTheDocument();
    });

    // ── Telemetry ────────────────────────────────────────────────

    it('records telemetry when connect button is ignored while pending', async () => {
        let resolveConnect!: (val: boolean) => void;
        mockConnect.mockImplementation(
            () => new Promise<boolean>((r) => { resolveConnect = r; }),
        );
        renderModal();
        const connectBtn = screen.getByLabelText(/connect freighter wallet/i);

        fireEvent.click(connectBtn);
        fireEvent.click(connectBtn);

        await vi.waitFor(() => {
            expect(mockRecordTelemetry).toHaveBeenCalledWith(
                expect.objectContaining({ event: 'wallet.connect.ignored', reason: 'button_pending' }),
            );
        });

        resolveConnect(false);
    });
});
