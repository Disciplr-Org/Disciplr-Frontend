export type VaultStatus = 'active' | 'pending_validation' | 'completed' | 'failed' | 'cancelled'

export interface Vault {
  id: string
  name: string
  amount: number
  currency: string
  status: VaultStatus
  progressPct: number
  deadline: string
}

export const MOCK_VAULTS: Vault[] = [
  { id: '1', name: 'Alpha Vault',  amount: 12500,   currency: 'USDC', status: 'active',             progressPct: 42, deadline: '2024-07-15T10:00:00Z' },
  { id: '2', name: 'Beta Reserve', amount: 8800,    currency: 'USDC', status: 'pending_validation', progressPct: 78, deadline: '2024-05-20T10:00:00Z' },
  { id: '3', name: 'Gamma Fund',   amount: 4200.5,  currency: 'USDC', status: 'completed',          progressPct: 100, deadline: '2024-01-01T09:00:00Z' },
]

export async function getVaults(): Promise<Vault[]> {
  return new Promise(resolve => setTimeout(() => resolve(MOCK_VAULTS), 300))
}
