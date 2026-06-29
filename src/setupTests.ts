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
