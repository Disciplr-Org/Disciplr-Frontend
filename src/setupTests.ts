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

vi.mock('focus-trap-react', () => {
  const FocusTrapMock: React.FC<{
    children: React.ReactNode;
    focusTrapOptions?: { onDeactivate?: () => void };
  }> = ({ children, focusTrapOptions }) => {
    const containerRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
      const previousActiveElement = document.activeElement;
      const container = containerRef.current;
      if (container) {
        const focusable = container.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length > 0) {
          focusable[0].focus();
        } else {
          container.setAttribute('tabindex', '-1');
          container.focus();
        }
      }

      return () => {
        if (
          previousActiveElement &&
          previousActiveElement !== document.body &&
          'focus' in previousActiveElement
        ) {
          (previousActiveElement as HTMLElement).focus();
        }
      };
    }, []);

    const handleKeyDown = (event: React.KeyboardEvent) => {
      if (event.key === 'Escape') {
        focusTrapOptions?.onDeactivate?.();
        return;
      }

      if (event.key === 'Tab') {
        const container = containerRef.current;
        if (!container) return;

        const focusable = container.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) {
          event.preventDefault();
          return;
        }

        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        const active = document.activeElement;
        let nextIndex = -1;

        for (let i = 0; i < focusable.length; i++) {
          if (focusable[i] === active) {
            nextIndex = i;
            break;
          }
        }

        event.preventDefault();

        if (event.shiftKey) {
          if (nextIndex <= 0) {
            last.focus();
          } else {
            focusable[nextIndex - 1].focus();
          }
        } else {
          if (nextIndex === -1 || nextIndex >= focusable.length - 1) {
            first.focus();
          } else {
            focusable[nextIndex + 1].focus();
          }
        }
      }
    };

    return React.createElement(
      'div',
      {
        ref: containerRef,
        'data-testid': 'focus-trap',
        onKeyDown: handleKeyDown,
      },
      children
    );
  };

  return { default: FocusTrapMock };
});
