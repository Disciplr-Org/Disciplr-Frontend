export type VaultListStatus = 'active' | 'completed' | 'failed' | 'cancelled' | 'pending_validation';
export type VaultStatusFilter = 'all' | VaultListStatus;
export type VaultSortBy = 'deadline' | 'amount';
export type VaultSortDir = 'asc' | 'desc';

export interface VaultListItem {
  id: string;
  name: string;
  amount: number;
  currency: string;
  status: VaultListStatus;
  deadline: string;
}

export interface VaultFilterOptions {
  status: VaultStatusFilter;
  query: string;
}

export interface VaultSortOptions {
  by: VaultSortBy;
  dir: VaultSortDir;
}

export function filterVaults(
  vaults: VaultListItem[],
  { status, query }: VaultFilterOptions,
): VaultListItem[] {
  const normalizedQuery = query.trim().toLowerCase();

  return vaults.filter((vault) => {
    const matchesStatus = status === 'all' || vault.status === status;
    const matchesQuery = normalizedQuery.length === 0 ||
      vault.name.toLowerCase().includes(normalizedQuery);

    return matchesStatus && matchesQuery;
  });
}

export function sortVaults(
  vaults: VaultListItem[],
  { by, dir }: VaultSortOptions,
): VaultListItem[] {
  const direction = dir === 'asc' ? 1 : -1;

  return vaults
    .map((vault, index) => ({ vault, index }))
    .sort((a, b) => {
      const primary = by === 'deadline'
        ? Date.parse(a.vault.deadline) - Date.parse(b.vault.deadline)
        : a.vault.amount - b.vault.amount;

      if (primary !== 0) {
        return primary * direction;
      }

      return a.index - b.index;
    })
    .map(({ vault }) => vault);
}
