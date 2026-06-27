import { Link } from 'react-router-dom';
import { Text } from './Text';
import { VaultProgressBar } from './VaultProgressBar';
import { CountdownDeadline } from './CountdownDeadline';
import { StatusChip } from './StatusChip';
import { Badge, BadgeTone } from './Badge';

export type VaultStatus = 'active' | 'pending_validation' | 'completed' | 'failed';

export interface VaultCardProps {
  id: string;
  name: string;
  amount: number;
  currency: string;
  status: VaultStatus;
  deadline: string;
  progressPct: number;
  linkTo?: string;
}

/** Vaults with ≤ 24 h remaining are classified as critical. */
export const URGENCY_CRITICAL_MS = 24 * 60 * 60 * 1000;
/** Vaults with > 24 h and ≤ 7 d remaining are classified as soon. */
export const URGENCY_SOON_MS = 7 * 24 * 60 * 60 * 1000;

export type UrgencyTier = 'safe' | 'soon' | 'critical';

/** Returns urgency tier based on time remaining. Expired and invalid deadlines return 'safe'. */
export function deadlineUrgency(deadline: string, now: Date | number = Date.now()): UrgencyTier {
  const deadlineMs = new Date(deadline).getTime();
  const nowMs = typeof now === 'number' ? now : now.getTime();

  if (Number.isNaN(deadlineMs)) return 'safe';

  const msRemaining = deadlineMs - nowMs;
  if (msRemaining <= 0) return 'safe';
  if (msRemaining <= URGENCY_CRITICAL_MS) return 'critical';
  if (msRemaining <= URGENCY_SOON_MS) return 'soon';
  return 'safe';
}

const URGENCY_BADGE_CONFIG = {
  critical: {
    label: 'Expires soon!',
    tone: 'danger',
    ariaLabel: 'Critical: expires within 24 hours',
  },
  soon: {
    label: 'Due soon',
    tone: 'warning',
    ariaLabel: 'Deadline approaching: due within 7 days',
  },
} satisfies Record<Exclude<UrgencyTier, 'safe'>, { label: string; tone: BadgeTone; ariaLabel: string }>;

function UrgencyBadge({ tier }: { tier: UrgencyTier }) {
  if (tier === 'safe') return null;
  const config = URGENCY_BADGE_CONFIG[tier];
  return (
    <Badge
      aria-label={config.ariaLabel}
      size="sm"
      tone={config.tone}
    >
      {config.label}
    </Badge>
  );
}

export default function VaultCard({
  id,
  name,
  amount,
  currency,
  status,
  deadline,
  progressPct,
  linkTo,
}: VaultCardProps) {
  const link = linkTo ?? `/vaults/${id}`;
  const isTerminal = status === 'completed' || status === 'failed';
  const urgency = isTerminal ? 'safe' : deadlineUrgency(deadline);
  const borderColor = urgency === 'critical'
    ? 'var(--danger)'
    : urgency === 'soon'
      ? 'var(--warning)'
      : 'var(--border)';

  return (
    <Link to={link} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div
        style={{
          background: 'var(--bg)',
          border: `1px solid ${borderColor}`,
          borderRadius: 'var(--radius)',
          padding: '0.875rem 1rem',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) auto',
          gap: '0.75rem',
          marginBottom: 4,
          boxShadow: 'var(--elevated)',
        }}
      >
        <div style={{ minWidth: 0 }}>
          <Text role="body" as="div" style={{ fontWeight: 600, marginBottom: 2 }}>
            {name}
          </Text>
          <Text role="caption" as="div" style={{ color: 'var(--accent)', fontWeight: 700 }}>
            {amount.toLocaleString()} {currency}
          </Text>
          <Text role="caption" as="div" style={{ color: 'var(--muted)' }}>
            Deadline:{' '}
            <CountdownDeadline deadline={deadline} />
          </Text>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <UrgencyBadge tier={urgency} />
          <StatusChip status={status} size="sm" label={status === 'pending_validation' ? 'Pending' : undefined} />
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <VaultProgressBar value={progressPct} label={`${name} progress`} />
        </div>
      </div>
    </Link>
  );
}
