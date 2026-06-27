import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import { Text } from '../Text';

describe('Text', () => {
  test('renders a span by default with the resolved typography class', () => {
    render(<Text role="body">Body copy</Text>);

    const text = screen.getByText('Body copy');

    expect(text.tagName).toBe('SPAN');
    expect(text).toHaveClass('text-body');
  });

  test('renders the requested polymorphic element via the as prop', () => {
    render(
      <>
        <Text role="display" as="h1">
          Hero title
        </Text>
        <Text role="caption" as="p">
          Helper text
        </Text>
      </>,
    );

    expect(screen.getByRole('heading', { level: 1, name: 'Hero title' })).toHaveClass(
      'text-display',
    );
    expect(screen.getByText('Helper text').tagName).toBe('P');
    expect(screen.getByText('Helper text')).toHaveClass('text-caption');
  });

  test('appends caller className after the typography class with a single space', () => {
    render(
      <Text role="title" className="tracking-tight text-slate-900">
        Section title
      </Text>,
    );

    const text = screen.getByText('Section title');

    expect(text.getAttribute('class')).toBe('text-title tracking-tight text-slate-900');
  });

  test('forwards refs to the rendered DOM node', () => {
    const ref = React.createRef<HTMLParagraphElement>();

    render(
      <Text role="subtitle" as="p" ref={ref}>
        Ref target
      </Text>,
    );

    expect(ref.current).toBe(screen.getByText('Ref target'));
    expect(ref.current?.tagName).toBe('P');
  });

  test('passes arbitrary HTML attributes through to the rendered element', () => {
    render(
      <Text
        role="mono"
        as="code"
        id="tx-hash"
        style={{ letterSpacing: '0.02em' }}
        data-testid="mono-text"
      >
        abc123
      </Text>,
    );

    const text = screen.getByTestId('mono-text');

    expect(text.tagName).toBe('CODE');
    expect(text).toHaveAttribute('id', 'tx-hash');
    expect(text).toHaveStyle({ letterSpacing: '0.02em' });
    expect(text).toHaveClass('text-mono');
  });
});
