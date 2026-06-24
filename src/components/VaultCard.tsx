import { Link } from 'react-router-dom';
import { Text } from './Text';
import { VaultProgressBar } from './VaultProgressBar';
import React from 'react';
import { CountdownDeadline } from './CountdownDeadline';
import type { VaultStatus } from '../types/vault';

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

function StatusBadge({ status }: { status: VaultStatus }) {
  const config = {
    active: { label: 'Active', bg: 'var(--accent-transparent)', fg: 'var(--accent)' },
    pending_validation: { label: 'Pending', bg: 'var(--warning-transparent)', fg: 'var(--warning)' },
    completed: { label: 'Completed', bg: 'var(--success-transparent)', fg: 'var(--success)' },
    failed: { label: 'Failed', bg: 'var(--danger-transparent)', fg: 'var(--danger)' },
    cancelled: { label: 'Cancelled', bg: 'rgba(156,163,175,0.1)', fg: 'var(--muted)' },
  }[status];

  return (
    <span
      style={{
        background: config.bg,
        color: config.fg,
        border: `1px solid ${config.fg}`,
        borderRadius: 'var(--radius-full)',
        padding: '2px 8px',
        fontSize: 11,
        fontWeight: 600,
        whiteSpace: 'nowrap',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
      }}
    >
      {config.label}
    </span>
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
          <StatusBadge status={status} />
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <VaultProgressBar value={progressPct} label={`${name} progress`} />
        </div>
      </div>
    </Link>
  );
}
