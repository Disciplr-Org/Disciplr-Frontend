import '@testing-library/jest-dom';
import { vi } from 'vitest';
import React from 'react';

if (typeof window !== 'undefined' && typeof window.matchMedia !== 'function') {
  window.matchMedia = (query: string): MediaQueryList =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }) as unknown as MediaQueryList;
}

vi.mock('focus-trap-react', () => ({
  default: ({
    children,
    focusTrapOptions,
  }: {
    children: React.ReactNode;
    focusTrapOptions?: { onDeactivate?: () => void };
  }) => {
    return React.createElement(
      'div',
      {
        'data-testid': 'focus-trap',
        onKeyDown: (event: React.KeyboardEvent) => {
          if (event.key === 'Escape') {
            focusTrapOptions?.onDeactivate?.();
          }
        },
      },
      children
    );
  },
}));
