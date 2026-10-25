import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CreateVault from '../CreateVault';
import {
  ACCOUNT_A,
  ACCOUNT_B,
  ACCOUNT_C,
  ACCOUNT_D,
} from '@/__tests__/fixtures/stellarAddresses';

// Wallet state is a shared mutable object so tests can switch the reported
// Freighter network without remounting.
const walletState = vi.hoisted(() => ({
  status: 'connected' as string,
  isConnecting: false,
  isDemo: false,
  address: null as string | null,
  network: null as 'TESTNET' | 'PUBLIC' | null,
  balance: '10000',
  balanceStatus: 'success',
  error: null,
  connect: vi.fn(async () => true),
  disconnect: vi.fn(),
  checkConnection: vi.fn(async () => {}),
}));

vi.mock('../../context/WalletContext', () => ({
  useWallet: () => walletState,
  useOptionalWallet: () => walletState,
}));

const mockCreateVault = vi.hoisted(() => vi.fn());

vi.mock('../../services/vaultService', async () => {
  const actual = await vi.importActual('../../services/vaultService');
  return {
    ...actual,
    createVault: mockCreateVault,
  };
});

function enterValidDetails() {
  fireEvent.change(screen.getByLabelText('Vault name'), {
    target: { value: 'Guard Test Vault' },
  });
  fireEvent.change(screen.getByLabelText(/amount/i), {
    target: { value: '100' },
  });
  fireEvent.change(screen.getByLabelText(/deadline/i), {
    target: { value: '2030-01-01T12:00' },
  });
  fireEvent.change(screen.getByLabelText(/success destination/i), {
    target: { value: ACCOUNT_B },
  });
  fireEvent.change(screen.getByLabelText(/failure destination/i), {
    target: { value: ACCOUNT_C },
  });
  fireEvent.change(screen.getByLabelText('Verifier address'), {
    target: { value: ACCOUNT_D },
  });
}

function renderCreateVault() {
  return render(
    <MemoryRouter initialEntries={['/vaults/create']}>
      <CreateVault />
    </MemoryRouter>,
  );
}

describe('CreateVault write guard (network mismatch)', () => {
  beforeEach(() => {
    walletState.address = ACCOUNT_A;
    walletState.network = 'TESTNET';
    walletState.status = 'connected';
    walletState.isConnecting = false;
    walletState.isDemo = false;
    mockCreateVault.mockClear();
  });

  it('disables Confirm Vault and explains why, and never calls the service even when the form is fired', async () => {
    // Wallet reports PUBLIC while the app is pinned to TESTNET.
    walletState.network = 'PUBLIC';

    renderCreateVault();

    enterValidDetails();

    // Force the write path by firing the actual form submit.
    fireEvent.click(screen.getByRole('button', { name: /^create vault$/i }));

    // The review step opens (validation-only data, no wallet dependency) ...
    const reviewHeading = await screen.findByRole('heading', {
      name: /review vault details/i,
    });
    expect(reviewHeading).toBeInTheDocument();

    // ... but Confirm Vault is disabled with the guard reason as its
    // accessible description.
    const confirmButton = screen.getByRole('button', { name: /confirm vault/i });
    expect(confirmButton).toBeDisabled();
    const describedBy = confirmButton.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();
    const reason = document.getElementById(describedBy ?? '');
    expect(reason).toHaveTextContent(/wrong wallet network/i);
    expect(reason).toHaveTextContent(/Mainnet/);
    expect(reason).toHaveTextContent(/Testnet/);

    // Forcing anything further can never reach the write service.
    fireEvent.click(confirmButton);
    expect(mockCreateVault).not.toHaveBeenCalled();
  });

  it('keeps Confirm Vault enabled when the network matches (guard passes)', async () => {
    renderCreateVault();

    enterValidDetails();
    fireEvent.click(screen.getByRole('button', { name: /^create vault$/i }));

    await screen.findByRole('heading', { name: /review vault details/i });

    const confirmButton = screen.getByRole('button', { name: /confirm vault/i });
    expect(confirmButton).toBeEnabled();
    expect(confirmButton.getAttribute('aria-describedby')).toBeNull();
  });
});
