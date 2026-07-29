import { describe, expect, it } from 'vitest';
import { vaultLifecycleStages } from '../vaultLifecycle';

const states = (status: string) =>
  vaultLifecycleStages(status).map((stage) => [stage.id, stage.state, stage.label]);

describe('vaultLifecycleStages', () => {
  it('maps active vaults to the active step', () => {
    expect(states('active')).toEqual([
      ['created', 'done', 'Created'],
      ['active', 'current', 'Active'],
      ['pending_validation', 'upcoming', 'Pending Validation'],
      ['completed', 'upcoming', 'Completed'],
    ]);
  });

  it('maps pending validation vaults to the validation step', () => {
    expect(states('pending_validation')).toEqual([
      ['created', 'done', 'Created'],
      ['active', 'done', 'Active'],
      ['pending_validation', 'current', 'Pending Validation'],
      ['completed', 'upcoming', 'Completed'],
    ]);
  });

  it('maps completed vaults to the completed step', () => {
    expect(states('completed')).toEqual([
      ['created', 'done', 'Created'],
      ['active', 'done', 'Active'],
      ['pending_validation', 'done', 'Pending Validation'],
      ['completed', 'current', 'Completed'],
    ]);
  });

  it('renders failed and cancelled as terminal stages', () => {
    const failed = vaultLifecycleStages('failed');
    const cancelled = vaultLifecycleStages('cancelled');

    expect(failed.at(-1)).toMatchObject({
      id: 'failed',
      label: 'Failed',
      state: 'current',
      terminal: true,
    });
    expect(cancelled.at(-1)).toMatchObject({
      id: 'cancelled',
      label: 'Cancelled',
      state: 'current',
      terminal: true,
    });
  });

  it('falls back safely for unknown statuses', () => {
    expect(states('unknown')).toEqual([
      ['created', 'current', 'Created'],
      ['active', 'upcoming', 'Active'],
      ['pending_validation', 'upcoming', 'Pending Validation'],
      ['completed', 'upcoming', 'Completed'],
    ]);
  });
});
