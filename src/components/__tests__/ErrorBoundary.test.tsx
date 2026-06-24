import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { ErrorBoundary } from '../ErrorBoundary';

function ProblemChild({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('route exploded');
  }

  return <div>Recovered route</div>;
}

function NestedShell({ children }: { children: ReactNode }) {
  return <div>{children}</div>;
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders an accessible fallback and reports render errors', () => {
    const reporter = vi.fn();

    render(
      <MemoryRouter>
        <ErrorBoundary reporter={reporter}>
          <ProblemChild shouldThrow />
        </ErrorBoundary>
      </MemoryRouter>,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong');
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Go Home' })).toHaveAttribute('href', '/');
    expect(reporter).toHaveBeenCalledTimes(1);
    expect(reporter.mock.calls[0][0]).toHaveProperty('message', 'route exploded');
    expect(reporter.mock.calls[0][1].componentStack).toContain('ProblemChild');
  });

  it('resets boundary state so recovered children can render', () => {
    const reporter = vi.fn();
    const { rerender } = render(
      <MemoryRouter>
        <ErrorBoundary reporter={reporter}>
          <ProblemChild shouldThrow />
        </ErrorBoundary>
      </MemoryRouter>,
    );

    rerender(
      <MemoryRouter>
        <ErrorBoundary reporter={reporter}>
          <ProblemChild shouldThrow={false} />
        </ErrorBoundary>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(screen.getByText('Recovered route')).toBeInTheDocument();
  });

  it('catches nested render errors', () => {
    render(
      <MemoryRouter>
        <ErrorBoundary reporter={vi.fn()}>
          <NestedShell>
            <ProblemChild shouldThrow />
          </NestedShell>
        </ErrorBoundary>
      </MemoryRouter>,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('unexpected rendering error');
  });
});
