import { act, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Transactions from '../Transactions';
import { listAllActivity, type VaultActivityRecord } from '../../services/vaultService';
import { useConnectivityStore } from '../../services/connectivity';
import { downloadCsv, toCsv } from '../../utils/csv';

vi.mock('../../services/vaultService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../services/vaultService')>();
  return {
    ...actual,
    listAllActivity: vi.fn(),
  };
});

vi.mock('../../utils/csv', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../utils/csv')>();
  return {
    ...actual,
    downloadCsv: vi.fn(),
  };
});

const mockListAllActivity = vi.mocked(listAllActivity);
const mockDownloadCsv = vi.mocked(downloadCsv);

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
    vi.clearAllMocks();
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

  it('disables the export button when there are zero rows', async () => {
    mockListAllActivity.mockResolvedValueOnce([]);

    renderTransactions();

    await screen.findByRole('link', { name: 'Create a vault' });
    expect(screen.getByRole('button', { name: /export csv/i })).toBeDisabled();
  });

  it('exports the visible rows once with the transactions CSV headers', async () => {
    mockListAllActivity.mockResolvedValueOnce([makeRecord()]);

    renderTransactions();

    const button = await screen.findByRole('button', { name: /export csv/i });
    act(() => {
      button.click();
    });

    expect(mockDownloadCsv).toHaveBeenCalledTimes(1);
    const csv = String(mockDownloadCsv.mock.calls[0]?.[0] ?? '');
    const headerLine = csv.split('\n')[0];
    expect(headerLine).toBe(toCsv([], 'transactions').split('\n')[0]);
  });

  it('neutralises formula-like memos in the export', async () => {
    mockListAllActivity.mockResolvedValueOnce([
      makeRecord({ memo: '=HYPERLINK("x")' }),
    ]);

    renderTransactions();

    const button = await screen.findByRole('button', { name: /export csv/i });
    act(() => {
      button.click();
    });

    const csv = String(mockDownloadCsv.mock.calls[0]?.[0] ?? '');
    expect(csv).toContain("'=HYPERLINK");
  });

  it('renders a valid transaction hash as a Stellar Expert link', async () => {
    const hash = 'a'.repeat(64);
    mockListAllActivity.mockResolvedValueOnce([makeRecord({ hash })]);

    renderTransactions();

    const link = await screen.findByRole('link', { name: /aaaaaaaa/ });
    expect(link.getAttribute('href')).toMatch(
      /^https:\/\/stellar\.expert\/explorer\/testnet\/tx\//
    );
  });

  it('renders no anchor for a path-traversal hash', async () => {
    mockListAllActivity.mockResolvedValueOnce([makeRecord({ hash: '../../x' })]);

    renderTransactions();

    await screen.findByText('Alpha Vault');
    expect(screen.queryByRole('link', { name: /\.\.\/\.\.\/x/ })).toBeNull();
  });

  it('renders an em dash for an undefined hash without throwing', async () => {
    mockListAllActivity.mockResolvedValueOnce([
      makeRecord({ hash: undefined as unknown as string }),
    ]);

    renderTransactions();

    expect(await screen.findByText('—')).toBeInTheDocument();
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
