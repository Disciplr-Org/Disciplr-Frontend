import { beforeEach, describe, expect, it } from 'vitest';
import { useVerifierStore, type ValidationTask } from '../Store';

const basePending: ValidationTask[] = [
  {
    id: 'pending-1',
    vaultName: 'Milestone Alpha',
    owner: '0xalpha',
    amount: '1,000 USDC',
    deadline: '2026-07-01',
    daysRemaining: 7,
    status: 'pending',
    milestone: 'Ship alpha',
    evidenceUrl: 'https://example.com/alpha',
  },
  {
    id: 'pending-2',
    vaultName: 'Milestone Beta',
    owner: '0xbeta',
    amount: '2,000 USDC',
    deadline: '2026-07-08',
    daysRemaining: 14,
    status: 'pending',
    milestone: 'Ship beta',
    evidenceUrl: 'https://example.com/beta',
  },
];

const baseHistory: ValidationTask[] = [
  {
    id: 'history-1',
    vaultName: 'Prior Review',
    owner: '0xhistory',
    amount: '500 USDC',
    deadline: '2026-06-01',
    daysRemaining: 0,
    status: 'approved',
    milestone: 'Prior milestone',
    notes: 'Already approved.',
  },
];

function cloneTasks(tasks: ValidationTask[]) {
  return tasks.map((task) => ({ ...task }));
}

function resetVerifierStore({
  pendingValidations = basePending,
  validationHistory = baseHistory,
}: {
  pendingValidations?: ValidationTask[];
  validationHistory?: ValidationTask[];
} = {}) {
  useVerifierStore.setState({
    pendingValidations: cloneTasks(pendingValidations),
    validationHistory: cloneTasks(validationHistory),
  });
}

describe('useVerifierStore validation transitions', () => {
  beforeEach(() => {
    resetVerifierStore();
  });

  it('approves a pending validation, removes it from pending, and places it first in history with notes', () => {
    useVerifierStore.getState().approveValidation('pending-2', 'Evidence checks out.');

    const { pendingValidations, validationHistory } = useVerifierStore.getState();

    expect(pendingValidations.map((task) => task.id)).toEqual(['pending-1']);
    expect(validationHistory[0]).toMatchObject({
      id: 'pending-2',
      status: 'approved',
      notes: 'Evidence checks out.',
    });
    expect(validationHistory[1]).toMatchObject({ id: 'history-1' });
  });

  it('rejects a pending validation, removes it from pending, and places it first in history with notes', () => {
    useVerifierStore.getState().rejectValidation('pending-1', 'Missing deployment proof.');

    const { pendingValidations, validationHistory } = useVerifierStore.getState();

    expect(pendingValidations.map((task) => task.id)).toEqual(['pending-2']);
    expect(validationHistory[0]).toMatchObject({
      id: 'pending-1',
      status: 'rejected',
      notes: 'Missing deployment proof.',
    });
    expect(validationHistory[1]).toMatchObject({ id: 'history-1' });
  });

  it('preserves omitted notes when approving without notes', () => {
    useVerifierStore.getState().approveValidation('pending-1');

    const approved = useVerifierStore.getState().validationHistory[0];

    expect(approved).toMatchObject({
      id: 'pending-1',
      status: 'approved',
    });
    expect(approved.notes).toBeUndefined();
  });

  it('does not change state when approving an unknown id', () => {
    const before = useVerifierStore.getState();

    useVerifierStore.getState().approveValidation('missing-id', 'No matching task.');

    const after = useVerifierStore.getState();
    expect(after.pendingValidations).toEqual(before.pendingValidations);
    expect(after.validationHistory).toEqual(before.validationHistory);
  });

  it('does not change state when rejecting with an empty pending queue', () => {
    resetVerifierStore({ pendingValidations: [] });
    const before = useVerifierStore.getState();

    useVerifierStore.getState().rejectValidation('pending-1', 'No pending tasks.');

    const after = useVerifierStore.getState();
    expect(after.pendingValidations).toEqual([]);
    expect(after.validationHistory).toEqual(before.validationHistory);
  });

  it('does not reprocess a validation after it has already moved to history', () => {
    useVerifierStore.getState().approveValidation('pending-1', 'First review.');
    useVerifierStore.getState().rejectValidation('pending-1', 'Second review.');

    const { pendingValidations, validationHistory } = useVerifierStore.getState();

    expect(pendingValidations.map((task) => task.id)).toEqual(['pending-2']);
    expect(validationHistory.filter((task) => task.id === 'pending-1')).toHaveLength(1);
    expect(validationHistory[0]).toMatchObject({
      id: 'pending-1',
      status: 'approved',
      notes: 'First review.',
    });
  });
});
