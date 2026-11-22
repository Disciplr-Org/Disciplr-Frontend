import { act, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Transactions from '../Transactions';
import { listAllActivity, type VaultActivityRecord } from '../../services/vaultService';
import { useConnectivityStore } from '../../services/connectivity';

vi.mock('../../services/vaultService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../services/vaultService')>();
  return {
    ...actual,
    listAllActivity: vi.fn(),
  };
});

const mockListAllActivity = vi.mocked(listAllActivity);

function makeRecord(overrides: Partial<VaultActivityRecord> = {}): VaultActivityRecord {
  return {
    id: 'act-1',
    type: 'create',
    vault: 'Alpha Vault',
    amount: 100,
    fee: 0.01,
    block: 1,
    hash: '0x1234567890abcdef',
    status: 'confirmed',
    from: 'GFROM',
    to: 'GTO',
    timestamp: new Date(1000),
    memo: '',
    ...overrides,
  };
}

function renderTransactions() {
  return render(
    <MemoryRouter>
      <Transactions />
    </MemoryRouter>
  );
}

describe('Transactions page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useConnectivityStore.getState().reset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    useConnectivityStore.getState().reset();
  });

  it('shows loading text while listAllActivity is pending', () => {
    mockListAllActivity.mockImplementation(() => new Promise(() => {}));

    renderTransactions();

    const loading = screen.getByText('Loading activity...');
    expect(loading).toBeInTheDocument();
    expect(loading).toHaveAttribute('aria-live', 'polite');
  });

  it('shows error message in an alert when listAllActivity rejects', async () => {
    mockListAllActivity.mockRejectedValueOnce(new Error('boom'));

    renderTransactions();

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('boom');
  });

  it('shows create-vault link to /vaults/create when activity is empty', async () => {
    mockListAllActivity.mockResolvedValueOnce([]);

    renderTransactions();

    const link = await screen.findByRole('link', { name: 'Create a vault' });
    expect(link).toHaveAttribute('href', '/vaults/create');
  });

  it('renders rows newest first regardless of input order', async () => {
    const older = makeRecord({ id: 'old', vault: 'Older Vault', timestamp: new Date(1) });
    const newer = makeRecord({ id: 'new', vault: 'Newer Vault', timestamp: new Date(2) });
    mockListAllActivity.mockResolvedValueOnce([older, newer]);

    renderTransactions();

    await screen.findByText('Newer Vault');
    const rows = screen.getAllByRole('row');
    expect(rows[1]).toHaveTextContent('Newer Vault');
    expect(rows[2]).toHaveTextContent('Older Vault');
  });

  it('re-triggers loading when connectivity recovers', async () => {
    vi.stubEnv('VITE_API', 'https://api.disciplr.test');
    useConnectivityStore.getState().setStatus('offline');

    mockListAllActivity.mockRejectedValueOnce(new Error('Network error'));

    renderTransactions();

    expect(await screen.findByRole('alert')).toHaveTextContent('Network error');
    expect(mockListAllActivity).toHaveBeenCalledTimes(1);

    mockListAllActivity.mockResolvedValueOnce([
      makeRecord({ id: 'recovered', vault: 'Recovered Vault', timestamp: new Date(3) }),
    ]);

    act(() => {
      useConnectivityStore.getState().setStatus('online');
    });

    await waitFor(() => {
      expect(screen.getByText('Recovered Vault')).toBeInTheDocument();
    });
    expect(mockListAllActivity).toHaveBeenCalledTimes(2);
  });
});
