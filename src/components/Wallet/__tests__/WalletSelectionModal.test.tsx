import { vi, describe, beforeEach, test, expect } from 'vitest';

/**
 * Focused coverage for WalletSelectionModal failure paths and boundaries.
 *
 * Invariants exercised here:
 * 1. The modal closes only when `connect()` resolves truthy. Rejections,
 *    `false`, and malformed (non-boolean) results keep it open so the user
 *    keeps seeing the error.
 * 2. Concurrent activation is bounded: the first click starts one connect
 *    attempt; clicks that arrive before the promise settles are ignored (and
 *    recorded as privacy-safe telemetry) so Freighter prompts never stack.
 * 3. The in-flight guard is released on every terminal path (success, failure,
 *    rejection), so a failed attempt never permanently locks the retry button.
 * 4. The "Connected" label is derived only from a present, non-blank address;
 *    null/undefined/blank addresses render "Available".
 * 5. State updates after unmount are suppressed (no callback fires once gone).
 */

const walletState = vi.hoisted(() => ({
    connect: vi.fn(),
    isConnecting: false,
    error: null as string | null,
    address: null as string | null,
}));

vi.mock('@/context/WalletContext', () => ({
    useWallet: () => walletState,
}));

const telemetryMocks = vi.hoisted(() => ({
    recordWalletTelemetry: vi.fn(),
}));

vi.mock('../../../utils/walletTelemetry', () => ({
    recordWalletTelemetry: telemetryMocks.recordWalletTelemetry,
}));

import { act, render, screen, fireEvent } from '@testing-library/react';
import { WalletSelectionModal } from '../WalletSelectionModal';

function renderModal(onClose = vi.fn()) {
    return { onClose, ...render(<WalletSelectionModal onClose={onClose} />) };
}

function freighterButton() {
    return screen.getByText('Freighter').closest('button') as HTMLButtonElement;
}

