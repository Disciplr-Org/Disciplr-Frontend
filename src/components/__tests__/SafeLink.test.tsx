import React from 'react';
import { render, screen } from '@testing-library/react';
import { SafeLink } from '../SafeLink';

describe('SafeLink component', () => {
  test('renders as anchor tag for safe URLs', () => {
    const url = 'https://example.com';
    render(<SafeLink href={url}>Link</SafeLink>);
    const link = screen.getByRole('link', { name: /link/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', url);
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  test('renders as span for unsafe URLs', () => {
    const url = 'javascript:alert(1)';
    render(<SafeLink href={url}>Link</SafeLink>);
    const link = screen.queryByRole('link', { name: /link/i });
    expect(link).not.toBeInTheDocument();
    const span = screen.getByText('[Invalid Link]');
    expect(span).toBeInTheDocument();
    expect(span).toHaveAttribute('title', `Rejected URL: ${url}`);
  });

  describe('safe URL attribute enforcement', () => {
    it('allows http URLs', () => {
      render(<SafeLink href="http://example.com">L</SafeLink>);
      expect(screen.getByRole('link')).toHaveAttribute('href', 'http://example.com');
    });

    it('renders children inside the anchor', () => {
      render(<SafeLink href="https://example.com">Click me</SafeLink>);
      expect(screen.getByRole('link', { name: 'Click me' })).toBeInTheDocument();
    });

    it('works with query string and fragment', () => {
      const url = 'https://example.com/path?q=1#section';
      render(<SafeLink href={url}>L</SafeLink>);
      expect(screen.getByRole('link')).toHaveAttribute('href', url);
    });

    it('caller-supplied target overrides _blank (props spread after defaults)', () => {
      // SafeLink spreads ...props after target/_blank, so caller wins
      render(<SafeLink href="https://example.com" target="_self">L</SafeLink>);
      expect(screen.getByRole('link')).toHaveAttribute('target', '_self');
    });

    it('caller-supplied rel overrides noopener noreferrer (props spread after defaults)', () => {
      // SafeLink spreads ...props after rel, so caller wins
      render(<SafeLink href="https://example.com" rel="nofollow">L</SafeLink>);
      expect(screen.getByRole('link')).toHaveAttribute('rel', 'nofollow');
    });
  });

  describe('unsafe URL scheme matrix', () => {
    const unsafeCases = [
      'javascript:alert(1)',
      'data:text/html,<h1>x</h1>',
      '',
      '   ',
    ];

    it.each(unsafeCases)('renders inert span for: %j', (url) => {
      render(<SafeLink href={url}>Child</SafeLink>);
      expect(screen.queryByRole('link')).not.toBeInTheDocument();
      const span = screen.getByText('[Invalid Link]');
      expect(span.tagName).toBe('SPAN');
      expect(span).toHaveAttribute('title', `Rejected URL: ${url}`);
    });

    it('does not render children in the inert branch', () => {
      render(<SafeLink href="javascript:void(0)">Secret</SafeLink>);
      expect(screen.queryByText('Secret')).not.toBeInTheDocument();
    });

    // userinfo URLs (https://user:pass@host) parse as https: so isSafeEvidenceUrl returns true
    it('treats userinfo-bearing https URL as safe (protocol is still https:)', () => {
      render(<SafeLink href="https://user:pass@example.com">L</SafeLink>);
      expect(screen.getByRole('link')).toHaveAttribute('href', 'https://user:pass@example.com');
    });
  });
});
