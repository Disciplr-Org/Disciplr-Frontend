import { describe, expect, it } from 'vitest';
import { filterVaults, sortVaults } from '../vaultFilter';
import type { VaultListItem } from '../vaultFilter';

const vaults: VaultListItem[] = [
  {
    id: 'alpha',
    name: 'Alpha Vault',
    amount: 100,
    currency: 'USDC',
    status: 'active',
    deadline: '2026-01-03T00:00:00Z',
  },
  {
    id: 'beta',
    name: 'Beta Reserve',
    amount: 300,
    currency: 'USDC',
    status: 'completed',
    deadline: '2026-01-01T00:00:00Z',
  },
  {
    id: 'gamma',
    name: 'Gamma Vault',
    amount: 200,
    currency: 'USDC',
    status: 'active',
    deadline: '2026-01-02T00:00:00Z',
  },
];

describe('filterVaults', () => {
  it('filters by status', () => {
    expect(filterVaults(vaults, { status: 'active', query: '' }).map((vault) => vault.id)).toEqual([
      'alpha',
      'gamma',
    ]);
  });

  it('searches names case-insensitively and trims whitespace', () => {
    expect(filterVaults(vaults, { status: 'all', query: '  reserve ' }).map((vault) => vault.id)).toEqual([
      'beta',
    ]);
  });

  it('combines status and search filters', () => {
    expect(filterVaults(vaults, { status: 'completed', query: 'vault' })).toEqual([]);
  });
});

describe('sortVaults', () => {
  it('sorts by deadline ascending', () => {
    expect(sortVaults(vaults, { by: 'deadline', dir: 'asc' }).map((vault) => vault.id)).toEqual([
      'beta',
      'gamma',
      'alpha',
    ]);
  });

  it('sorts by amount descending', () => {
    expect(sortVaults(vaults, { by: 'amount', dir: 'desc' }).map((vault) => vault.id)).toEqual([
      'beta',
      'gamma',
      'alpha',
    ]);
  });

  it('preserves original order when sort values tie', () => {
    const tied = [
      { ...vaults[0], id: 'first', amount: 100 },
      { ...vaults[1], id: 'second', amount: 100 },
    ];

    expect(sortVaults(tied, { by: 'amount', dir: 'desc' }).map((vault) => vault.id)).toEqual([
      'first',
      'second',
    ]);
  });
});
