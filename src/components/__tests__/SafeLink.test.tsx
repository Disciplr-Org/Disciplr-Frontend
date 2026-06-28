import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { SafeLink } from '../SafeLink';

describe('SafeLink component', () => {
  describe('safe URLs', () => {
    test('renders an anchor with enforced target/rel for https URLs', () => {
      const url = 'https://example.com';
      render(<SafeLink href={url}>Link</SafeLink>);
      const link = screen.getByRole('link', { name: /link/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', url);
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });

    test('renders an anchor for http URLs', () => {
      const url = 'http://example.com';
      render(<SafeLink href={url}>Link</SafeLink>);
      expect(screen.getByRole('link', { name: /link/i })).toHaveAttribute('href', url);
    });

    test('accepts a valid URL with a query string', () => {
      const url = 'https://example.com/search?q=test&page=2';
      render(<SafeLink href={url}>Query</SafeLink>);
      expect(screen.getByRole('link', { name: /query/i })).toHaveAttribute('href', url);
    });

    test('enforces target/rel even when the caller passes conflicting props', () => {
      render(
        <SafeLink href="https://example.com" target="_self" rel="opener">
          Link
        </SafeLink>,
      );
      const link = screen.getByRole('link', { name: /link/i });
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });

    test('forwards non-conflicting props such as className', () => {
      render(
        <SafeLink href="https://example.com" className="evidence-link">
          Link
        </SafeLink>,
      );
      expect(screen.getByRole('link', { name: /link/i })).toHaveClass('evidence-link');
    });

    test('renders children in the safe branch', () => {
      render(
        <SafeLink href="https://example.com">
          <span>Open evidence</span>
        </SafeLink>,
      );
      expect(screen.getByText('Open evidence')).toBeInTheDocument();
    });
  });

  describe('unsafe URLs render inert [Invalid Link]', () => {
    const unsafeUrls: Array<[string, string]> = [
      ['javascript: scheme', 'javascript:alert(1)'],
      ['data: scheme', 'data:text/html,<script>alert(1)</script>'],
      ['empty string', ''],
      ['whitespace only', '   '],
      ['userinfo-bearing', 'https://trusted.com@evil.com'],
      ['userinfo with password', 'https://user:pass@example.com'],
      ['missing scheme', 'example.com/evidence'],
    ];

    test.each(unsafeUrls)('rejects %s as an inert span with rejected-URL title', (_label, url) => {
      render(<SafeLink href={url}>Link</SafeLink>);

      expect(screen.queryByRole('link')).not.toBeInTheDocument();
      const span = screen.getByText('[Invalid Link]');
      expect(span).toBeInTheDocument();
      expect(span).toHaveAttribute('title', `Rejected URL: ${url}`);
    });

    test('does not render caller children in the unsafe branch', () => {
      render(
        <SafeLink href="javascript:alert(1)">
          <span>Open evidence</span>
        </SafeLink>,
      );
      expect(screen.queryByText('Open evidence')).not.toBeInTheDocument();
      expect(screen.getByText('[Invalid Link]')).toBeInTheDocument();
    });
  });
});
