import type { CSSProperties } from 'react';
import type { VaultStatus } from '../types/vault';
import { vaultLifecycleStages, type VaultLifecycleStage } from '../utils/vaultLifecycle';

export interface VaultLifecycleProps {
  status: VaultStatus;
  label?: string;
}

const STATE_STYLES: Record<VaultLifecycleStage['state'], { color: string; bg: string }> = {
  done: {
    color: 'var(--success)',
    bg: 'color-mix(in srgb, var(--success) 12%, transparent)',
  },
  current: {
    color: 'var(--accent)',
    bg: 'var(--accent-transparent)',
  },
  upcoming: {
    color: 'var(--muted)',
    bg: 'var(--bg)',
  },
};

const terminalStyles = {
  color: 'var(--danger)',
  bg: 'color-mix(in srgb, var(--danger) 12%, transparent)',
};

const getStageStyles = (stage: VaultLifecycleStage) =>
  stage.terminal && stage.state === 'current' ? terminalStyles : STATE_STYLES[stage.state];

const containerStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
  gap: '0.75rem',
  marginTop: '1rem',
  marginBottom: 0,
  padding: 0,
};

export function VaultLifecycle({ status, label = 'Vault lifecycle' }: VaultLifecycleProps) {
  const stages = vaultLifecycleStages(status);

  return (
    <ol aria-label={label} style={containerStyle}>
      {stages.map((stage, index) => {
        const styles = getStageStyles(stage);

        return (
          <li
            key={stage.id}
            aria-label={`${stage.label}, ${stage.state}`}
            style={{
              listStyle: 'none',
              border: `1px solid ${styles.color}`,
              borderRadius: 'var(--radius)',
              background: styles.bg,
              color: styles.color,
              padding: '0.75rem',
              minHeight: 72,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              gap: '0.25rem',
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>
              Step {index + 1}
            </span>
            <span style={{ color: 'var(--text)', fontWeight: 700 }}>{stage.label}</span>
            <span style={{ fontSize: 12, textTransform: 'capitalize' }}>{stage.state}</span>
          </li>
        );
      })}
    </ol>
  );
}
