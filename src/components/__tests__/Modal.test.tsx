import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { Modal } from '../Modal';
import { useReducedMotion } from 'framer-motion';

vi.mock('framer-motion', async (importOriginal) => {
  const original = await importOriginal<typeof import('framer-motion')>();
  return {
    ...original,
    useReducedMotion: vi.fn(),
    AnimatePresence: ({ children }: { children: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),
    motion: {
      div: ({ children, ...props }: any) => {
        const { initial, animate, exit, variants, transition, ...rest } = props;
        return React.createElement('div', rest, children);
      },
    },
  };
});

describe('Modal', () => {
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders children when open', () => {
    render(
      <Modal isOpen={true} onClose={onClose}>
        <div data-testid="modal-content">Hello Content</div>
      </Modal>
    );

    expect(screen.getByTestId('modal-content')).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
  });

  it('does not render when closed', () => {
    render(
      <Modal isOpen={false} onClose={onClose}>
        <div data-testid="modal-content">Hello Content</div>
      </Modal>
    );

    expect(screen.queryByTestId('modal-content')).not.toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('calls onClose when clicking the backdrop overlay', () => {
    render(
      <Modal isOpen={true} onClose={onClose}>
        <div data-testid="modal-content">Hello Content</div>
      </Modal>
    );

    const overlay = screen.getByRole('dialog');
    fireEvent.click(overlay);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose when clicking the content area', () => {
    render(
      <Modal isOpen={true} onClose={onClose}>
        <button data-testid="modal-content">Hello Content</button>
      </Modal>
    );

    const content = screen.getByTestId('modal-content');
    fireEvent.click(content);

    expect(onClose).not.toHaveBeenCalled();
  });

  it('calls onClose on Escape key press (through focus trap deactivation)', () => {
    render(
      <Modal isOpen={true} onClose={onClose}>
        <div data-testid="modal-content">Hello Content</div>
      </Modal>
    );

    const focusTrap = screen.getByTestId('focus-trap');
    fireEvent.keyDown(focusTrap, { key: 'Escape' });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('supports custom overlay and content class names', () => {
    render(
      <Modal
        isOpen={true}
        onClose={onClose}
        overlayClassName="custom-overlay-class"
        contentClassName="custom-content-class"
      >
        <div>Hello Content</div>
      </Modal>
    );

    const overlay = screen.getByRole('dialog');
    expect(overlay).toHaveClass('custom-overlay-class');

    const contentContainer = overlay.firstChild;
    expect(contentContainer).toHaveClass('custom-content-class');
  });

  it('respects reduced-motion preference', () => {
    const useReducedMotionMock = vi.mocked(useReducedMotion);
    useReducedMotionMock.mockReturnValue(true);

    render(
      <Modal isOpen={true} onClose={onClose}>
        <div>Hello Content</div>
      </Modal>
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('moves initial focus to the first focusable element inside the dialog', () => {
    render(
      <Modal isOpen={true} onClose={onClose}>
        <input data-testid="input-1" />
        <button data-testid="button-1">Button</button>
      </Modal>
    );

    expect(document.activeElement).toBe(screen.getByTestId('input-1'));
  });

  it('falls back to focusing the focus-trap container when no focusable children exist', () => {
    render(
      <Modal isOpen={true} onClose={onClose}>
        <div data-testid="modal-content">No focusable elements</div>
      </Modal>
    );

    const focusTrap = screen.getByTestId('focus-trap');
    expect(document.activeElement).toBe(focusTrap);
  });

  it('cycles focus forward on Tab and wraps around', () => {
    render(
      <Modal isOpen={true} onClose={onClose}>
        <input data-testid="input-1" />
        <button data-testid="button-1">Button</button>
      </Modal>
    );

    const input1 = screen.getByTestId('input-1');
    const button1 = screen.getByTestId('button-1');
    const focusTrap = screen.getByTestId('focus-trap');

    expect(document.activeElement).toBe(input1);

    fireEvent.keyDown(focusTrap, { key: 'Tab' });
    expect(document.activeElement).toBe(button1);

    fireEvent.keyDown(focusTrap, { key: 'Tab' });
    expect(document.activeElement).toBe(input1);
  });

  it('cycles focus backward on Shift+Tab and wraps around', () => {
    render(
      <Modal isOpen={true} onClose={onClose}>
        <input data-testid="input-1" />
        <button data-testid="button-1">Button</button>
      </Modal>
    );

    const input1 = screen.getByTestId('input-1');
    const button1 = screen.getByTestId('button-1');
    const focusTrap = screen.getByTestId('focus-trap');

    expect(document.activeElement).toBe(input1);

    fireEvent.keyDown(focusTrap, { key: 'Tab' });
    expect(document.activeElement).toBe(button1);

    fireEvent.keyDown(focusTrap, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(input1);

    fireEvent.keyDown(focusTrap, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(button1);
  });

  it('restores focus to the trigger element after closing', () => {
    const trigger = document.createElement('button');
    trigger.textContent = 'Open Modal';
    document.body.appendChild(trigger);
    trigger.focus();

    const { rerender, unmount } = render(
      <Modal isOpen={true} onClose={onClose}>
        <button data-testid="modal-button">Modal Button</button>
      </Modal>
    );

    expect(document.activeElement).toBe(screen.getByTestId('modal-button'));

    rerender(
      <Modal isOpen={false} onClose={onClose}>
        <button data-testid="modal-button">Modal Button</button>
      </Modal>
    );

    expect(document.activeElement).toBe(trigger);

    document.body.removeChild(trigger);
  });
});
