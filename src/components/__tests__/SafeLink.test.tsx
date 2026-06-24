import React from 'react';
import { render, screen } from '@testing-library/react';
import { SafeLink } from '../SafeLink';

describe('SafeLink component', () => {
  test('renders as anchor tag for safe URLs with external-link protections', () => {
    const url = 'https://example.com';
    render(<SafeLink href={url}>Link</SafeLink>);
    const link = screen.getByRole('link', { name: /link/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', url);
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  test.each([
    ['javascript:alert(1)', 'unsupported protocol'],
    ['https://user:pass@example.com/evidence', 'embedded credentials'],
    ['https://xn--pple-43d.com/evidence', 'punycode or IDN host'],
    ['https://example.com:8443/evidence', 'unexpected port'],
    ['http://127.0.0.1/evidence', 'IP literal host'],
  ])('renders %s as inert text with the %s reason', (url, reasonLabel) => {
    render(<SafeLink href={url}>Link</SafeLink>);

    const link = screen.queryByRole('link', { name: /link/i });
    expect(link).not.toBeInTheDocument();

    const span = screen.getByText('[Invalid Link]');
    expect(span).toBeInTheDocument();
    expect(span).toHaveAttribute('title', `Rejected URL (${reasonLabel}): ${url}`);
  });
});
