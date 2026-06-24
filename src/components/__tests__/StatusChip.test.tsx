import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StatusChip } from '../StatusChip';
import type { StatusChipStatus } from '../StatusChip';

const statusCases: Array<[StatusChipStatus, string, string]> = [
  ['active', 'Active', 'var(--accent)'],
  ['pending_validation', 'Pending Validation', 'var(--warning)'],
  ['completed', 'Completed', 'var(--success)'],
  ['failed', 'Failed', 'var(--danger)'],
  ['cancelled', 'Cancelled', 'var(--muted)'],
  ['approved', 'Approved', 'var(--success)'],
  ['rejected', 'Rejected', 'var(--danger)'],
];

describe('StatusChip', () => {
  it.each(statusCases)('renders %s with its label and semantic token', (status, label, color) => {
    render(<StatusChip status={status} />);

    const chip = screen.getByLabelText(`Status: ${label}`);
    expect(chip).toHaveTextContent(label);
    expect(chip).toHaveStyle({ color });
  });

  it('supports the compact size variant', () => {
    render(<StatusChip status="active" size="sm" />);

    expect(screen.getByLabelText('Status: Active')).toHaveStyle({
      padding: '2px 8px',
      fontSize: '11px',
    });
  });

  it('allows legacy labels while keeping status token styling', () => {
    render(<StatusChip status="pending_validation" label="Pending" />);

    const chip = screen.getByLabelText('Status: Pending');
    expect(chip).toHaveTextContent('Pending');
    expect(chip).toHaveStyle({ color: 'var(--warning)' });
  });

  it('falls back for unexpected runtime statuses', () => {
    render(<StatusChip status={'archived' as StatusChipStatus} />);

    const chip = screen.getByLabelText('Status: Unknown');
    expect(chip).toHaveTextContent('Unknown');
    expect(chip).toHaveStyle({ color: 'var(--muted)' });
  });
});
