import React from 'react';

export type BadgeTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';
export type BadgeSize = 'sm' | 'md' | 'lg';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  size?: BadgeSize;
  count?: number;
  children: React.ReactNode;
}

const TONE_STYLES: Record<BadgeTone, { color: string; background: string }> = {
  neutral: {
    color: 'var(--muted)',
    background: 'color-mix(in srgb, var(--muted) 10%, transparent)',
  },
  info: {
    color: 'var(--info)',
    background: 'color-mix(in srgb, var(--info) 10%, transparent)',
  },
  success: {
    color: 'var(--success)',
    background: 'color-mix(in srgb, var(--success) 10%, transparent)',
  },
  warning: {
    color: 'var(--warning)',
    background: 'color-mix(in srgb, var(--warning) 10%, transparent)',
  },
  danger: {
    color: 'var(--danger)',
    background: 'color-mix(in srgb, var(--danger) 10%, transparent)',
  },
};

const SIZE_STYLES: Record<BadgeSize, { padding: string; fontSize: string }> = {
  sm: { padding: '2px 8px', fontSize: '11px' },
  md: { padding: '2px 10px', fontSize: '12px' },
  lg: { padding: '4px 12px', fontSize: '14px' },
};

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(function Badge({
  tone = 'neutral',
  size = 'md',
  count,
  className = '',
  children,
  ariaLabel,
  ...props
}, ref) {
  const style = TONE_STYLES[tone];
  const sizeStyle = SIZE_STYLES[size];
  const accessibleLabel = ariaLabel ?? (typeof count === 'number' ? `Count: ${count}` : undefined);

  return (
    <span
      ref={ref}
      className={`badge ${className}`.trim()}
      style={{
        background: style.background,
        color: style.color,
        border: `1px solid ${style.color}`,
        borderRadius: 'var(--radius-full)',
        fontWeight: 600,
        whiteSpace: 'nowrap',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        ...sizeStyle,
      }}
      aria-label={accessibleLabel}
      {...props}
    >
      {children}
    </span>
  );
});
