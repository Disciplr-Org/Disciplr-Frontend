import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

async function renderTransactions() {
  const { default: VaultTransactions } = await import('../VaultTransactions');
  return render(<VaultTransactions />);
}

describe('VaultTransactions filters', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-24T12:00:00.000Z'));
    vi.resetModules();
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('filters transactions by status without showing an unrelated empty section', async () => {
    await renderTransactions();

    fireEvent.change(screen.getByLabelText('Filter transactions by status'), {
      target: { value: 'failed' },
    });

    expect(screen.getByText('Partial release')).toBeInTheDocument();
    expect(screen.queryByText('Initial deposit')).not.toBeInTheDocument();
    expect(screen.queryByText('No matching transactions')).not.toBeInTheDocument();
    expect(screen.getByText('1 matching')).toBeInTheDocument();
  });

  it('filters transactions by type', async () => {
    await renderTransactions();

    fireEvent.change(screen.getByLabelText('Filter transactions by type'), {
      target: { value: 'redirect' },
    });

    expect(screen.getByText('Redirect to escrow')).toBeInTheDocument();
    expect(screen.getByText('Reallocation')).toBeInTheDocument();
    expect(screen.queryByText('Initial deposit')).not.toBeInTheDocument();
    expect(screen.getByText('2 matching')).toBeInTheDocument();
  });

  it('applies date ranges and shows the clearable empty state', async () => {
    await renderTransactions();

    fireEvent.change(screen.getByLabelText('Filter transactions from date'), {
      target: { value: '2026-06-25' },
    });

    expect(screen.getByText('No matching transactions')).toBeInTheDocument();
    expect(screen.getByText('0 matching')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /clear filters/i }));

    expect(screen.queryByText('No matching transactions')).not.toBeInTheDocument();
    expect(screen.getByText('10 matching')).toBeInTheDocument();
  });

  it('returns no rows when the date range starts after it ends', async () => {
    await renderTransactions();

    fireEvent.change(screen.getByLabelText('Filter transactions from date'), {
      target: { value: '2026-06-25' },
    });
    fireEvent.change(screen.getByLabelText('Filter transactions to date'), {
      target: { value: '2026-06-20' },
    });

    expect(screen.getByText('No matching transactions')).toBeInTheDocument();
    expect(screen.queryByText('Q3 release')).not.toBeInTheDocument();
  });
});
