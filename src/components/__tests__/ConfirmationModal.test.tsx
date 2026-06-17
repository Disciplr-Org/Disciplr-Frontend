import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ConfirmationModal } from '../ConfirmationModal';

const focusTrapState = vi.hoisted(() => ({
  options: undefined as undefined | {
    allowOutsideClick?: boolean;
    escapeDeactivates?: boolean;
    onDeactivate?: () => void;
  },
}));

vi.mock('focus-trap-react', () => ({
  default: ({
    children,
    focusTrapOptions,
  }: {
    children: React.ReactNode;
    focusTrapOptions?: typeof focusTrapState.options;
  }) => {
    focusTrapState.options = focusTrapOptions;
    return <div data-testid="focus-trap">{children}</div>;
  },
}));

const baseProps = {
  isOpen: true,
  onClose: vi.fn(),
  onConfirm: vi.fn(),
};

function renderModal(props: Partial<React.ComponentProps<typeof ConfirmationModal>> = {}) {
  const mergedProps = {
    ...baseProps,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
    ...props,
  };

  render(<ConfirmationModal {...mergedProps} />);
  return mergedProps;
}

describe('ConfirmationModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    focusTrapState.options = undefined;
  });

  it('does not render the dialog while closed', () => {
    renderModal({ isOpen: false });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.queryByText('Confirm Validation')).not.toBeInTheDocument();
  });

  it('starts with an explicit neutral state when no decision is selected', () => {
    const props = renderModal();
    const dialog = screen.getByRole('dialog', { name: 'Confirm Validation' });

    const confirmButton = screen.getByRole('button', { name: 'Confirm' });
    expect(confirmButton).toBeDisabled();
    expect(confirmButton).toHaveClass('bg-blue-600');
    expect(screen.queryByText('Irreversible Action')).not.toBeInTheDocument();
    expect(screen.queryByText('Action Notification')).not.toBeInTheDocument();

    fireEvent.click(confirmButton);

    expect(props.onConfirm).not.toHaveBeenCalled();

    fireEvent.click(within(dialog).getByRole('button', { name: 'Approve' }));

    expect(screen.getByText('Irreversible Action')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Confirm Approve' })).not.toBeDisabled();
  });

  it('renders the approval flow and confirms with notes', () => {
    const props = renderModal({ initialDecision: 'approve', initialNotes: 'Looks complete.' });

    expect(screen.getByRole('dialog', { name: 'Confirm Validation' })).toBeInTheDocument();
    expect(screen.getByText('Irreversible Action')).toBeInTheDocument();
    expect(screen.getByText(/release vault funds/i)).toBeInTheDocument();

    const notes = screen.getByLabelText(/Verification Notes/i);
    expect(notes).toHaveValue('Looks complete.');

    fireEvent.click(screen.getByRole('button', { name: 'Confirm Approve' }));

    expect(props.onConfirm).toHaveBeenCalledWith('approve', 'Looks complete.');
    expect(props.onClose).not.toHaveBeenCalled();
  });

  it('requires rejection notes and passes them through on confirm', () => {
    const props = renderModal({ initialDecision: 'reject' });

    expect(screen.getByText('Action Notification')).toBeInTheDocument();
    expect(screen.getByText(/Funds will remain locked/i)).toBeInTheDocument();

    const confirmButton = screen.getByRole('button', { name: 'Confirm Reject' });
    expect(confirmButton).toBeDisabled();
    expect(screen.getByText('Notes are required for rejection.')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/Verification Notes/i), {
      target: { value: 'Evidence does not match the milestone.' },
    });

    expect(confirmButton).not.toBeDisabled();
    fireEvent.click(confirmButton);

    expect(props.onConfirm).toHaveBeenCalledWith('reject', 'Evidence does not match the milestone.');
  });

  it('supports cancel, close, and focus-trap deactivation without confirming', () => {
    const props = renderModal({ initialDecision: 'approve' });
    const dialog = screen.getByRole('dialog', { name: 'Confirm Validation' });

    expect(focusTrapState.options).toMatchObject({
      allowOutsideClick: true,
      escapeDeactivates: true,
    });
    expect(focusTrapState.options?.onDeactivate).toBe(props.onClose);

    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    fireEvent.click(within(dialog).getByRole('button', { name: 'Close modal' }));
    focusTrapState.options?.onDeactivate?.();

    expect(props.onClose).toHaveBeenCalledTimes(3);
    expect(props.onConfirm).not.toHaveBeenCalled();
  });

  it('does not close or confirm when the backdrop is clicked', () => {
    const props = renderModal({ initialDecision: 'approve' });
    const dialog = screen.getByRole('dialog', { name: 'Confirm Validation' });

    fireEvent.click(dialog);

    expect(props.onClose).not.toHaveBeenCalled();
    expect(props.onConfirm).not.toHaveBeenCalled();
  });

  it('renders the evidence link and allows switching decisions', () => {
    renderModal({
      initialDecision: 'approve',
      evidenceUrl: 'https://example.com/evidence',
    });

    const evidenceLink = screen.getByRole('link', { name: /View submitted proof/i });
    expect(evidenceLink).toHaveAttribute('href', 'https://example.com/evidence');
    expect(evidenceLink).toHaveAttribute('target', '_blank');
    expect(evidenceLink).toHaveAttribute('rel', 'noopener noreferrer');

    const dialog = screen.getByRole('dialog', { name: 'Confirm Validation' });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Reject' }));

    expect(screen.getByText('Action Notification')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Confirm Reject' })).toBeDisabled();
  });

  it('resets decision and notes from props each time it opens', () => {
    const onClose = vi.fn();
    const onConfirm = vi.fn();
    const { rerender } = render(
      <ConfirmationModal
        isOpen
        onClose={onClose}
        onConfirm={onConfirm}
        initialDecision="approve"
        initialNotes="First review note"
      />
    );

    fireEvent.change(screen.getByLabelText(/Verification Notes/i), {
      target: { value: 'Edited before close' },
    });

    rerender(<ConfirmationModal isOpen={false} onClose={onClose} onConfirm={onConfirm} />);
    rerender(
      <ConfirmationModal
        isOpen
        onClose={onClose}
        onConfirm={onConfirm}
        initialDecision="reject"
        initialNotes="Fresh rejection note"
      />
    );

    expect(screen.getByRole('button', { name: 'Confirm Reject' })).not.toBeDisabled();
    expect(screen.getByLabelText(/Verification Notes/i)).toHaveValue('Fresh rejection note');
  });
});
