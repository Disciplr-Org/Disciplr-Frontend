import type { VaultStatus } from '../types/vault';

export interface FilterableVault {
  name: string;
  status: VaultStatus;
}

export interface VaultFilters {
  status: VaultStatus | 'all';
  query: string;
}

export function filterVaults<T extends FilterableVault>(
  vaults: T[],
  { status, query }: VaultFilters,
): T[] {
  const trimmed = query.trim().toLowerCase();
  return vaults.filter((v) => {
    if (status !== 'all' && v.status !== status) return false;
    if (trimmed && !v.name.toLowerCase().includes(trimmed)) return false;
    return true;
  });
}
