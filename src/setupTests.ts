import '@testing-library/jest-dom';
import { vi } from 'vitest';
import React from 'react';

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

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
