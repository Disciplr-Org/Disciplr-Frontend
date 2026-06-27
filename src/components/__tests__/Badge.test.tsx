import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Badge, BadgeSize, BadgeTone } from '../Badge';

describe('Badge', () => {
  const toneExpectations: Record<BadgeTone, string> = {
    neutral: 'var(--muted)',
    info: 'var(--info)',
    success: 'var(--success)',
    warning: 'var(--warning)',
    danger: 'var(--danger)',
  };

  it('renders every tone with token-driven colors', () => {
    (Object.keys(toneExpectations) as BadgeTone[]).forEach((tone) => {
      const { unmount } = render(<Badge tone={tone}>{tone}</Badge>);
      const badge = screen.getByText(tone);

      expect(badge).toHaveClass('badge');
      expect(badge).toHaveStyle({ color: toneExpectations[tone] });

      unmount();
    });
  });

  it('applies the size scale', () => {
    const expectedSizes: Record<BadgeSize, { padding: string; fontSize: string; minHeight: string }> = {
      sm: { padding: '2px 8px', fontSize: '11px', minHeight: '22px' },
      md: { padding: '2px 10px', fontSize: '12px', minHeight: '24px' },
      lg: { padding: '4px 12px', fontSize: '14px', minHeight: '28px' },
    };

    (Object.keys(expectedSizes) as BadgeSize[]).forEach((size) => {
      const { unmount } = render(<Badge size={size}>{size}</Badge>);
      expect(screen.getByText(size)).toHaveStyle(expectedSizes[size]);
      unmount();
    });
  });

  it('adds a descriptive aria-label for numeric badges', () => {
    render(<Badge tone="info">{7}</Badge>);

    expect(screen.getByLabelText('Count: 7')).toHaveTextContent('7');
  });

  it('preserves zero-count accessibility', () => {
    render(<Badge tone="neutral">{0}</Badge>);

    expect(screen.getByLabelText('Count: 0')).toHaveTextContent('0');
  });

  it('allows callers to override the numeric aria-label', () => {
    render(
      <Badge tone="danger" aria-label="3 overdue validations">
        3
      </Badge>
    );

    expect(screen.getByLabelText('3 overdue validations')).toHaveTextContent('3');
  });

  it('merges className and inline style overrides', () => {
    render(
      <Badge className="queue-count" style={{ marginLeft: 4 }}>
        Queue
      </Badge>
    );

    const badge = screen.getByText('Queue');
    expect(badge).toHaveClass('badge');
    expect(badge).toHaveClass('queue-count');
    expect(badge).toHaveStyle({ marginLeft: '4px' });
  });
});
