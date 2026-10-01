import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { VaultLifecycle } from '../VaultLifecycle';

describe('VaultLifecycle', () => {
  it('renders an accessible lifecycle list', () => {
    render(<VaultLifecycle status="pending_validation" />);

    const lifecycle = screen.getByRole('list', { name: 'Vault lifecycle' });
    expect(within(lifecycle).getAllByRole('listitem')).toHaveLength(4);
    expect(within(lifecycle).getByLabelText('Created, done')).toBeInTheDocument();
    expect(within(lifecycle).getByLabelText('Active, done')).toBeInTheDocument();
    expect(within(lifecycle).getByLabelText('Pending Validation, current')).toBeInTheDocument();
    expect(within(lifecycle).getByLabelText('Completed, upcoming')).toBeInTheDocument();
  });

  it('uses terminal styling for failed vaults', () => {
    render(<VaultLifecycle status="failed" />);

    const failedStep = screen.getByLabelText('Failed, current');
    expect(failedStep.getAttribute('style')).toContain('var(--danger)');
  });

  it('supports a custom accessible label', () => {
    render(<VaultLifecycle status="completed" label="Custom lifecycle" />);

    expect(screen.getByRole('list', { name: 'Custom lifecycle' })).toBeInTheDocument();
  });
});
