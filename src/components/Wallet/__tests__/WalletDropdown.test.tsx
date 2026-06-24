import { act } from 'react';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { WalletDropdown } from '../WalletDropdown';
import type { BalanceStatus, WalletNetwork } from '../../../context/WalletContext';

const walletState = vi.hoisted(() => ({
    address: 'GABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890',
    balance: '12.0000000' as string | null,
    balanceStatus: 'success' as BalanceStatus,
    balanceError: null as string | null,
    network: 'TESTNET' as WalletNetwork,
    disconnect: vi.fn(),
    refreshBalance: vi.fn(),
}));

vi.mock('../../../context/WalletContext', () => ({
    useWallet: () => walletState,
}));

function renderDropdown() {
    const onClose = vi.fn();
    const onSwitch = vi.fn();

    return {
        onClose,
        onSwitch,
        ...render(<WalletDropdown onClose={onClose} onSwitch={onSwitch} />),
    };
}

describe('WalletDropdown balance states', () => {
    beforeEach(() => {
        walletState.address = 'GABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890';
        walletState.balance = '12.0000000';
        walletState.balanceStatus = 'success';
        walletState.balanceError = null;
        walletState.network = 'TESTNET';
        walletState.disconnect.mockClear();
        walletState.refreshBalance.mockClear();
        vi.useRealTimers();
    });

    test('renders the loaded USDC balance', () => {
        renderDropdown();

        expect(screen.getByText('12.0000000')).toBeInTheDocument();
        expect(screen.getByText('USDC')).toBeInTheDocument();
    });

    test('renders a loading state instead of a stale balance', () => {
        walletState.balance = null;
        walletState.balanceStatus = 'loading';

        renderDropdown();

        expect(screen.getByRole('status')).toHaveTextContent('Loading USDC balance');
        expect(screen.queryByText('12.0000000')).not.toBeInTheDocument();
    });

    test('renders the no-trustline state explicitly', () => {
        walletState.balance = '0.00';
        walletState.balanceStatus = 'no_trustline';

        renderDropdown();

        expect(screen.getByText('0.00')).toBeInTheDocument();
        expect(screen.getByText('No USDC trustline on this network')).toBeInTheDocument();
    });

    test('renders the Horizon error state', () => {
        walletState.balance = null;
        walletState.balanceStatus = 'error';
        walletState.balanceError = 'Horizon balance request failed with status 500.';

        renderDropdown();

        expect(screen.getByRole('status')).toHaveTextContent('Balance unavailable');
        expect(screen.getByText('Horizon balance request failed with status 500.')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    test('calls refreshBalance from the Horizon error retry action', () => {
        walletState.balance = null;
        walletState.balanceStatus = 'error';
        walletState.balanceError = 'Horizon balance request failed with status 500.';

        renderDropdown();
        screen.getByRole('button', { name: /retry/i }).click();

        expect(walletState.refreshBalance).toHaveBeenCalledTimes(1);
    });

    test('renders nothing when no wallet is connected', () => {
        walletState.address = null as unknown as string;

        const { container } = renderDropdown();

        expect(container).toBeEmptyDOMElement();
    });

    test('copies the address and opens the public explorer', async () => {
        vi.useFakeTimers();
        const writeText = vi.fn().mockResolvedValue(undefined);
        Object.assign(navigator, { clipboard: { writeText } });
        const open = vi.spyOn(window, 'open').mockImplementation(() => null);
        walletState.network = 'PUBLIC';

        renderDropdown();

        await act(async () => {
            screen.getByTitle('Copy Address').click();
            await Promise.resolve();
        });
        act(() => {
            vi.runOnlyPendingTimers();
        });
        expect(writeText).toHaveBeenCalledWith(walletState.address);

        screen.getByRole('button', { name: /view on stellar explorer/i }).click();
        expect(open).toHaveBeenCalledWith(
            `https://stellar.expert/explorer/public/account/${walletState.address}`,
            '_blank',
        );

        open.mockRestore();
    });

    test('opens the testnet explorer for testnet wallets', () => {
        const open = vi.spyOn(window, 'open').mockImplementation(() => null);

        renderDropdown();

        screen.getByRole('button', { name: /view on stellar explorer/i }).click();
        expect(open).toHaveBeenCalledWith(
            `https://stellar.expert/explorer/testnet/account/${walletState.address}`,
            '_blank',
        );

        open.mockRestore();
    });

    test('handles copy failures without closing the dropdown', async () => {
        Object.assign(navigator, { clipboard: { writeText: vi.fn().mockRejectedValue(new Error('denied')) } });
        const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);

        renderDropdown();
        screen.getByTitle('Copy Address').click();

        await screen.findByText('12.0000000');
        expect(error).toHaveBeenCalledWith('Failed to copy', expect.any(Error));

        error.mockRestore();
    });

    test('calls switch and disconnect actions', () => {
        const { onClose, onSwitch } = renderDropdown();

        screen.getByRole('button', { name: /switch wallet/i }).click();
        expect(onSwitch).toHaveBeenCalledTimes(1);

        screen.getByRole('button', { name: /disconnect/i }).click();
        expect(walletState.disconnect).toHaveBeenCalledTimes(1);
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    test('renders an empty balance fallback for idle state', () => {
        walletState.balance = null;
        walletState.balanceStatus = 'idle';

        renderDropdown();

        expect(screen.getByText('-')).toBeInTheDocument();
    });
});
