import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useWallet } from '../../../context/WalletContext';
import { WalletConnectButton } from '../WalletConnectButton';
import { WalletDropdown } from '../WalletDropdown';

vi.mock('../../../context/WalletContext', () => ({
  useWallet: vi.fn(),
}));

const mockUseWallet = vi.mocked(useWallet);

const defaultWallet = {
  address: null as string | null,
  network: null as 'TESTNET' | 'PUBLIC' | null,
  balance: null as string | null,
  isConnecting: false,
  error: null as string | null,
  connect: vi.fn().mockResolvedValue(undefined),
  disconnect: vi.fn(),
  checkConnection: vi.fn().mockResolvedValue(undefined),
};

function setWallet(overrides: Partial<typeof defaultWallet> = {}) {
  const wallet = {
    ...defaultWallet,
    connect: vi.fn().mockResolvedValue(undefined),
    disconnect: vi.fn(),
    checkConnection: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };

  mockUseWallet.mockReturnValue(wallet);
  return wallet;
}

describe('WalletConnectButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('open', vi.fn());
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  it('opens the wallet selection modal from the disconnected state', () => {
    setWallet();

    render(<WalletConnectButton />);

    fireEvent.click(screen.getByRole('button', { name: /connect wallet/i }));

    expect(screen.getByRole('heading', { name: 'Connect Wallet' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Freighter/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Albedo/i })).toBeInTheDocument();
  });

  it('calls connect and closes the modal after selecting Freighter', async () => {
    const wallet = setWallet();

    render(<WalletConnectButton />);

    fireEvent.click(screen.getByRole('button', { name: /connect wallet/i }));
    fireEvent.click(screen.getByRole('button', { name: /Freighter/i }));

    expect(wallet.connect).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: 'Connect Wallet' })).not.toBeInTheDocument();
    });
  });

  it('renders wallet error state inside the selection modal', () => {
    setWallet({ error: 'Freighter is locked. Unlock it and try again.' });

    render(<WalletConnectButton />);

    fireEvent.click(screen.getByRole('button', { name: /connect wallet/i }));

    expect(screen.getByText('Freighter is locked. Unlock it and try again.')).toBeInTheDocument();
  });

  it('renders the connected address, network badge, and dropdown details', () => {
    setWallet({
      address: 'GBVZ3KQKM4XNQPBEZMXPOLKQKM4XNQPBEZMXPOLKQK7L',
      network: 'TESTNET',
      balance: '42.50',
    });

    render(<WalletConnectButton />);

    fireEvent.click(screen.getByRole('button', { name: /GBVZ\.\.\.QK7LTestnet/i }));

    const menu = screen.getByText('View on Stellar Explorer').closest('.wallet-dropdown-menu') as HTMLElement;
    expect(screen.getByText('GBVZ...QK7L')).toBeInTheDocument();
    expect(within(menu).getByText('GBVZ3K...QK7L')).toBeInTheDocument();
    expect(within(menu).getByText('42.50')).toBeInTheDocument();
    expect(within(menu).getByText('USDC')).toBeInTheDocument();
  });

  it('closes the dropdown on outside mousedown', () => {
    setWallet({
      address: 'GBVZ3KQKM4XNQPBEZMXPOLKQKM4XNQPBEZMXPOLKQK7L',
      network: 'PUBLIC',
    });

    render(
      <div>
        <WalletConnectButton />
        <button>Outside target</button>
      </div>
    );

    fireEvent.click(screen.getByRole('button', { name: /GBVZ\.\.\.QK7LMainnet/i }));
    expect(screen.getByText('Disconnect')).toBeInTheDocument();

    fireEvent.mouseDown(screen.getByRole('button', { name: 'Outside target' }));

    expect(screen.queryByText('Disconnect')).not.toBeInTheDocument();
  });

  it('disconnects from the dropdown and closes it', () => {
    const wallet = setWallet({
      address: 'GBVZ3KQKM4XNQPBEZMXPOLKQKM4XNQPBEZMXPOLKQK7L',
      network: 'TESTNET',
    });

    render(<WalletConnectButton />);

    fireEvent.click(screen.getByRole('button', { name: /GBVZ\.\.\.QK7LTestnet/i }));
    fireEvent.click(screen.getByRole('button', { name: /disconnect/i }));

    expect(wallet.disconnect).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Disconnect')).not.toBeInTheDocument();
  });

  it('switches from the dropdown back to the wallet selection modal', () => {
    setWallet({
      address: 'GBVZ3KQKM4XNQPBEZMXPOLKQKM4XNQPBEZMXPOLKQK7L',
      network: 'TESTNET',
    });

    render(<WalletConnectButton />);

    fireEvent.click(screen.getByRole('button', { name: /GBVZ\.\.\.QK7LTestnet/i }));
    fireEvent.click(screen.getByRole('button', { name: /switch wallet/i }));

    expect(screen.queryByText('Disconnect')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Connect Wallet' })).toBeInTheDocument();
  });

  it('copies the address from the dropdown', async () => {
    setWallet({
      address: 'GBVZ3KQKM4XNQPBEZMXPOLKQKM4XNQPBEZMXPOLKQK7L',
      network: 'TESTNET',
    });

    render(<WalletConnectButton />);

    fireEvent.click(screen.getByRole('button', { name: /GBVZ\.\.\.QK7LTestnet/i }));
    fireEvent.click(screen.getByRole('button', { name: /copy address/i }));

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        'GBVZ3KQKM4XNQPBEZMXPOLKQKM4XNQPBEZMXPOLKQK7L'
      );
    });
  });

  it('logs clipboard failures without closing the dropdown', async () => {
    const copyError = new Error('Clipboard unavailable');
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: vi.fn().mockRejectedValue(copyError),
      },
    });
    setWallet({
      address: 'GBVZ3KQKM4XNQPBEZMXPOLKQKM4XNQPBEZMXPOLKQK7L',
      network: 'TESTNET',
    });

    render(<WalletConnectButton />);

    fireEvent.click(screen.getByRole('button', { name: /GBVZ\.\.\.QK7LTestnet/i }));
    fireEvent.click(screen.getByRole('button', { name: /copy address/i }));

    await waitFor(() => {
      expect(consoleError).toHaveBeenCalledWith('Failed to copy', copyError);
    });
    expect(screen.getByText('Disconnect')).toBeInTheDocument();
  });

  it('opens the correct Stellar explorer for the active network', () => {
    setWallet({
      address: 'GBVZ3KQKM4XNQPBEZMXPOLKQKM4XNQPBEZMXPOLKQK7L',
      network: 'PUBLIC',
    });

    render(<WalletConnectButton />);

    fireEvent.click(screen.getByRole('button', { name: /GBVZ\.\.\.QK7LMainnet/i }));
    fireEvent.click(screen.getByRole('button', { name: /view on stellar explorer/i }));

    expect(window.open).toHaveBeenCalledWith(
      'https://stellar.expert/explorer/public/account/GBVZ3KQKM4XNQPBEZMXPOLKQKM4XNQPBEZMXPOLKQK7L',
      '_blank'
    );
  });

  it('uses the testnet Stellar explorer when connected to testnet', () => {
    setWallet({
      address: 'GBVZ3KQKM4XNQPBEZMXPOLKQKM4XNQPBEZMXPOLKQK7L',
      network: 'TESTNET',
    });

    render(<WalletConnectButton />);

    fireEvent.click(screen.getByRole('button', { name: /GBVZ\.\.\.QK7LTestnet/i }));
    fireEvent.click(screen.getByRole('button', { name: /view on stellar explorer/i }));

    expect(window.open).toHaveBeenCalledWith(
      'https://stellar.expert/explorer/testnet/account/GBVZ3KQKM4XNQPBEZMXPOLKQKM4XNQPBEZMXPOLKQK7L',
      '_blank'
    );
  });

  it('does not render dropdown content when no wallet is connected', () => {
    setWallet();

    const { container } = render(
      <WalletDropdown onClose={vi.fn()} onSwitch={vi.fn()} />
    );

    expect(container).toBeEmptyDOMElement();
  });
});
