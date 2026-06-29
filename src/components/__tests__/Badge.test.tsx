import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Badge } from '../Badge';

describe('Badge', () => {
  it.each([
    ['neutral', 'sm', 'var(--muted)', 'color-mix(in srgb, var(--muted) 10%, transparent)'],
    ['info', 'md', 'var(--info)', 'color-mix(in srgb, var(--info) 10%, transparent)'],
    ['success', 'lg', 'var(--success)', 'color-mix(in srgb, var(--success) 10%, transparent)'],
    ['warning', 'sm', 'var(--warning)', 'color-mix(in srgb, var(--warning) 10%, transparent)'],
    ['danger', 'md', 'var(--danger)', 'color-mix(in srgb, var(--danger) 10%, transparent)'],
  ] as const)('renders %s tone with %s size', (tone, size, color, background) => {
    render(
      <Badge tone={tone} size={size}>
        {tone}
      </Badge>
    );

    const badge = screen.getByText(tone);
    expect(badge).toHaveStyle({
      color,
      background,
      border: `1px solid ${color}`,
      padding: size === 'sm' ? '2px 8px' : size === 'md' ? '2px 10px' : '4px 12px',
      fontSize: size === 'sm' ? '11px' : size === 'md' ? '12px' : '14px',
    });
  });

  it('uses an accessible aria-label for numeric badges', () => {
    render(<Badge count={7}>7</Badge>);

    const badge = screen.getByLabelText('Count: 7');
    expect(badge).toHaveTextContent('7');
  });

  it('renders zero counts without dropping them', () => {
    render(<Badge count={0}>0</Badge>);

    const badge = screen.getByLabelText('Count: 0');
    expect(badge).toHaveTextContent('0');
  });
});
