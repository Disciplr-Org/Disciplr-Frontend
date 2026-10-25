import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import VaultDetail from '../VaultDetail';
import {
  ACCOUNT_A,
  ACCOUNT_C,
  ACCOUNT_D,
} from '@/__tests__/fixtures/stellarAddresses';

const VAULT_ID = 'v-guard-1';

const walletState = vi.hoisted(() => ({
  status: 'connected' as string,
  isConnecting: false,
  isDemo: false,
  address: null as string | null,
  network: null as 'TESTNET' | 'PUBLIC' | null,
  connectDemo: vi.fn(),
  sessionStatus: 'authenticated' as string,
}));

vi.mock('../../context/WalletContext', async () => {
  const actual = await vi.importActual('../../context/WalletContext');
  return {
    ...actual,
    useWallet: () => walletState,
    useOptionalWallet: () => walletState,
  };
});

const mockSubmitVaultAction = vi.hoisted(() => vi.fn());

const guardVault = {
  id: VAULT_ID,
  name: 'Guard Vault',
  status: 'active',
  amount: 100,
  currency: 'USDC',
  createdAt: '2026-01-01T00:00:00.000Z',
  deadline: '2030-01-01T00:00:00.000Z',
  creatorAddress: ACCOUNT_A,
  verifierAddress: ACCOUNT_A,
  successAddress: ACCOUNT_C,
  failureAddress: ACCOUNT_D,
  contractAddress: 'GBVAQKGA5P4TIZSZJBS5AW3XNJOTYG6I3Y5CLIGCBBUZDHMVF7YE7XCQ',
  milestones: [
    {
      id: 'm1',
      title: 'Milestone 1',
      description: 'First deliverable',
      criteria: 'All tests passing',
      status: 'validated',
    },
  ],
  transactions: [],
};

vi.mock('../../services/vaultService', async () => {
  const actual = await vi.importActual('../../services/vaultService');
  return {
    ...actual,
    getVault: vi.fn(() => Promise.resolve(guardVault)),
    submitVaultAction: mockSubmitVaultAction,
  };
});

function renderVaultDetail() {
  return render(
    <MemoryRouter initialEntries={[`/vaults/${VAULT_ID}`]}>
      <Routes>
        <Route path="/vaults/:id" element={<VaultDetail />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('VaultDetail write guard (network mismatch)', () => {
  beforeEach(() => {
    walletState.address = ACCOUNT_A;
    walletState.network = 'TESTNET';
    walletState.status = 'connected';
    walletState.isConnecting = false;
    walletState.isDemo = false;
    walletState.sessionStatus = 'authenticated';
    mockSubmitVaultAction.mockClear();
    mockSubmitVaultAction.mockResolvedValue({ ok: true });
  });

  it('re-checks the guard at submit time: a wallet that flips networks after the modal opens can never reach the service', async () => {
    const { rerender } = renderVaultDetail();

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Guard Vault');
    });

    // Open the confirmation modal while the wallet is still in a good state.
    fireEvent.click(screen.getByRole('button', { name: /Cancel Vault/i }));

    // Now the wallet switches to the wrong network (Freighter on PUBLIC).
    walletState.network = 'PUBLIC';
    rerender(
      <MemoryRouter initialEntries={[`/vaults/${VAULT_ID}`]}>
        <Routes>
          <Route path="/vaults/:id" element={<VaultDetail />} />
        </Routes>
      </MemoryRouter>,
    );

    const dialog = screen.getByRole('dialog');
    const modalConfirm = within(dialog).getByRole('button', {
      name: /cancel vault/i,
    });
    fireEvent.click(modalConfirm);

    expect(mockSubmitVaultAction).not.toHaveBeenCalled();
    expect(await screen.findByText(/Wrong wallet network/i)).toBeInTheDocument();
  });
});
