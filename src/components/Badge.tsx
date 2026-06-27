import type React from 'react';

export type BadgeTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';
export type BadgeSize = 'sm' | 'md' | 'lg';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  size?: BadgeSize;
  children: React.ReactNode;
}

const TONE_CONFIG: Record<BadgeTone, { color: string; bg: string }> = {
  neutral: {
    color: 'var(--muted)',
    bg: 'color-mix(in srgb, var(--muted) 10%, transparent)',
  },
  info: {
    color: 'var(--info)',
    bg: 'color-mix(in srgb, var(--info) 10%, transparent)',
  },
  success: {
    color: 'var(--success)',
    bg: 'var(--success-transparent)',
  },
  warning: {
    color: 'var(--warning)',
    bg: 'var(--warning-transparent)',
  },
  danger: {
    color: 'var(--danger)',
    bg: 'var(--danger-transparent)',
  },
};

const SIZE_STYLES: Record<BadgeSize, React.CSSProperties> = {
  sm: {
    padding: '2px 8px',
    fontSize: '11px',
    minHeight: '22px',
  },
  md: {
    padding: '2px 10px',
    fontSize: '12px',
    minHeight: '24px',
  },
  lg: {
    padding: '4px 12px',
    fontSize: '14px',
    minHeight: '28px',
  },
};

function getNumericCount(children: React.ReactNode): string | null {
  if (typeof children === 'number') {
    return String(children);
  }

  if (typeof children === 'string' && /^\d+$/.test(children.trim())) {
    return children.trim();
  }

  return null;
}

export function Badge({
  tone = 'neutral',
  size = 'md',
  className = '',
  children,
  style,
  ...props
}: BadgeProps) {
  const config = TONE_CONFIG[tone];
  const numericCount = getNumericCount(children);
  const ariaLabel = props['aria-label'] ?? (numericCount ? `Count: ${numericCount}` : undefined);

  return (
    <span
      {...props}
      aria-label={ariaLabel}
      className={`badge ${className}`.trim()}
      style={{
        background: config.bg,
        color: config.color,
        border: `var(--border-width-1) solid ${config.color}`,
        borderRadius: 'var(--radius-full)',
        fontWeight: 600,
        lineHeight: 1,
        whiteSpace: 'nowrap',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        ...SIZE_STYLES[size],
        ...style,
      }}
    >
      {children}
    </span>
  );
}
