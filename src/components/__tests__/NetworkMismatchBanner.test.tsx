import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { NetworkMismatchBanner } from '../NetworkMismatchBanner';
import type { WalletNetwork } from '../../context/WalletContext';

const walletState = vi.hoisted(() => ({
  address: null as string | null,
  network: null as WalletNetwork | null,
}));

vi.mock('../../context/WalletContext', () => ({
  useWallet: () => walletState,
}));

const telemetryMocks = vi.hoisted(() => ({
  recordWalletTelemetry: vi.fn(),
}));

vi.mock('../../utils/walletTelemetry', () => ({
  recordWalletTelemetry: telemetryMocks.recordWalletTelemetry,
}));

function setWalletState(address: string | null, network: WalletNetwork | null) {
  walletState.address = address;
  walletState.network = network;
}

describe('NetworkMismatchBanner', () => {
  describe('Basic visibility and mismatch detection', () => {
    it('shows a danger alert when a connected wallet is on the wrong network', () => {
      setWalletState('GABC', 'PUBLIC');

      render(<NetworkMismatchBanner expectedNetwork="TESTNET" />);

      const alert = screen.getByRole('alert');
      expect(alert).toHaveTextContent('Wrong wallet network');
      expect(alert).toHaveTextContent('Mainnet');
      expect(alert).toHaveTextContent('Testnet');
      expect(
        screen.getByRole('link', { name: /switch freighter network/i }),
      ).toHaveAttribute('href', expect.stringContaining('freighter'));
    });

    it('stays hidden when networks match', () => {
      setWalletState('GABC', 'TESTNET');
      render(<NetworkMismatchBanner expectedNetwork="TESTNET" />);
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('stays hidden when wallet is disconnected', () => {
      setWalletState(null, 'PUBLIC');
      render(<NetworkMismatchBanner expectedNetwork="TESTNET" />);
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('stays hidden when network is null', () => {
      setWalletState('GABC', null);
      render(<NetworkMismatchBanner expectedNetwork="TESTNET" />);
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  describe('Dismissal behavior', () => {
    it('can be dismissed for the current mismatch', () => {
      setWalletState('GABC', 'PUBLIC');
      render(<NetworkMismatchBanner expectedNetwork="TESTNET" />);

      expect(screen.getByRole('alert')).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: /dismiss network mismatch warning/i }));
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('can be dismissed with Escape key', () => {
      setWalletState('GABC', 'PUBLIC');
      render(<NetworkMismatchBanner expectedNetwork="TESTNET" />);

      expect(screen.getByRole('alert')).toBeInTheDocument();
      const alert = screen.getByRole('alert');
      fireEvent.keyDown(alert, { key: 'Escape' });
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('stays hidden when networks match after dismissal', () => {
      setWalletState('GABC', 'PUBLIC');
      const { rerender } = render(<NetworkMismatchBanner expectedNetwork="TESTNET" />);

      fireEvent.click(screen.getByRole('button', { name: /dismiss network mismatch warning/i }));
      
      setWalletState('GABC', 'TESTNET');
      rerender(<NetworkMismatchBanner expectedNetwork="TESTNET" />);
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('returns for a new mismatch after dismissal', () => {
      setWalletState('GABC', 'PUBLIC');
      const { rerender } = render(<NetworkMismatchBanner expectedNetwork="TESTNET" />);

      expect(screen.getByRole('alert')).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: /dismiss network mismatch warning/i }));
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();

      setWalletState('GABC', 'TESTNET');
      rerender(<NetworkMismatchBanner expectedNetwork="TESTNET" />);
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();

      setWalletState('GABC', 'PUBLIC');
      rerender(<NetworkMismatchBanner expectedNetwork="TESTNET" />);
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('shows banner again for different address with same network mismatch', () => {
      setWalletState('GABC', 'PUBLIC');
      const { rerender } = render(<NetworkMismatchBanner expectedNetwork="TESTNET" />);

      fireEvent.click(screen.getByRole('button', { name: /dismiss network mismatch warning/i }));
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();

      // Different address, same mismatch - should show again
      setWalletState('GDEF', 'PUBLIC');
      rerender(<NetworkMismatchBanner expectedNetwork="TESTNET" />);
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  describe('Boundary cases', () => {
    it('handles rapid network changes correctly', () => {
      setWalletState('GABC', 'PUBLIC');
      const { rerender } = render(<NetworkMismatchBanner expectedNetwork="TESTNET" />);
      expect(screen.getByRole('alert')).toBeInTheDocument();

      setWalletState('GABC', 'TESTNET');
      rerender(<NetworkMismatchBanner expectedNetwork="TESTNET" />);
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();

      setWalletState('GABC', 'PUBLIC');
      rerender(<NetworkMismatchBanner expectedNetwork="TESTNET" />);
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('handles wallet disconnection during active mismatch', () => {
      setWalletState('GABC', 'PUBLIC');
      const { rerender } = render(<NetworkMismatchBanner expectedNetwork="TESTNET" />);
      expect(screen.getByRole('alert')).toBeInTheDocument();

      setWalletState(null, 'PUBLIC');
      rerender(<NetworkMismatchBanner expectedNetwork="TESTNET" />);
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('clears dismissal state when mismatch resolves', () => {
      setWalletState('GABC', 'PUBLIC');
      const { rerender } = render(<NetworkMismatchBanner expectedNetwork="TESTNET" />);

      fireEvent.click(screen.getByRole('button', { name: /dismiss network mismatch warning/i }));
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();

      // Resolve mismatch
      setWalletState('GABC', 'TESTNET');
      rerender(<NetworkMismatchBanner expectedNetwork="TESTNET" />);

      // Create same mismatch again - should show (dismissal was cleared)
      setWalletState('GABC', 'PUBLIC');
      rerender(<NetworkMismatchBanner expectedNetwork="TESTNET" />);
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  describe('Content and messaging', () => {
    it('displays correct network labels for PUBLIC to TESTNET mismatch', () => {
      setWalletState('GABC', 'PUBLIC');
      render(<NetworkMismatchBanner expectedNetwork="TESTNET" />);

      const alert = screen.getByRole('alert');
      expect(alert).toHaveTextContent('Mainnet');
      expect(alert).toHaveTextContent('Testnet');
    });

    it('displays correct network labels for TESTNET to PUBLIC mismatch', () => {
      setWalletState('GABC', 'TESTNET');
      render(<NetworkMismatchBanner expectedNetwork="PUBLIC" />);

      const alert = screen.getByRole('alert');
      expect(alert).toHaveTextContent('Testnet');
      expect(alert).toHaveTextContent('Mainnet');
    });

    it('includes warning about transaction failures', () => {
      setWalletState('GABC', 'PUBLIC');
      render(<NetworkMismatchBanner expectedNetwork="TESTNET" />);

      expect(screen.getByRole('alert')).toHaveTextContent(
        /switch freighter before creating or validating vaults to avoid transaction failures/i
      );
    });
  });

  describe('Accessibility', () => {
    it('has proper alert role and ARIA attributes', () => {
      setWalletState('GABC', 'PUBLIC');
      render(<NetworkMismatchBanner expectedNetwork="TESTNET" />);

      const alert = screen.getByRole('alert');
      expect(alert).toHaveAttribute('aria-live', 'assertive');
      expect(alert).toHaveAttribute('aria-atomic', 'true');
    });

    it('dismiss button has proper accessibility label', () => {
      setWalletState('GABC', 'PUBLIC');
      render(<NetworkMismatchBanner expectedNetwork="TESTNET" />);

      const dismissBtn = screen.getByRole('button', { name: /dismiss network mismatch warning/i });
      expect(dismissBtn).toHaveAttribute('type', 'button');
      expect(dismissBtn).toHaveAttribute('aria-label');
    });

    it('external link has descriptive label for screen readers', () => {
      setWalletState('GABC', 'PUBLIC');
      render(<NetworkMismatchBanner expectedNetwork="TESTNET" />);

      const link = screen.getByRole('link', { name: /learn how to switch freighter network/i });
      expect(link).toHaveAttribute('aria-label', expect.stringContaining('opens in new tab'));
    });

    it('external link has proper security attributes', () => {
      setWalletState('GABC', 'PUBLIC');
      render(<NetworkMismatchBanner expectedNetwork="TESTNET" />);

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('warning icon is marked as decorative', () => {
      setWalletState('GABC', 'PUBLIC');
      render(<NetworkMismatchBanner expectedNetwork="TESTNET" />);

      const alert = screen.getByRole('alert');
      const icon = alert.querySelector('[aria-hidden="true"]');
      expect(icon).toBeInTheDocument();
    });

    it('dismiss button meets minimum touch target size', () => {
      setWalletState('GABC', 'PUBLIC');
      render(<NetworkMismatchBanner expectedNetwork="TESTNET" />);

      const dismissBtn = screen.getByRole('button', { name: /dismiss network mismatch warning/i });
      const styles = window.getComputedStyle(dismissBtn);
      
      // Check that min-height and min-width are set (actual computed values depend on CSS vars)
      expect(dismissBtn).toHaveStyle({ minHeight: 'var(--touch-target)' });
      expect(dismissBtn).toHaveStyle({ minWidth: 'var(--touch-target)' });
    });
  });

  describe('Interactive behavior', () => {
    it('dismiss button responds to focus events', () => {
      setWalletState('GABC', 'PUBLIC');
      render(<NetworkMismatchBanner expectedNetwork="TESTNET" />);

      const dismissBtn = screen.getByRole('button', { name: /dismiss network mismatch warning/i });
      
      fireEvent.focus(dismissBtn);
      expect(dismissBtn).toHaveStyle({ outline: '2px solid var(--danger)' });
      
      fireEvent.blur(dismissBtn);
      expect(dismissBtn).toHaveStyle({ outline: 'none' });
    });

    it('dismiss button responds to hover events', () => {
      setWalletState('GABC', 'PUBLIC');
      render(<NetworkMismatchBanner expectedNetwork="TESTNET" />);

      const dismissBtn = screen.getByRole('button', { name: /dismiss network mismatch warning/i });
      
      fireEvent.mouseEnter(dismissBtn);
      expect(dismissBtn).toHaveStyle({ background: 'var(--danger-transparent)' });
      
      fireEvent.mouseLeave(dismissBtn);
      expect(dismissBtn).toHaveStyle({ background: 'transparent' });
    });
  });

  it('emits mismatch_shown telemetry when a mismatch appears', () => {
    setWalletState('GABC', 'PUBLIC');

    render(<NetworkMismatchBanner expectedNetwork="TESTNET" />);

    expect(telemetryMocks.recordWalletTelemetry).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'wallet.network.mismatch_shown',
        network: 'PUBLIC',
        expectedNetwork: 'TESTNET',
      }),
    );
  });

  it('does not re-emit shown telemetry on unrelated re-renders', () => {
    setWalletState('GABC', 'PUBLIC');
    const { rerender } = render(<NetworkMismatchBanner expectedNetwork="TESTNET" />);
    expect(telemetryMocks.recordWalletTelemetry).toHaveBeenCalledTimes(1);

    rerender(<NetworkMismatchBanner expectedNetwork="TESTNET" />);

    expect(telemetryMocks.recordWalletTelemetry).toHaveBeenCalledTimes(1);
  });

  it('emits recovered telemetry when the wallet returns to the expected network', () => {
    setWalletState('GABC', 'PUBLIC');
    const { rerender } = render(<NetworkMismatchBanner expectedNetwork="TESTNET" />);
    expect(telemetryMocks.recordWalletTelemetry).toHaveBeenCalledWith(
      expect.objectContaining({ event: 'wallet.network.mismatch_shown' }),
    );

    setWalletState('GABC', 'TESTNET');
    rerender(<NetworkMismatchBanner expectedNetwork="TESTNET" />);

    expect(telemetryMocks.recordWalletTelemetry).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'wallet.network.recovered',
        network: 'TESTNET',
        expectedNetwork: 'TESTNET',
      }),
    );
  });

  it('emits dismissed telemetry when the warning is dismissed', () => {
    setWalletState('GABC', 'PUBLIC');

    render(<NetworkMismatchBanner expectedNetwork="TESTNET" />);
    fireEvent.click(screen.getByRole('button', { name: /dismiss network mismatch warning/i }));

    expect(telemetryMocks.recordWalletTelemetry).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'wallet.network.dismissed',
        network: 'PUBLIC',
        expectedNetwork: 'TESTNET',
      }),
    );
  });
});
