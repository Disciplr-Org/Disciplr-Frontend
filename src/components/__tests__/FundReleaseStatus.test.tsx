import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FundReleaseStatus, truncateMiddle } from '../FundReleaseStatus';

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

describe('truncateMiddle', () => {
  it('truncates long values and leaves short values untouched', () => {
    expect(truncateMiddle('GABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890')).toBe('GABCDE...7890');
    expect(truncateMiddle('GSHORT')).toBe('GSHORT');
  });
});

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

  it('throws invariant error for missing transaction details on released outcome', () => {
    render(
      <FundReleaseStatus
        outcome="released"
        destinationAddress="GSUCCESSDESTINATION1234567890"
        amount={100}
        currency="USDC"
      />
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Cannot load settlement status')).toBeInTheDocument();
    expect(screen.getByText(/Settlement transaction details are required for released funds/)).toBeInTheDocument();
  });

  it('throws invariant error for pending outcome with transaction details', () => {
    render(
      <FundReleaseStatus
        outcome="pending"
        amount={100}
        currency="USDC"
        transaction={{ hash: 'hash', timestamp: 'time' }}
      />
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/Pending settlement cannot have transaction details/)).toBeInTheDocument();
  });

  it('renders loading state', () => {
    render(
      <FundReleaseStatus
        outcome="pending"
        amount={100}
        currency="USDC"
        isLoading
      />
    );

    expect(screen.getByText('Loading settlement status...')).toBeInTheDocument();
  });

  it('handles a missing destination address for final outcomes when transaction exists', () => {
    render(
      <FundReleaseStatus
        outcome="redirected"
        amount={50}
        currency="USDC"
        transaction={{ hash: 'hash', timestamp: 'time' }}
      />
    );

    expect(screen.getByText('Not available')).toBeInTheDocument();
  });

  describe("outcome state accessible labels", () => {
    it("released outcome has accessible region label", () => {
      render(
        <FundReleaseStatus
          outcome="released"
          destinationAddress="GSUCCESSDESTINATION1234567890"
          amount={100}
          currency="XLM"
        />
      );
      expect(screen.getByRole('region', { name: /Fund settlement status/i })).toBeInTheDocument();
    });

    it("redirected outcome has accessible region label", () => {
      render(<FundReleaseStatus outcome="redirected" amount={50} currency="XLM" />);
      expect(screen.getByRole('region', { name: /Fund settlement status/i })).toBeInTheDocument();
    });

    it("pending outcome has accessible region label", () => {
      render(<FundReleaseStatus outcome="pending" amount={200} currency="XLM" />);
      expect(screen.getByRole('region', { name: /Fund settlement status/i })).toBeInTheDocument();
    });

    it("each outcome applies a distinct CSS modifier class", () => {
      const { rerender } = render(<FundReleaseStatus outcome="pending" amount={1} currency="XLM" />);
      expect(document.querySelector('.fund-release-status--pending')).not.toBeNull();

      rerender(<FundReleaseStatus outcome="released" amount={1} currency="XLM" />);
      expect(document.querySelector('.fund-release-status--released')).not.toBeNull();

      rerender(<FundReleaseStatus outcome="redirected" amount={1} currency="XLM" />);
      expect(document.querySelector('.fund-release-status--redirected')).not.toBeNull();
    });
  });
});
