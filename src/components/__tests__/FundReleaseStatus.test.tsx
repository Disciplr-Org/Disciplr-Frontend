import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { FundReleaseStatus, stellarTxUrl, truncateStellarValue } from '../FundReleaseStatus';

const mockUseWallet = vi.fn();

vi.mock('../../context/WalletContext', () => ({
  useWallet: () => mockUseWallet(),
}));

describe('helpers', () => {
  it('truncates long Stellar values', () => {
    expect(truncateStellarValue('GABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890')).toBe('GABCDE...7890');
  });

  it('builds the correct explorer URL per network', () => {
    expect(stellarTxUrl('abc123', 'TESTNET')).toBe('https://stellar.expert/explorer/testnet/tx/abc123');
    expect(stellarTxUrl('abc123', 'PUBLIC')).toBe('https://stellar.expert/explorer/public/tx/abc123');
  });
});

describe('FundReleaseStatus', () => {
  beforeEach(() => {
    mockUseWallet.mockReturnValue({ network: 'TESTNET' });
  });

  it('renders a released settlement with transaction and destination details', () => {
    render(
      <FundReleaseStatus
        outcome="released"
        destinationAddress="GSUCCESSDESTINATION1234567890"
        amount={4200.5}
        transaction={{
          hash: 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef12',
          timestamp: '2024-01-01T09:00:00Z',
        }}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Funds released' })).toBeInTheDocument();
    expect(screen.getByText('4,200.5 USDC')).toBeInTheDocument();
    expect(screen.getByLabelText('Destination address GSUCCESSDESTINATION1234567890')).toHaveAttribute(
      'title',
      'GSUCCESSDESTINATION1234567890',
    );
    expect(
      screen.getByRole('link', { name: /View transaction abcdef1234567890abcdef1234567890abcdef1234567890abcdef12 on Stellar Explorer/i }),
    ).toHaveAttribute(
      'href',
      'https://stellar.expert/explorer/testnet/tx/abcdef1234567890abcdef1234567890abcdef1234567890abcdef12',
    );
  });

  it('renders redirected settlement with PUBLIC explorer link', () => {
    mockUseWallet.mockReturnValue({ network: 'PUBLIC' });

    render(
      <FundReleaseStatus
        outcome="redirected"
        destinationAddress="GFAILDESTINATION1234567890"
        amount={88}
        assetCode="USDC"
        transaction={{
          hash: '1234567890abcdef1234567890abcdef1234567890abcdef12345678',
          timestamp: '2024-01-02T10:00:00Z',
        }}
      />,
    );

    expect(screen.getByText('Funds redirected')).toBeInTheDocument();
    expect(screen.getByText('88 USDC')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /View transaction 1234567890abcdef1234567890abcdef1234567890abcdef12345678 on Stellar Explorer/i }),
    ).toHaveAttribute(
      'href',
      'https://stellar.expert/explorer/public/tx/1234567890abcdef1234567890abcdef1234567890abcdef12345678',
    );
  });

  it('renders pending settlement without a transaction hash', () => {
    render(
      <FundReleaseStatus
        outcome="pending"
        amount={125}
        destinationAddress={undefined}
      />,
    );

    expect(screen.getByText('Settlement pending')).toBeInTheDocument();
    expect(screen.getByText('Awaiting settlement')).toBeInTheDocument();
    expect(screen.getByText('Awaiting transaction hash')).toBeInTheDocument();
    expect(screen.getByText('Not assigned yet')).toBeInTheDocument();
  });
});
