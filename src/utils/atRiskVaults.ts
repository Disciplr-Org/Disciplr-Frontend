import { deadlineUrgency, UrgencyTier } from '../components/VaultCard';

export type VaultStatus = 'active' | 'pending_validation' | 'completed' | 'failed';

export interface VaultPreview {
  id: string;
  name: string;
  amount: number;
  currency: string;
  status: VaultStatus;
  progressPct: number;
  deadline: string;
}

const AT_RISK_TIERS: Set<UrgencyTier> = new Set(['critical', 'soon']);
const AT_RISK_STATUSES: Set<VaultStatus> = new Set(['active', 'pending_validation']);

export function getAtRiskVaults(vaults: VaultPreview[], now: Date | number = Date.now()): VaultPreview[] {
  return vaults.filter((vault) => {
    if (!AT_RISK_STATUSES.has(vault.status)) return false;

    const urgency = deadlineUrgency(vault.deadline, now);
    return AT_RISK_TIERS.has(urgency);
  });
}
