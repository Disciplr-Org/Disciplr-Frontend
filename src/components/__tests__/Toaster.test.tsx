import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { Toaster } from '../Toaster';
import { TOAST_AUTO_DISMISS_MS, useToastStore } from '../../Zustand/Store';

describe('Toaster', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useToastStore.getState().clear();
  });

  afterEach(() => {
    useToastStore.getState().clear();
    vi.useRealTimers();
  });

  test('renders polite status toasts and assertive error toasts', () => {
    act(() => {
      useToastStore.getState().push({ kind: 'success', message: 'Wallet connected.' });
      useToastStore.getState().push({ kind: 'error', message: 'Wallet access denied.' });
    });

    render(<Toaster />);

    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
    expect(screen.getByRole('status')).toHaveTextContent('Wallet connected.');
    expect(screen.getByRole('alert')).toHaveAttribute('aria-live', 'assertive');
    expect(screen.getByRole('alert')).toHaveTextContent('Wallet access denied.');
  });

  test('dismisses a toast from the keyboard-accessible close button', () => {
    act(() => {
      useToastStore.getState().push({ kind: 'info', message: 'Wallet disconnected.' });
    });

    render(<Toaster />);
    fireEvent.click(screen.getByRole('button', { name: /dismiss info toast/i }));

    expect(screen.queryByText('Wallet disconnected.')).not.toBeInTheDocument();
  });

  test('removes toasts when the store auto-dismiss timer fires', () => {
    act(() => {
      useToastStore.getState().push({ kind: 'success', message: 'Validation approved.' });
    });

    render(<Toaster />);
    expect(screen.getByText('Validation approved.')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(TOAST_AUTO_DISMISS_MS);
    });

    expect(screen.queryByText('Validation approved.')).not.toBeInTheDocument();
  });
});
