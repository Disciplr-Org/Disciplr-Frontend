import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TrustlineBanner } from '../TrustlineBanner';

vi.mock('../../context/WalletContext', () => ({
  useWallet: vi.fn(),
}));

import { useWallet } from '../../context/WalletContext';
const mockUseWallet = vi.mocked(useWallet);

const TESTNET_ISSUER = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';
const PUBLIC_ISSUER = 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN';

describe('TrustlineBanner', () => {
  it('shows the banner when connected and balanceStatus is no_trustline', () => {
    mockUseWallet.mockReturnValue({
      address: 'GABC',
      network: 'TESTNET',
      balanceStatus: 'no_trustline',
    } as ReturnType<typeof useWallet>);

    render(<TrustlineBanner />);

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(TESTNET_ISSUER)).toBeInTheDocument();
  });

  it('shows the PUBLIC network issuer when on PUBLIC', () => {
    mockUseWallet.mockReturnValue({
      address: 'GABC',
      network: 'PUBLIC',
      balanceStatus: 'no_trustline',
    } as ReturnType<typeof useWallet>);

    render(<TrustlineBanner />);

    expect(screen.getByText(PUBLIC_ISSUER)).toBeInTheDocument();
  });

  it('hides the banner when balanceStatus is success', () => {
    mockUseWallet.mockReturnValue({
      address: 'GABC',
      network: 'TESTNET',
      balanceStatus: 'success',
    } as ReturnType<typeof useWallet>);

    render(<TrustlineBanner />);

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('hides the banner when wallet is disconnected (no address)', () => {
    mockUseWallet.mockReturnValue({
      address: null,
      network: null,
      balanceStatus: 'no_trustline',
    } as ReturnType<typeof useWallet>);

    render(<TrustlineBanner />);

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('dismisses the banner for the session when the dismiss button is clicked', () => {
    mockUseWallet.mockReturnValue({
      address: 'GABC',
      network: 'TESTNET',
      balanceStatus: 'no_trustline',
    } as ReturnType<typeof useWallet>);

    render(<TrustlineBanner />);
    expect(screen.getByRole('alert')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /dismiss trustline banner/i }));

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('does not show the banner when balanceStatus is idle', () => {
    mockUseWallet.mockReturnValue({
      address: 'GABC',
      network: 'TESTNET',
      balanceStatus: 'idle',
    } as ReturnType<typeof useWallet>);

    render(<TrustlineBanner />);

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('does not show the banner when balanceStatus is loading', () => {
    mockUseWallet.mockReturnValue({
      address: 'GABC',
      network: 'TESTNET',
      balanceStatus: 'loading',
    } as ReturnType<typeof useWallet>);

    render(<TrustlineBanner />);

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('does not show the banner when balanceStatus is error', () => {
    mockUseWallet.mockReturnValue({
      address: 'GABC',
      network: 'TESTNET',
      balanceStatus: 'error',
    } as ReturnType<typeof useWallet>);

    render(<TrustlineBanner />);

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  describe('CTA accessibility and content', () => {
    it('dismiss CTA has an accessible name', () => {
      mockUseWallet.mockReturnValue({
        address: 'GABC',
        network: 'TESTNET',
        balanceStatus: 'no_trustline',
      } as ReturnType<typeof useWallet>);

      render(<TrustlineBanner />);

      const dismissButton = screen.getByRole('button', { name: /dismiss trustline banner/i });
      expect(dismissButton).toBeInTheDocument();
      expect(dismissButton).toHaveAttribute('aria-label', 'Dismiss trustline banner');
    });

    it('banner body contains instructions that reference the issuer address', () => {
      mockUseWallet.mockReturnValue({
        address: 'GABC',
        network: 'TESTNET',
        balanceStatus: 'no_trustline',
      } as ReturnType<typeof useWallet>);

      render(<TrustlineBanner />);

      expect(
        screen.getByText(/your wallet has no usdc trustline/i),
      ).toBeInTheDocument();
      expect(screen.getByText(TESTNET_ISSUER)).toBeInTheDocument();
    });

    it('only shows the banner for no_trustline and hides for all other statuses', () => {
      const statuses = ['idle', 'loading', 'success', 'error'] as const;

      for (const balanceStatus of statuses) {
        mockUseWallet.mockReturnValue({
          address: 'GABC',
          network: 'TESTNET',
          balanceStatus,
        } as ReturnType<typeof useWallet>);

        const { unmount } = render(<TrustlineBanner />);
        expect(
          screen.queryByRole('alert'),
          `expected no alert for status "${balanceStatus}"`,
        ).not.toBeInTheDocument();
        unmount();
      }
    });
  });
});
