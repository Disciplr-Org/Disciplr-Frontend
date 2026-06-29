import { describe, expect, it } from 'vitest';
import { filterVaults } from '../filterVaults';
import type { FilterableVault } from '../filterVaults';

const vaults: FilterableVault[] = [
  { name: 'Alpha Vault', status: 'active' },
  { name: 'Beta Reserve', status: 'completed' },
  { name: 'Gamma Fund', status: 'failed' },
  { name: 'Delta Safe', status: 'pending_validation' },
  { name: 'Epsilon Pool', status: 'cancelled' },
];

describe('filterVaults', () => {
  it('returns all vaults when status is "all" and query is empty', () => {
    expect(filterVaults(vaults, { status: 'all', query: '' })).toHaveLength(5);
  });

  it('filters by status', () => {
    const result = filterVaults(vaults, { status: 'active', query: '' });
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Alpha Vault');
  });

  it('filters by query case-insensitively', () => {
    expect(filterVaults(vaults, { status: 'all', query: 'ALPHA' })).toHaveLength(1);
    expect(filterVaults(vaults, { status: 'all', query: 'alpha' })).toHaveLength(1);
  });

  it('filters by both status and query', () => {
    const result = filterVaults(vaults, { status: 'active', query: 'alpha' });
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Alpha Vault');
  });

  it('returns empty array when no vaults match query', () => {
    expect(filterVaults(vaults, { status: 'all', query: 'zzz' })).toHaveLength(0);
  });

  it('returns empty array when no vaults match status', () => {
    expect(filterVaults(vaults, { status: 'active', query: 'beta' })).toHaveLength(0);
  });

  it('trims whitespace from query', () => {
    const result = filterVaults(vaults, { status: 'all', query: '  beta  ' });
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Beta Reserve');
  });

  it('returns empty array for empty vault list', () => {
    expect(filterVaults([], { status: 'all', query: 'anything' })).toHaveLength(0);
  });

  it('preserves extra properties on generic vault objects', () => {
    const extended = [{ name: 'Alpha Vault', status: 'active' as const, amount: 100 }];
    const result = filterVaults(extended, { status: 'active', query: '' });
    expect(result[0].amount).toBe(100);
  });

  it('matches partial name queries', () => {
    const result = filterVaults(vaults, { status: 'all', query: 'vault' });
    expect(result).toHaveLength(1);
  });

  it('filters cancelled status', () => {
    expect(filterVaults(vaults, { status: 'cancelled', query: '' })).toEqual([
      { name: 'Epsilon Pool', status: 'cancelled' },
    ]);
  });

  it('filters pending_validation status', () => {
    expect(filterVaults(vaults, { status: 'pending_validation', query: '' })).toEqual([
      { name: 'Delta Safe', status: 'pending_validation' },
    ]);
  });
});
