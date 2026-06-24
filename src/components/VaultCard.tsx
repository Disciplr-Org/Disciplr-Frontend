import { Link } from 'react-router-dom';
import { CountdownDeadline } from './CountdownDeadline';
import { StatusChip } from './StatusChip';
import { Text } from './Text';
import { VaultProgressBar } from './VaultProgressBar';

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

  return (
    <Link to={link} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div
        style={{
          background: 'var(--bg)',
          border: '1px solid var(--border)',
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
          <StatusChip
            status={status}
            size="sm"
            label={status === 'pending_validation' ? 'Pending' : undefined}
          />
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <VaultProgressBar value={progressPct} label={`${name} progress`} />
        </div>
      </div>
    </Link>
  );
}