describe('WalletSelectionModal', () => {
    beforeEach(() => {
        walletState.connect = vi.fn().mockResolvedValue(true);
        walletState.isConnecting = false;
        walletState.error = null;
        walletState.address = null;
        telemetryMocks.recordWalletTelemetry.mockClear();
    });

    test('renders the title and Freighter option', () => {
        renderModal();
        expect(screen.getByText('Connect Wallet')).toBeInTheDocument();
        expect(screen.getByText('Freighter')).toBeInTheDocument();
    });

    test('calls connect then onClose when Freighter button is clicked', async () => {
        const { onClose } = renderModal();

        await act(async () => {
            freighterButton().click();
        });

        expect(walletState.connect).toHaveBeenCalledTimes(1);
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    test('disables the button and shows loader while isConnecting', () => {
        walletState.isConnecting = true;
        renderModal();

        const btn = freighterButton();
        expect(btn).toBeDisabled();
        expect(btn.querySelector('.loader')).toBeInTheDocument();
    });

    test('renders context error message', () => {
        walletState.error = 'Wallet access denied.';
        renderModal();
        expect(screen.getByText('Wallet access denied.')).toBeInTheDocument();
    });

    test('calls onClose when the X button is clicked', () => {
        const { onClose } = renderModal();
        const closeBtn = document.querySelector('.wallet-close-btn') as HTMLElement;
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

    // --- Connected-state boundaries (invariant 4) -------------------------

    test('reports Available when no address is available', () => {
        walletState.address = null;
        renderModal();
        expect(screen.getByText('Available')).toBeInTheDocument();
        expect(screen.queryByText('Connected')).not.toBeInTheDocument();
    });

    test('reports Connected once a present, non-blank address is available', () => {
        walletState.address = 'GABCDEF1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF';
        renderModal();
        expect(screen.getByText('Connected')).toBeInTheDocument();
        expect(screen.queryByText('Available')).not.toBeInTheDocument();
    });

    test('never reports Connected for a blank address (boundary: "" and whitespace)', () => {
        walletState.address = '';
        const { rerender } = render(<WalletSelectionModal onClose={vi.fn()} />);
        expect(screen.getByText('Available')).toBeInTheDocument();
        expect(screen.queryByText('Connected')).not.toBeInTheDocument();

        walletState.address = '   ';
        rerender(<WalletSelectionModal onClose={vi.fn()} />);
        expect(screen.getByText('Available')).toBeInTheDocument();
        expect(screen.queryByText('Connected')).not.toBeInTheDocument();
    });

    test('does not crash when wallet is already connected', () => {
        walletState.address = 'GCONNECTEDADDRESS';
        expect(() => renderModal()).not.toThrow();
        expect(screen.getByText('Connected')).toBeInTheDocument();
    });

    // --- Failure paths (invariant 1) --------------------------------------

    test('does not call onClose and shows error after connect rejection', async () => {
        walletState.connect.mockImplementation(() => {
            walletState.error = 'Failed to connect wallet. Make sure Freighter is installed and unlocked.';
            return Promise.resolve(false);
        });
        const onClose = vi.fn();
        const { rerender } = render(<WalletSelectionModal onClose={onClose} />);

        await act(async () => {
            freighterButton().click();
        });

        expect(onClose).not.toHaveBeenCalled();
        rerender(<WalletSelectionModal onClose={onClose} />);
        expect(screen.getByText('Failed to connect wallet. Make sure Freighter is installed and unlocked.')).toBeInTheDocument();
    });

    test('does not call onClose and shows error on access denied', async () => {
        walletState.connect.mockImplementation(() => {
            walletState.error = 'Wallet access denied.';
            return Promise.resolve(false);
        });
        const onClose = vi.fn();
        const { rerender } = render(<WalletSelectionModal onClose={onClose} />);

        await act(async () => {
            freighterButton().click();
        });

        expect(onClose).not.toHaveBeenCalled();
        rerender(<WalletSelectionModal onClose={onClose} />);
        expect(screen.getByText('Wallet access denied.')).toBeInTheDocument();
    });

    test('does not call onClose and shows error when network error occurs', async () => {
        walletState.connect.mockImplementation(() => {
            walletState.error = 'Network error connecting to wallet.';
            return Promise.resolve(false);
        });
        const onClose = vi.fn();
        const { rerender } = render(<WalletSelectionModal onClose={onClose} />);

        await act(async () => {
            freighterButton().click();
        });

        expect(onClose).not.toHaveBeenCalled();
        rerender(<WalletSelectionModal onClose={onClose} />);
        expect(screen.getByText('Network error connecting to wallet.')).toBeInTheDocument();
    });

    test('does not call onClose if connect throws an unexpected error', async () => {
        walletState.connect.mockRejectedValue(new Error('Unexpected wallet failure'));
        const onClose = vi.fn();
        render(<WalletSelectionModal onClose={onClose} />);

        await act(async () => {
            freighterButton().click();
        });

        expect(onClose).not.toHaveBeenCalled();
    });

    test('treats a malformed non-boolean connect result as failure and keeps the modal open', async () => {
        walletState.connect.mockResolvedValue(undefined as unknown as boolean);
        const onClose = vi.fn();
        render(<WalletSelectionModal onClose={onClose} />);

        await act(async () => {
            freighterButton().click();
        });

        expect(onClose).not.toHaveBeenCalled();
    });

    // --- Concurrency boundaries (invariant 2) -----------------------------

    test('prevents multiple connect calls on double click', async () => {
        let resolveConnect: (value: boolean) => void;
        walletState.connect.mockImplementation(() => new Promise((resolve) => {
            resolveConnect = resolve;
        }));
        const { onClose } = renderModal();

        const btn = freighterButton();

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

    test('records an ignored telemetry event when a second click arrives while pending', async () => {
        let resolveConnect: (value: boolean) => void;
        walletState.connect.mockImplementation(() => new Promise((resolve) => {
            resolveConnect = resolve;
        }));
        renderModal();

        const btn = freighterButton();

        await act(async () => {
            btn.click();
            btn.click();
        });

        expect(walletState.connect).toHaveBeenCalledTimes(1);
        expect(telemetryMocks.recordWalletTelemetry).toHaveBeenCalledWith(
            expect.objectContaining({ event: 'wallet.connect.ignored', reason: 'button_pending' }),
        );

        await act(async () => {
            resolveConnect(true);
        });
    });

    test('does not record ignored telemetry for a single normal activation', async () => {
        const { onClose } = renderModal();

        await act(async () => {
            freighterButton().click();
        });

        expect(onClose).toHaveBeenCalledTimes(1);
        expect(telemetryMocks.recordWalletTelemetry).not.toHaveBeenCalledWith(
            expect.objectContaining({ event: 'wallet.connect.ignored' }),
        );
    });

    test('freighter option is inert while a connection attempt is already in progress', () => {
        walletState.isConnecting = true;
        renderModal();

        const btn = freighterButton();
        expect(btn).toBeDisabled();

        // A disabled control must not start a connect attempt (invariant 2).
        fireEvent.click(btn);
        expect(walletState.connect).not.toHaveBeenCalled();
    });

    // --- Retry / recovery (invariant 3) -----------------------------------

    test('keeps the modal open and permits a retry after a failed attempt', async () => {
        walletState.connect = vi.fn()
            .mockResolvedValueOnce(false)
            .mockResolvedValueOnce(true);
        const onClose = vi.fn();
        render(<WalletSelectionModal onClose={onClose} />);

        await act(async () => {
            freighterButton().click();
        });
        expect(walletState.connect).toHaveBeenCalledTimes(1);
        expect(onClose).not.toHaveBeenCalled();

        await act(async () => {
            freighterButton().click();
        });
        expect(walletState.connect).toHaveBeenCalledTimes(2);
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    test('releases the in-flight guard after a thrown error so the user can retry', async () => {
        walletState.connect = vi.fn()
            .mockRejectedValueOnce(new Error('Unexpected wallet failure'))
            .mockResolvedValueOnce(true);
        const onClose = vi.fn();
        render(<WalletSelectionModal onClose={onClose} />);

        await act(async () => {
            freighterButton().click();
        });
        expect(walletState.connect).toHaveBeenCalledTimes(1);
        expect(onClose).not.toHaveBeenCalled();

        await act(async () => {
            freighterButton().click();
        });
        expect(walletState.connect).toHaveBeenCalledTimes(2);
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    test('keeps the close controls usable after a failed attempt', async () => {
        walletState.connect.mockResolvedValue(false);
        const onClose = vi.fn();
        render(<WalletSelectionModal onClose={onClose} />);

        await act(async () => {
            freighterButton().click();
        });
        expect(onClose).not.toHaveBeenCalled();

        fireEvent.click(document.querySelector('.wallet-modal-overlay') as HTMLElement);
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    // --- Lifecycle boundary (invariant 5) ---------------------------------

    test('does not call onClose if unmounted before connect resolves', async () => {
        let resolveConnect: (value: boolean) => void;
        walletState.connect.mockImplementation(() => new Promise((resolve) => {
            resolveConnect = resolve;
        }));

        const onClose = vi.fn();
        const { unmount } = render(<WalletSelectionModal onClose={onClose} />);

        const btn = freighterButton();

        await act(async () => {
            btn.click();
        });

        unmount();

        await act(async () => {
            resolveConnect(true);
        });

        expect(onClose).not.toHaveBeenCalled();
    });

    // --- Unsupported wallet boundary --------------------------------------

    test('renders the Albedo option as an inert coming-soon control', () => {
        renderModal();

        const albedo = screen.getByText('Albedo').closest('button') as HTMLButtonElement;
        expect(albedo).toBeDisabled();
        expect(albedo).toHaveAttribute('aria-disabled', 'true');
        expect(albedo).toHaveAttribute('title', 'Albedo support is coming soon');

        fireEvent.click(albedo);
        expect(walletState.connect).not.toHaveBeenCalled();
    });
});
