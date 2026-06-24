import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

let VaultTransactions: typeof import('../VaultTransactions').default;

beforeAll(async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-06-24T12:00:00Z'));
  ({ default: VaultTransactions } = await import('../VaultTransactions'));
});

afterAll(() => {
  vi.useRealTimers();
});

function renderVaultTransactions() {
  return render(<VaultTransactions />);
}

describe('VaultTransactions metadata and truncation', () => {
  it('renders every transaction type label from the metadata map', () => {
    renderVaultTransactions();

    expect(screen.getAllByText('Create').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Validate').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Release').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Redirect').length).toBeGreaterThan(0);
  });

  it('renders every transaction status label from the metadata map', () => {
    renderVaultTransactions();

    expect(screen.getAllByText('Confirmed').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Pending').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Failed').length).toBeGreaterThan(0);
  });

  it('renders deterministic relative timestamps and truncated hashes from the mock transaction data', () => {
    renderVaultTransactions();

    expect(screen.getByText('2m ago')).toBeInTheDocument();
    expect(screen.getByText('5m ago')).toBeInTheDocument();
    expect(screen.getByText('10m ago')).toBeInTheDocument();
    expect(screen.getByText('d4e5f6a7...c3d4e5')).toBeInTheDocument();
    expect(screen.getByText('b2c3d4e5...a1b2c3')).toBeInTheDocument();
  });

  it('opens a transaction detail view with the full hash and known truncated account fields', () => {
    const { container } = renderVaultTransactions();

    fireEvent.click(screen.getByText('"Q3 release"'));

    const modal = container.querySelector('.vt-modal');
    expect(modal).not.toBeNull();

    const modalQueries = within(modal as HTMLElement);
    expect(
      modalQueries.getByText('d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5'),
    ).toBeInTheDocument();
    expect(modalQueries.getByText('GCVAULT...M3P')).toBeInTheDocument();
    expect(modalQueries.getByText('GBVZ3...QK7L')).toBeInTheDocument();
  });

  it('filters to a type and status combination without dropping its metadata label', () => {
    renderVaultTransactions();

    const [typeFilter, , statusFilter] = screen.getAllByRole('combobox');
    fireEvent.change(typeFilter, { target: { value: 'redirect' } });
    fireEvent.change(statusFilter, { target: { value: 'pending' } });

    expect(screen.getAllByText('Redirect')).toHaveLength(2);
    expect(screen.getAllByText('Pending').length).toBeGreaterThanOrEqual(2);
    expect(screen.queryByText('Release')).not.toBeInTheDocument();
  });
});
