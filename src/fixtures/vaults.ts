import type { VaultPreview } from '../utils/dashboard';

export const VAULT_FIXTURES: VaultPreview[] = [
  {
    id: 'v1',
    name: 'Alpha Vault',
    amount: 12500,
    currency: 'USDC',
    status: 'active',
    progressPct: 42,
    deadline: '2026-06-30T12:00:00Z',
  },
  {
    id: 'v2',
    name: 'Beta Reserve',
    amount: 8800,
    currency: 'USDC',
    status: 'pending_validation',
    progressPct: 78,
    deadline: '2026-07-10T12:00:00Z',
  },
  {
    id: 'v3',
    name: 'Gamma Fund',
    amount: 4200,
    currency: 'USDC',
    status: 'completed',
    progressPct: 100,
    deadline: '2026-06-20T12:00:00Z',
  },
  {
    id: 'v4',
    name: 'Delta Safe',
    amount: 15000,
    currency: 'USDC',
    status: 'failed',
    progressPct: 10,
    deadline: '2026-06-25T12:00:00Z',
  },
  {
    id: 'v5',
    name: 'Epsilon Pool',
    amount: 3300,
    currency: 'USDC',
    status: 'cancelled',
    progressPct: 0,
    deadline: '2026-07-01T12:00:00Z',
  },
];
