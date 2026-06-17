import './VaultProgressBar.css';
import type { CSSProperties } from 'react';

export interface VaultProgressBarProps {
  value: number;
  label?: string;
}

export function clampVaultProgress(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, value));
}

function progressColor(value: number): string {
  return value >= 100 ? 'var(--success)' : 'var(--accent)';
}

export default function VaultProgressBar({ value, label }: VaultProgressBarProps) {
  const normalizedValue = clampVaultProgress(value);
  const roundedValue = Math.round(normalizedValue);
  const ariaLabel = label ?? 'Vault progress';

  return (
    <div className="vault-progress-bar">
      {label && (
        <div className="vault-progress-bar__meta">
          <span className="vault-progress-bar__label">{label}</span>
          <span className="vault-progress-bar__value">{roundedValue}%</span>
        </div>
      )}
      <div
        className="vault-progress-bar__track"
        role="progressbar"
        aria-label={ariaLabel}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={roundedValue}
        style={
          {
            '--vault-progress-value': `${normalizedValue}%`,
            '--vault-progress-fill': progressColor(normalizedValue),
          } as CSSProperties
        }
      >
        <div className="vault-progress-bar__fill" />
      </div>
    </div>
  );
}
