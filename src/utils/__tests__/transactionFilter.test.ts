import { describe, expect, it } from 'vitest';
import {
  filterTransactions,
  type FilterableTransaction,
} from '../transactionFilter';

interface TestTransaction extends FilterableTransaction {
  id: string;
}

const transactions: TestTransaction[] = [
  {
    id: 'create-confirmed',
    type: 'create',
    status: 'confirmed',
    timestamp: new Date(2026, 5, 10, 0, 0, 0, 0),
  },
  {
    id: 'release-failed',
    type: 'release',
    status: 'failed',
    timestamp: new Date(2026, 5, 11, 12, 30, 0, 0),
  },
  {
    id: 'redirect-pending',
    type: 'redirect',
    status: 'pending',
    timestamp: new Date(2026, 5, 12, 23, 59, 59, 0),
  },
  {
    id: 'validate-confirmed',
    type: 'validate',
    status: 'confirmed',
    timestamp: new Date(2026, 5, 13, 8, 0, 0, 0),
  },
];

const ids = (items: TestTransaction[]) => items.map((item) => item.id);

describe('filterTransactions', () => {
  it('filters by status and type', () => {
    expect(ids(filterTransactions(transactions, { type: 'all', status: 'failed' }))).toEqual([
      'release-failed',
    ]);
    expect(ids(filterTransactions(transactions, { type: 'validate', status: 'all' }))).toEqual([
      'validate-confirmed',
    ]);
  });

  it('combines status and type filters', () => {
    expect(ids(filterTransactions(transactions, { type: 'release', status: 'failed' }))).toEqual([
      'release-failed',
    ]);
    expect(filterTransactions(transactions, { type: 'release', status: 'pending' })).toEqual([]);
  });

  it('applies inclusive date range bounds', () => {
    expect(
      ids(
        filterTransactions(transactions, {
          type: 'all',
          status: 'all',
          startDate: '2026-06-10',
          endDate: '2026-06-12',
        }),
      ),
    ).toEqual(['create-confirmed', 'release-failed', 'redirect-pending']);
  });

  it('returns no matches when start date is after end date', () => {
    expect(
      filterTransactions(transactions, {
        type: 'all',
        status: 'all',
        startDate: '2026-06-14',
        endDate: '2026-06-10',
      }),
    ).toEqual([]);
  });

  it('ignores invalid filter dates without throwing', () => {
    expect(
      ids(
        filterTransactions(transactions, {
          type: 'all',
          status: 'all',
          startDate: 'not-a-date',
          endDate: '2026-99-99',
        }),
      ),
    ).toEqual(['create-confirmed', 'release-failed', 'redirect-pending', 'validate-confirmed']);
  });

  it('excludes transactions with invalid timestamps when date checks run', () => {
    const withInvalidTimestamp: TestTransaction[] = [
      ...transactions,
      {
        id: 'invalid',
        type: 'create',
        status: 'confirmed',
        timestamp: 'not-a-date',
      },
    ];

    expect(ids(filterTransactions(withInvalidTimestamp, { type: 'all', status: 'all' }))).toEqual([
      'create-confirmed',
      'release-failed',
      'redirect-pending',
      'validate-confirmed',
    ]);
  });
});
