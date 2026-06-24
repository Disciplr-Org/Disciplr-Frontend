import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import VaultTransactions, { type Transaction } from '../VaultTransactions';

function makeTransaction(index: number, overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: `tx-${index}`,
    type: 'create',
    vault: `Vault ${index}`,
    amount: 100 + index,
    fee: 0.0001,
    block: 48000000 + index,
    hash: `hash-${index.toString().padStart(3, '0')}-abcdef1234567890`,
    status: 'confirmed',
    from: 'GSOURCE...TEST',
    to: 'GDEST...TEST',
    timestamp: new Date(Date.UTC(2026, 0, 1, 12, 0, 0) - index * 60000),
    memo: '',
    ...overrides,
  };
}

describe('VaultTransactions windowing', () => {
  it('renders every row for small transaction lists', () => {
    const transactions = Array.from({ length: 5 }, (_, index) => makeTransaction(index));
    const { container } = render(
      <VaultTransactions transactions={transactions} windowThreshold={10} rowHeight={64} viewportHeight={128} />,
    );

    expect(screen.queryByText(/Rendering \d+-\d+ of/i)).not.toBeInTheDocument();
    expect(container.querySelectorAll('[data-testid="vault-transaction-row"]')).toHaveLength(5);
    expect(screen.getByText('Vault 0')).toBeInTheDocument();
    expect(screen.getByText('Vault 4')).toBeInTheDocument();
  });

  it('renders only the visible window for large confirmed transaction lists', () => {
    const transactions = Array.from({ length: 80 }, (_, index) => makeTransaction(index));
    const { container } = render(
      <VaultTransactions
        transactions={transactions}
        windowThreshold={10}
        rowHeight={64}
        viewportHeight={128}
        overscan={1}
      />,
    );

    expect(screen.getByText('Rendering 1-3 of 80')).toBeInTheDocument();
    expect(container.querySelectorAll('[data-testid="vault-transaction-row"]')).toHaveLength(3);
    expect(screen.getByText('Vault 0')).toBeInTheDocument();
    expect(screen.queryByText('Vault 79')).not.toBeInTheDocument();
  });

  it('updates the rendered transaction window on scroll', () => {
    const transactions = Array.from({ length: 80 }, (_, index) => makeTransaction(index));
    render(
      <VaultTransactions
        transactions={transactions}
        windowThreshold={10}
        rowHeight={64}
        viewportHeight={128}
        overscan={1}
      />,
    );

    fireEvent.scroll(screen.getByTestId('confirmed-transaction-list'), {
      target: { scrollTop: 640 },
    });

    expect(screen.getByText('Rendering 10-13 of 80')).toBeInTheDocument();
    expect(screen.getByText('Vault 9')).toBeInTheDocument();
    expect(screen.getByText('Vault 12')).toBeInTheDocument();
    expect(screen.queryByText('Vault 0')).not.toBeInTheDocument();
  });
});
