import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { ValidationTask } from '../../Zustand/Store';
import { VerifierMetrics } from '../VerifierMetrics';

function task(overrides: Partial<ValidationTask>): ValidationTask {
  return {
    id: overrides.id ?? 'v-1',
    vaultName: overrides.vaultName ?? 'Vault',
    owner: overrides.owner ?? 'GOWNER',
    amount: overrides.amount ?? '1,000 USDC',
    deadline: overrides.deadline ?? '2026-01-01',
    daysRemaining: overrides.daysRemaining ?? 7,
    status: overrides.status ?? 'pending',
    milestone: overrides.milestone ?? 'Milestone',
    notes: overrides.notes,
  };
}

describe('VerifierMetrics', () => {
  it('renders verifier KPI values with accessible metric labels', () => {
    render(
      <VerifierMetrics
        pendingValidations={[
          task({ id: 'overdue', daysRemaining: 0 }),
          task({ id: 'urgent', daysRemaining: 3 }),
          task({ id: 'later', daysRemaining: 5 }),
        ]}
        validationHistory={[
          task({ id: 'approved-1', status: 'approved' }),
          task({ id: 'approved-2', status: 'approved' }),
          task({ id: 'rejected-1', status: 'rejected' }),
        ]}
      />,
    );

    const region = screen.getByRole('region', { name: 'Verifier performance metrics' });
    expect(within(region).getByLabelText('Approval Rate: 67%. 2 approved of 3 resolved')).toBeInTheDocument();
    expect(within(region).getByLabelText('Total Resolved: 3. 1 rejected validations included')).toBeInTheDocument();
    expect(within(region).getByLabelText('Urgent Pending: 2. Pending validations due in 3 days or less')).toBeInTheDocument();
    expect(within(region).getByLabelText('Overdue Pending: 1. Pending validations due today or already past due')).toBeInTheDocument();
  });

  it('renders 0% approval rate for empty history', () => {
    render(<VerifierMetrics pendingValidations={[]} validationHistory={[]} />);

    expect(screen.getByLabelText('Approval Rate: 0%. 0 approved of 0 resolved')).toBeInTheDocument();
  });
});
