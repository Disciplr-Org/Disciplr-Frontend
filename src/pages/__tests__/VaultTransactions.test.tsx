import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import VaultTransactions from '../VaultTransactions';

const columnNames = [
  'Transaction',
  'Amount and fee',
  'Status and time',
  'Actions',
];

describe('VaultTransactions', () => {
  it('exposes each transaction group as a named accessible table', () => {
    render(<VaultTransactions />);

    expect(
      screen.getByRole('table', { name: /pending transactions table/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('table', { name: /failed transactions table/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('table', { name: /confirmed transactions table/i }),
    ).toBeInTheDocument();
  });

  it('provides column headers for transaction tables', () => {
    render(<VaultTransactions />);

    const pendingTable = screen.getByRole('table', {
      name: /pending transactions table/i,
    });
    const headers = within(pendingTable).getAllByRole('columnheader');

    expect(headers).toHaveLength(columnNames.length);
    columnNames.forEach((name, index) => {
      expect(
        within(pendingTable).getByRole('columnheader', { name }),
      ).toHaveAttribute('aria-colindex', String(index + 1));
    });
  });

  it('maps transaction rows to cells and labels status in text', () => {
    render(<VaultTransactions />);

    const pendingTable = screen.getByRole('table', {
      name: /pending transactions table/i,
    });
    const rows = within(pendingTable).getAllByRole('row').slice(1);

    expect(rows).toHaveLength(2);
    expect(within(rows[0]).getAllByRole('cell')).toHaveLength(
      columnNames.length,
    );
    expect(within(rows[0]).getByLabelText('Status: Pending')).toHaveTextContent(
      'Pending',
    );
  });
});
