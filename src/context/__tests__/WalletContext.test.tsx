import { act, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { WalletProvider, useWallet } from '../WalletContext';
import { fetchUsdcBalance } from '../../utils/horizon';

vi.mock('@stellar/freighter-api', () => ({
  isAllowed: vi.fn(),
  setAllowed: vi.fn(),
  requestAccess: vi.fn(),
  getAddress: vi.fn(),
  getNetworkDetails: vi.fn(),
}));

vi.mock('../../utils/horizon', () => ({
  fetchUsdcBalance: vi.fn(),
}));

import { isAllowed, setAllowed, requestAccess, getAddress, getNetworkDetails } from '@stellar/freighter-api';

function WalletProbe() {
  const wallet = useWallet();
  return (
    <div>
      <div data-testid="address">{wallet.address ?? 'none'}</div>
      <div data-testid="network">{wallet.network ?? 'none'}</div>
      <div data-testid="balance">{wallet.balance ?? 'none'}</div>
      <div data-testid="balance-status">{wallet.balanceStatus}</div>
      <div data-testid="balance-error">{wallet.balanceError ?? 'none'}</div>
      <div data-testid="connect-error">{wallet.error ?? 'none'}</div>
      <div data-testid="connecting">{wallet.isConnecting ? 'yes' : 'no'}</div>
      <div data-testid="trustline">{wallet.hasUsdcTrustline ? 'yes' : 'no'}</div>
      <button onClick={() => void wallet.checkConnection()}>check</button>
      <button onClick={() => void wallet.connect()}>connect</button>
      <button onClick={wallet.disconnect}>disconnect</button>
    </div>
  );
}

function WalletConsumerWithoutProvider() {
  useWallet();
  return null;
}

const mockIsAllowed = vi.mocked(isAllowed);
const mockSetAllowed = vi.mocked(setAllowed);
const mockRequestAccess = vi.mocked(requestAccess);
const mockGetAddress = vi.mocked(getAddress);
const mockGetNetworkDetails = vi.mocked(getNetworkDetails);
const mockFetchUsdcBalance = vi.mocked(fetchUsdcBalance);

describe('WalletContext balance loading', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsAllowed.mockResolvedValue({ isAllowed: false });
    mockSetAllowed.mockResolvedValue({ isAllowed: true });
    mockRequestAccess.mockResolvedValue({ address: 'GABC' });
    mockGetAddress.mockResolvedValue({ address: 'GABC', error: '' });
    mockGetNetworkDetails.mockResolvedValue({
      network: 'TESTNET',
      networkUrl: '',
      networkPassphrase: '',
      sorobanRpcUrl: '',
    });
    mockFetchUsdcBalance.mockResolvedValue({ balance: '12.3400000', hasTrustline: true });
  });

  test('loads network-aware USDC balance for an allowed wallet', async () => {
    mockIsAllowed.mockResolvedValue({ isAllowed: true });
    render(
      <WalletProvider>
        <WalletProbe />
      </WalletProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('balance-status')).toHaveTextContent('loaded'));

    expect(screen.getByTestId('address')).toHaveTextContent('GABC');
    expect(screen.getByTestId('network')).toHaveTextContent('TESTNET');
    expect(screen.getByTestId('balance')).toHaveTextContent('12.3400000');
    expect(screen.getByTestId('trustline')).toHaveTextContent('yes');
    expect(mockFetchUsdcBalance).toHaveBeenCalledWith('GABC', 'TESTNET');
  });

  test('surfaces no-trustline zero balance state', async () => {
    mockIsAllowed.mockResolvedValue({ isAllowed: true });
    mockFetchUsdcBalance.mockResolvedValue({ balance: '0.00', hasTrustline: false });
    render(
      <WalletProvider>
        <WalletProbe />
      </WalletProvider>,
    );

    await act(async () => {
      screen.getByRole('button', { name: 'check' }).click();
    });

    await waitFor(() => expect(screen.getByTestId('balance-status')).toHaveTextContent('loaded'));
    expect(screen.getByTestId('balance')).toHaveTextContent('0.00');
    expect(screen.getByTestId('trustline')).toHaveTextContent('no');
  });

  test('stores a recoverable balance error when Horizon fails', async () => {
    mockIsAllowed.mockResolvedValue({ isAllowed: true });
    mockFetchUsdcBalance.mockRejectedValue(new Error('Horizon down'));
    render(
      <WalletProvider>
        <WalletProbe />
      </WalletProvider>,
    );

    await act(async () => {
      screen.getByRole('button', { name: 'check' }).click();
    });

    await waitFor(() => expect(screen.getByTestId('balance-status')).toHaveTextContent('error'));
    expect(screen.getByTestId('balance')).toHaveTextContent('none');
    expect(screen.getByTestId('balance-error')).toHaveTextContent('Unable to load USDC balance from Horizon.');
  });

  test('connect requests Freighter access and stores the loaded balance', async () => {
    mockIsAllowed.mockResolvedValue({ isAllowed: true });
    render(
      <WalletProvider>
        <WalletProbe />
      </WalletProvider>,
    );

    await act(async () => {
      screen.getByRole('button', { name: 'connect' }).click();
    });

    await waitFor(() => expect(screen.getByTestId('balance-status')).toHaveTextContent('loaded'));
    expect(mockSetAllowed).toHaveBeenCalled();
    expect(mockRequestAccess).toHaveBeenCalled();
    expect(screen.getByTestId('connecting')).toHaveTextContent('no');
    expect(screen.getByTestId('connect-error')).toHaveTextContent('none');
  });

  test('connect surfaces Freighter address errors', async () => {
    mockGetAddress.mockResolvedValue({ address: '', error: 'No public key available.' });
    render(
      <WalletProvider>
        <WalletProbe />
      </WalletProvider>,
    );

    await act(async () => {
      screen.getByRole('button', { name: 'connect' }).click();
    });

    await waitFor(() => expect(screen.getByTestId('connect-error')).toHaveTextContent('No public key available.'));
    expect(screen.getByTestId('address')).toHaveTextContent('none');
  });

  test('connect handles denied Freighter access', async () => {
    mockRequestAccess.mockResolvedValueOnce({ address: '', error: 'User rejected access' } as never);
    render(
      <WalletProvider>
        <WalletProbe />
      </WalletProvider>,
    );

    await act(async () => {
      screen.getByRole('button', { name: 'connect' }).click();
    });

    await waitFor(() => expect(screen.getByTestId('connect-error')).toHaveTextContent('User rejected access'));
    expect(screen.getByTestId('connecting')).toHaveTextContent('no');
  });

  test('connect surfaces thrown Freighter errors', async () => {
    mockSetAllowed.mockRejectedValueOnce(new Error('Freighter locked'));
    render(
      <WalletProvider>
        <WalletProbe />
      </WalletProvider>,
    );

    await act(async () => {
      screen.getByRole('button', { name: 'connect' }).click();
    });

    await waitFor(() => expect(screen.getByTestId('connect-error')).toHaveTextContent('Freighter locked'));
    expect(screen.getByTestId('connecting')).toHaveTextContent('no');
  });

  test('checkConnection handles Freighter status errors without changing wallet state', async () => {
    mockIsAllowed.mockRejectedValueOnce(new Error('Freighter status unavailable'));
    render(
      <WalletProvider>
        <WalletProbe />
      </WalletProvider>,
    );

    await waitFor(() => expect(mockIsAllowed).toHaveBeenCalled());
    expect(screen.getByTestId('address')).toHaveTextContent('none');
    expect(screen.getByTestId('balance-status')).toHaveTextContent('idle');
  });

  test('disconnect clears wallet and balance state', async () => {
    mockIsAllowed.mockResolvedValue({ isAllowed: true });
    render(
      <WalletProvider>
        <WalletProbe />
      </WalletProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('balance-status')).toHaveTextContent('loaded'));
    act(() => {
      screen.getByRole('button', { name: 'disconnect' }).click();
    });

    expect(screen.getByTestId('address')).toHaveTextContent('none');
    expect(screen.getByTestId('network')).toHaveTextContent('none');
    expect(screen.getByTestId('balance')).toHaveTextContent('none');
    expect(screen.getByTestId('balance-status')).toHaveTextContent('idle');
    expect(screen.getByTestId('balance-error')).toHaveTextContent('none');
    expect(screen.getByTestId('trustline')).toHaveTextContent('no');
  });

  test('useWallet throws outside WalletProvider', () => {
    expect(() => render(<WalletConsumerWithoutProvider />)).toThrow('useWallet must be used within a WalletProvider');
  });
});
