import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BatchActionBar } from '../BatchActionBar';

describe('BatchActionBar', () => {
  const onApprove = vi.fn();
  const onReject = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  function renderBar(
    props: Partial<React.ComponentProps<typeof BatchActionBar>> = {},
  ) {
    return render(
      <BatchActionBar
        selectedCount={2}
        onApprove={onApprove}
        onReject={onReject}
        {...props}
      />,
    );
  }

  it('disables both buttons when nothing is selected', () => {
    renderBar({ selectedCount: 0 });

    expect(screen.getByText('0 selected')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Approve Selected/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Reject Selected/i })).toBeDisabled();
  });

  it('opens the confirmation modal when Approve Selected is clicked', () => {
    renderBar();

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Approve Selected/i }));

    expect(screen.getByRole('dialog', { name: 'Confirm Validation' })).toBeInTheDocument();
    expect(screen.getByTestId('batch-affected-count')).toHaveTextContent('2 validations');
  });

  it('blocks confirmation when notes exceed 2000 characters', async () => {
    renderBar();

    fireEvent.click(screen.getByRole('button', { name: /Approve Selected/i }));
    fireEvent.change(screen.getByLabelText(/Verification Notes/i), {
      target: { value: 'a'.repeat(2001) },
    });
    fireEvent.click(screen.getByRole('button', { name: /Confirm Approve/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Notes must be 2000 characters or fewer.',
    );
    expect(onApprove).not.toHaveBeenCalled();
  });

  it('passes the entered notes to onApprove', async () => {
    renderBar();

    fireEvent.click(screen.getByRole('button', { name: /Approve Selected/i }));
    fireEvent.change(screen.getByLabelText(/Verification Notes/i), {
      target: { value: 'All milestones verified.' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Confirm Approve/i }));

    await waitFor(() => {
      expect(onApprove).toHaveBeenCalledWith('All milestones verified.');
    });
    expect(onReject).not.toHaveBeenCalled();
  });
});
