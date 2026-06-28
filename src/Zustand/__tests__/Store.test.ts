import { describe, it, expect, beforeEach } from 'vitest';
import { useVerifierStore, type ValidationTask } from '../Store';

const task = (id: string): ValidationTask => ({
  id,
  vaultName: `Vault ${id}`,
  owner: '0xowner',
  amount: '1,000 USDC',
  deadline: '2026-06-01',
  daysRemaining: 5,
  status: 'pending',
  milestone: `Milestone ${id}`,
});

describe('verifier store — batch mutators', () => {
  beforeEach(() => {
    useVerifierStore.setState({
      pendingValidations: [task('a'), task('b'), task('c')],
      validationHistory: [],
    });
  });

  it('batchApprove moves every selected task to history as approved with notes', () => {
    useVerifierStore.getState().batchApprove(['a', 'b'], 'looks solid');

    const { pendingValidations, validationHistory } = useVerifierStore.getState();
    expect(pendingValidations.map((t) => t.id)).toEqual(['c']);
    expect(validationHistory.map((t) => t.id).sort()).toEqual(['a', 'b']);
    expect(validationHistory.every((t) => t.status === 'approved')).toBe(true);
    expect(validationHistory.every((t) => t.notes === 'looks solid')).toBe(true);
  });

  it('batchReject moves every selected task to history as rejected', () => {
    useVerifierStore.getState().batchReject(['b', 'c'], 'evidence incomplete');

    const { pendingValidations, validationHistory } = useVerifierStore.getState();
    expect(pendingValidations.map((t) => t.id)).toEqual(['a']);
    expect(validationHistory.map((t) => t.id).sort()).toEqual(['b', 'c']);
    expect(validationHistory.every((t) => t.status === 'rejected')).toBe(true);
    expect(validationHistory.every((t) => t.notes === 'evidence incomplete')).toBe(true);
  });

  it('ignores ids that are not pending (unknown or already resolved)', () => {
    useVerifierStore.getState().batchApprove(['a', 'does-not-exist'], 'note');

    const { pendingValidations, validationHistory } = useVerifierStore.getState();
    expect(pendingValidations.map((t) => t.id)).toEqual(['b', 'c']);
    expect(validationHistory.map((t) => t.id)).toEqual(['a']);
  });

  it('treats an empty id list as a no-op', () => {
    useVerifierStore.getState().batchApprove([]);
    useVerifierStore.getState().batchReject([]);

    const { pendingValidations, validationHistory } = useVerifierStore.getState();
    expect(pendingValidations).toHaveLength(3);
    expect(validationHistory).toHaveLength(0);
  });

  it('processes a duplicated id only once without throwing', () => {
    useVerifierStore.getState().batchApprove(['a', 'a'], 'dupe');

    const { pendingValidations, validationHistory } = useVerifierStore.getState();
    expect(pendingValidations.map((t) => t.id)).toEqual(['b', 'c']);
    expect(validationHistory.map((t) => t.id)).toEqual(['a']);
    expect(validationHistory[0].status).toBe('approved');
  });

  it('treats an all-unknown id list as a no-op', () => {
    useVerifierStore.getState().batchApprove(['x', 'y']);
    useVerifierStore.getState().batchReject(['z']);

    const { pendingValidations, validationHistory } = useVerifierStore.getState();
    expect(pendingValidations.map((t) => t.id)).toEqual(['a', 'b', 'c']);
    expect(validationHistory).toHaveLength(0);
  });

  it('approves all tasks and leaves the queue empty', () => {
    useVerifierStore.getState().batchApprove(['a', 'b', 'c']);

    const { pendingValidations, validationHistory } = useVerifierStore.getState();
    expect(pendingValidations).toHaveLength(0);
    expect(validationHistory).toHaveLength(3);
  });

  it('does not regress the single-task mutators', () => {
    useVerifierStore.getState().approveValidation('a', 'single ok');
    useVerifierStore.getState().rejectValidation('b', 'single no');

    const { pendingValidations, validationHistory } = useVerifierStore.getState();
    expect(pendingValidations.map((t) => t.id)).toEqual(['c']);
    expect(validationHistory.find((t) => t.id === 'a')?.status).toBe('approved');
    expect(validationHistory.find((t) => t.id === 'b')?.status).toBe('rejected');
  });
});
