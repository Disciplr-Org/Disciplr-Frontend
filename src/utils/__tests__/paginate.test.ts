import { describe, expect, it } from 'vitest';
import { filterValidationHistory, paginateCollection } from '../paginate';
import type { ValidationTask } from '../../Zustand/Store';

const history: ValidationTask[] = [
  {
    id: 'v-1',
    vaultName: 'Alpha Vault',
    owner: 'GOWNERALPHA',
    amount: '100 USDC',
    deadline: '2026-01-01',
    daysRemaining: 0,
    status: 'approved',
    milestone: 'Launch',
  },
  {
    id: 'v-2',
    vaultName: 'Beta Vault',
    owner: 'GOWNERBETA',
    amount: '200 USDC',
    deadline: '2026-01-02',
    daysRemaining: 0,
    status: 'rejected',
    milestone: 'Audit',
  },
  {
    id: 'v-3',
    vaultName: 'Gamma Grant',
    owner: 'GOWNERGAMMA',
    amount: '300 USDC',
    deadline: '2026-01-03',
    daysRemaining: 0,
    status: 'approved',
    milestone: 'Docs',
  },
];

describe('filterValidationHistory', () => {
  it('filters by approved or rejected status', () => {
    expect(filterValidationHistory(history, { status: 'approved', search: '' }).map((task) => task.id)).toEqual([
      'v-1',
      'v-3',
    ]);
    expect(filterValidationHistory(history, { status: 'rejected', search: '' }).map((task) => task.id)).toEqual([
      'v-2',
    ]);
  });

  it('searches vault name and owner case-insensitively', () => {
    expect(filterValidationHistory(history, { status: 'all', search: 'gamma' }).map((task) => task.id)).toEqual([
      'v-3',
    ]);
    expect(filterValidationHistory(history, { status: 'all', search: 'ownerbeta' }).map((task) => task.id)).toEqual([
      'v-2',
    ]);
  });

  it('combines status and search filters', () => {
    expect(filterValidationHistory(history, { status: 'approved', search: 'beta' })).toEqual([]);
  });
});

describe('paginateCollection', () => {
  it('returns a clamped page slice', () => {
    const result = paginateCollection(['a', 'b', 'c', 'd', 'e'], 2, 2);

    expect(result).toMatchObject({
      items: ['c', 'd'],
      page: 2,
      pageCount: 3,
      pageSize: 2,
      totalItems: 5,
      startIndex: 2,
      endIndex: 4,
    });
  });

  it('clamps invalid page and page size inputs', () => {
    expect(paginateCollection(['a', 'b'], 99, 0)).toMatchObject({
      items: ['b'],
      page: 2,
      pageSize: 1,
      pageCount: 2,
    });
  });
});
