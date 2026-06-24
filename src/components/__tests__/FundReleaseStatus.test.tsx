import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FundReleaseStatus } from '../FundReleaseStatus';

let mockNetwork: 'TESTNET' | 'PUBLIC' | null = 'TESTNET';

vi.mock('../../context/WalletContext', () => ({
  useWallet: () => ({
    address: null,
    network: mockNetwork,
    balance: null,
    isConnecting: false,
    error: null,
    connect: vi.fn(),
    disconnect: vi.fn(),
    checkConnection: vi.fn(),
  }),
}));

describe('FundReleaseStatus', () => {
  beforeEach(() => {
    mockNetwork = 'TESTNET';
  });

  it('renders a released settlement with destination, amount, and testnet explorer link', () => {
    render(
      <FundReleaseStatus
        outcome="released"
        destinationAddress="GSUCCESSDESTINATION1234567890"
        amount={4200.5}
        currency="USDC"
        transaction={{
          hash: 'abcdef1234567890abcdef1234567890',
          timestamp: '2026-06-18T10:30:00Z',
        }}
      />
    );

    expect(screen.getByRole('region', { name: /Fund settlement status: Funds released/i })).toBeInTheDocument();
    expect(screen.getByText('USDC was released to the success destination.')).toBeInTheDocument();
    expect(screen.getByLabelText('Destination address GSUCCESSDESTINATION1234567890')).toHaveTextContent('GSUCCE...7890');
    expect(screen.getByText('4,200.5 USDC')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Stellar Testnet explorer/i })).toHaveAttribute(
      'href',
      'https://stellar.expert/explorer/testnet/tx/abcdef1234567890abcdef1234567890'
    );
  });

  it('renders redirected settlement with danger semantics and public explorer link', () => {
    mockNetwork = 'PUBLIC';

    render(
      <FundReleaseStatus
        outcome="redirected"
        destinationAddress="GFAILUREDESTINATION1234567890"
        amount={8800}
        currency="USDC"
        transaction={{
          hash: 'redirecthash1234567890',
          timestamp: '2026-06-18T11:00:00Z',
        }}
      />
    );

    const panel = screen.getByRole('region', { name: /Fund settlement status: Funds redirected/i });
    expect(panel).toHaveClass('fund-release-status--redirected');
    expect(screen.getByText('USDC was redirected to the failure destination.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Stellar Public explorer/i })).toHaveAttribute(
      'href',
      'https://stellar.expert/explorer/public/tx/redirecthash1234567890'
    );
  });

  it('renders pending settlement without relying on color alone', () => {
    render(<FundReleaseStatus outcome="pending" amount={12500} currency="USDC" />);

    const panel = screen.getByRole('region', { name: /Fund settlement status: Settlement pending/i });
    expect(panel).toHaveClass('fund-release-status--pending');
    expect(screen.getByText('Settlement pending')).toBeInTheDocument();
    expect(screen.getByText(/Settlement transaction details will appear/)).toBeInTheDocument();
  });

  it('handles missing transaction details for final outcomes', () => {
    render(
      <FundReleaseStatus
        outcome="released"
        destinationAddress="GSUCCESSDESTINATION1234567890"
        amount={100}
        currency="USDC"
      />
    );

    expect(screen.getByText('Pending confirmation')).toBeInTheDocument();
    expect(screen.getByText('Pending transaction')).toBeInTheDocument();
  });

  it('handles a missing destination address for final outcomes', () => {
    render(
      <FundReleaseStatus
        outcome="redirected"
        amount={50}
        currency="USDC"
        transaction={{ hash: 'hashwithdestinationmissing' }}
      />
    );

    expect(screen.getByText('Not available')).toBeInTheDocument();
  });
});
