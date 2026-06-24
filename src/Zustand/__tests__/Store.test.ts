import { beforeEach, describe, expect, it } from 'vitest';
import { useVerifierStore, type ValidationTask } from '../Store';

const makeTask = (id: string, vaultName: string): ValidationTask => ({
  id,
  vaultName,
  owner: `0x${id}`,
  amount: '1,000 USDC',
  deadline: '2026-07-01',
  daysRemaining: 7,
  status: 'pending',
  milestone: `${vaultName} milestone`,
});

describe('useVerifierStore batch validation mutators', () => {
  beforeEach(() => {
    useVerifierStore.setState({
      pendingValidations: [
        makeTask('v-1', 'Alpha Vault'),
        makeTask('v-2', 'Beta Vault'),
        makeTask('v-3', 'Gamma Vault'),
      ],
      validationHistory: [],
    });
  });

  it('batchApprove moves selected pending tasks into history with notes', () => {
    useVerifierStore.getState().batchApprove(['v-1', 'missing-id', 'v-2'], 'Ready to release.');

    const state = useVerifierStore.getState();
    expect(state.pendingValidations.map((task) => task.id)).toEqual(['v-3']);
    expect(state.validationHistory.map((task) => task.id)).toEqual(['v-2', 'v-1']);
    expect(state.validationHistory.every((task) => task.status === 'approved')).toBe(true);
    expect(state.validationHistory.every((task) => task.notes === 'Ready to release.')).toBe(true);
  });

  it('batchReject moves only unresolved pending tasks into history', () => {
    useVerifierStore.getState().approveValidation('v-1', 'Single approval first.');
    useVerifierStore.getState().batchReject(['v-1', 'v-3'], 'Evidence is incomplete.');

    const state = useVerifierStore.getState();
    expect(state.pendingValidations.map((task) => task.id)).toEqual(['v-2']);
    expect(state.validationHistory.map((task) => task.id)).toEqual(['v-3', 'v-1']);
    expect(state.validationHistory[0]).toMatchObject({
      id: 'v-3',
      status: 'rejected',
      notes: 'Evidence is incomplete.',
    });
    expect(state.validationHistory[1]).toMatchObject({
      id: 'v-1',
      status: 'approved',
      notes: 'Single approval first.',
    });
  });
});
