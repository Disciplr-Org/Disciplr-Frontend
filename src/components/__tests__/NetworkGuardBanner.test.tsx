import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { WalletNetwork } from '../../context/WalletContext';
import { NetworkGuardBanner } from '../NetworkGuardBanner';

const walletState = vi.hoisted(() => ({
  address: null as string | null,
  network: null as WalletNetwork | null,
}));

vi.mock('../../context/WalletContext', () => ({
  useWallet: () => walletState,
}));

describe('NetworkGuardBanner', () => {
  beforeEach(() => {
    walletState.address = null;
    walletState.network = null;
  });

  it('stays hidden without a connected wallet or when networks match', () => {
    const { rerender } = render(<NetworkGuardBanner expectedNetwork="TESTNET" />);

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    walletState.address = 'GUSER';
    walletState.network = 'TESTNET';
    rerender(<NetworkGuardBanner expectedNetwork="TESTNET" />);

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows an alert when the connected wallet network differs from the expected network', () => {
    walletState.address = 'GUSER';
    walletState.network = 'PUBLIC';

    render(<NetworkGuardBanner expectedNetwork="TESTNET" />);

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Wrong wallet network');
    expect(alert).toHaveTextContent('Connected to PUBLIC');
    expect(alert).toHaveTextContent('TESTNET');
  });

  it('can be dismissed for the current mismatch and reappears for a new mismatch', () => {
    walletState.address = 'GUSER';
    walletState.network = 'PUBLIC';
    const { rerender } = render(<NetworkGuardBanner expectedNetwork="TESTNET" />);

    fireEvent.click(screen.getByRole('button', { name: /dismiss network warning/i }));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    walletState.network = 'TESTNET';
    rerender(<NetworkGuardBanner expectedNetwork="TESTNET" />);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    walletState.network = 'PUBLIC';
    rerender(<NetworkGuardBanner expectedNetwork="TESTNET" />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});
