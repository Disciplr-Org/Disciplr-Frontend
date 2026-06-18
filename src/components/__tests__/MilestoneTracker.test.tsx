import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import MilestoneTracker, { type Milestone } from '../MilestoneTracker';

describe('MilestoneTracker', () => {
  const milestones: Milestone[] = [
    {
      id: 'm1',
      title: 'Phase 1',
      description: 'Complete phase one',
      criteria: 'Ship the first build',
      status: 'validated',
      validatedAt: '2026-06-18T00:00:00Z',
      evidenceUrl: 'https://example.com/evidence-1',
    },
    {
      id: 'm2',
      title: 'Phase 2',
      description: 'Complete phase two',
      criteria: 'Ship the second build',
      status: 'pending',
    },
    {
      id: 'm3',
      title: 'Phase 3',
      description: 'Complete phase three',
      criteria: 'Ship the last build',
      status: 'failed',
    },
  ];

  it('renders an empty state when no milestones exist', () => {
    render(<MilestoneTracker milestones={[]} />);

    expect(screen.getByText('No milestones available.')).toBeInTheDocument();
  });

  it('renders milestone details, status badges, and evidence links', () => {
    render(<MilestoneTracker milestones={milestones} />);

    expect(screen.getByText('1. Phase 1')).toBeInTheDocument();
    expect(screen.getByText('Validated')).toBeInTheDocument();
    expect(screen.getByText(/Validated Jun 18, 2026/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View evidence ↗' })).toHaveAttribute(
      'href',
      'https://example.com/evidence-1',
    );
  });

  it('marks the first pending milestone as the current step', () => {
    render(<MilestoneTracker milestones={milestones} />);

    expect(screen.getByText('2. Phase 2').closest('li')).toHaveAttribute(
      'aria-current',
      'step',
    );
  });

  it('keeps failed and validated milestones unmarked', () => {
    render(<MilestoneTracker milestones={milestones} />);

    expect(screen.getByText('1. Phase 1').closest('li')).not.toHaveAttribute('aria-current');
    expect(screen.getByText('3. Phase 3').closest('li')).not.toHaveAttribute('aria-current');
  });

  it('does not mark a current step when no pending milestone follows validation', () => {
    render(
      <MilestoneTracker
        milestones={[
          { ...milestones[0], status: 'validated' },
          { ...milestones[2], status: 'failed' },
        ]}
      />,
    );

    expect(screen.getByText('1. Phase 1').closest('li')).not.toHaveAttribute('aria-current');
    expect(screen.getByText('2. Phase 3').closest('li')).not.toHaveAttribute('aria-current');
  });
});
