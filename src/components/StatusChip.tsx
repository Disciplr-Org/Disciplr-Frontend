import type { CSSProperties } from 'react';

export type StatusChipStatus =
  | 'active'
  | 'pending_validation'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'approved'
  | 'rejected';

export type StatusChipSize = 'sm' | 'md';

interface StatusChipConfig {
  label: string;
  color: string;
  background: string;
}

const STATUS_CHIP_CONFIG: Record<StatusChipStatus, StatusChipConfig> = {
  active: {
    label: 'Active',
    color: 'var(--accent)',
    background: 'color-mix(in srgb, var(--accent) 14%, transparent)',
  },
  pending_validation: {
    label: 'Pending Validation',
    color: 'var(--warning)',
    background: 'color-mix(in srgb, var(--warning) 16%, transparent)',
  },
  completed: {
    label: 'Completed',
    color: 'var(--success)',
    background: 'color-mix(in srgb, var(--success) 14%, transparent)',
  },
  failed: {
    label: 'Failed',
    color: 'var(--danger)',
    background: 'color-mix(in srgb, var(--danger) 14%, transparent)',
  },
  cancelled: {
    label: 'Cancelled',
    color: 'var(--muted)',
    background: 'color-mix(in srgb, var(--muted) 14%, transparent)',
  },
  approved: {
    label: 'Approved',
    color: 'var(--success)',
    background: 'color-mix(in srgb, var(--success) 14%, transparent)',
  },
  rejected: {
    label: 'Rejected',
    color: 'var(--danger)',
    background: 'color-mix(in srgb, var(--danger) 14%, transparent)',
  },
};

const UNKNOWN_STATUS_CONFIG: StatusChipConfig = {
  label: 'Unknown',
  color: 'var(--muted)',
  background: 'color-mix(in srgb, var(--muted) 14%, transparent)',
};

const STATUS_CHIP_SIZE_STYLES: Record<StatusChipSize, CSSProperties> = {
  sm: {
    padding: '2px 8px',
    fontSize: 11,
  },
  md: {
    padding: '2px 10px',
    fontSize: 12,
  },
};

interface StatusChipProps {
  status: StatusChipStatus;
  size?: StatusChipSize;
  label?: string;
  className?: string;
}

export function StatusChip({
  status,
  size = 'md',
  label,
  className,
}: StatusChipProps) {
  const config = STATUS_CHIP_CONFIG[status] ?? UNKNOWN_STATUS_CONFIG;
  const visibleLabel = label ?? config.label;

  return (
    <span
      className={className}
      aria-label={`Status: ${visibleLabel}`}
      style={{
        background: config.background,
        color: config.color,
        border: `var(--border-width-1) solid ${config.color}`,
        borderRadius: 'var(--radius-full)',
        fontWeight: 600,
        whiteSpace: 'nowrap',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        ...STATUS_CHIP_SIZE_STYLES[size],
      }}
    >
      {visibleLabel}
    </span>
  );
}
