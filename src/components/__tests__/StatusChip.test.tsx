import React from 'react';
import { render, screen } from '@testing-library/react';
import { StatusChip, ChipStatus } from '../StatusChip';
import '@testing-library/jest-dom';

describe('StatusChip Component', () => {
  const allStatuses: ChipStatus[] = [
    'active',
    'pending_validation',
    'completed',
    'failed',
    'cancelled',
    'approved',
    'rejected',
  ];

  it('renders every status variant with default labels', () => {
    const expectedLabels: Record<ChipStatus, string> = {
      active: 'Active',
      pending_validation: 'Pending Validation',
      completed: 'Completed',
      failed: 'Failed',
      cancelled: 'Cancelled',
      approved: 'Approved',
      rejected: 'Rejected',
    };

    allStatuses.forEach((status) => {
      const { unmount } = render(<StatusChip status={status} />);
      const chip = screen.getByLabelText(expectedLabels[status]);
      expect(chip).toHaveTextContent(expectedLabels[status]);
      unmount();
    });
  });

  it('allows overriding the default label', () => {
    render(<StatusChip status="active" label="Custom Active Label" />);
    expect(screen.getByText('Custom Active Label')).toBeInTheDocument();
  });

  it('applies the correct size variants', () => {
    const { unmount: unmountSm } = render(<StatusChip status="active" size="sm" label="Small Chip" />);
    const smChip = screen.getByText('Small Chip');
    expect(smChip).toHaveStyle({ padding: '2px 8px', fontSize: '11px' });
    unmountSm();

    const { unmount: unmountMd } = render(<StatusChip status="active" size="md" label="Medium Chip" />);
    const mdChip = screen.getByText('Medium Chip');
    expect(mdChip).toHaveStyle({ padding: '2px 10px', fontSize: '12px' });
    unmountMd();

    const { unmount: unmountLg } = render(<StatusChip status="active" size="lg" label="Large Chip" />);
    const lgChip = screen.getByText('Large Chip');
    expect(lgChip).toHaveStyle({ padding: '4px 12px', fontSize: '14px' });
    unmountLg();
  });

  it('falls back gracefully to cancelled config on unknown status', () => {
    // We suppress the console error for unknown status (TS would normally catch this, but in pure JS it might happen)
    // @ts-expect-error - unknown status is intentionally exercised for fallback behavior
    render(<StatusChip status="unknown_status" />);
    const chip = screen.getByLabelText('Cancelled');
    expect(chip).toHaveTextContent('Cancelled');
  });

  it('applies additional classNames correctly', () => {
    render(<StatusChip status="active" className="uppercase extra-class" />);
    const chip = screen.getByLabelText('Active');
    expect(chip).toHaveClass('status-chip');
    expect(chip).toHaveClass('uppercase');
    expect(chip).toHaveClass('extra-class');
  });

  it('is not focusable by default (no custom tooltip)', () => {
    render(<StatusChip status="active" />);
    const chip = screen.getByLabelText('Active');
    expect(chip).not.toHaveAttribute('tabIndex');
  });

  it('becomes focusable when a custom tooltip is provided', () => {
    render(<StatusChip status="active" tooltip="Custom tooltip explanation" />);
    const chip = screen.getByLabelText('Active');
    expect(chip).toHaveAttribute('tabIndex', '0');
  });

  it('remains not focusable when only label is overridden (no custom tooltip)', () => {
    render(<StatusChip status="pending_validation" label="Awaiting review" />);
    const chip = screen.getByLabelText('Awaiting review');
    expect(chip).not.toHaveAttribute('tabIndex');
  });
});
