import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import {
  TOAST_AUTO_DISMISS_MS,
  TOAST_QUEUE_LIMIT,
  useToastStore,
} from '../Store';

describe('useToastStore', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useToastStore.getState().clear();
  });

  afterEach(() => {
    useToastStore.getState().clear();
    vi.useRealTimers();
  });

  test('pushes a toast and auto-dismisses it after the configured timeout', () => {
    const id = useToastStore.getState().push({ kind: 'success', message: 'Saved.' });

    expect(useToastStore.getState().toasts).toEqual([
      expect.objectContaining({ id, kind: 'success', message: 'Saved.' }),
    ]);

    vi.advanceTimersByTime(TOAST_AUTO_DISMISS_MS - 1);
    expect(useToastStore.getState().toasts).toHaveLength(1);

    vi.advanceTimersByTime(1);
    expect(useToastStore.getState().toasts).toHaveLength(0);
  });

  test('dismiss removes a toast and cancels its auto-dismiss timer', () => {
    const id = useToastStore.getState().push({ kind: 'info', message: 'Disconnected.' });

    expect(vi.getTimerCount()).toBe(1);
    useToastStore.getState().dismiss(id);

    expect(useToastStore.getState().toasts).toHaveLength(0);
    expect(vi.getTimerCount()).toBe(0);
  });

  test('bounds the queue and cancels timers for dropped toasts', () => {
    const ids = Array.from({ length: TOAST_QUEUE_LIMIT + 1 }, (_, index) =>
      useToastStore.getState().push({ kind: 'info', message: `Toast ${index}` }),
    );

    const remainingIds = useToastStore.getState().toasts.map((toast) => toast.id);
    expect(remainingIds).toEqual(ids.slice(1));
    expect(vi.getTimerCount()).toBe(TOAST_QUEUE_LIMIT);
  });

  test('keeps rapid duplicate pushes as separately dismissible toasts', () => {
    const first = useToastStore.getState().push({ kind: 'error', message: 'Retry failed.' });
    const second = useToastStore.getState().push({ kind: 'error', message: 'Retry failed.' });

    expect(first).not.toBe(second);
    expect(useToastStore.getState().toasts).toEqual([
      expect.objectContaining({ id: first, message: 'Retry failed.' }),
      expect.objectContaining({ id: second, message: 'Retry failed.' }),
    ]);
  });
});
