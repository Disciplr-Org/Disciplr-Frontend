import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useCurrentTime } from '../useCurrentTime';

describe('useCurrentTime', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns current time and advances by the default 60000ms interval', () => {
    const start = Date.now();
    const { result } = renderHook(() => useCurrentTime());

    expect(result.current).toBe(start);

    act(() => {
      vi.advanceTimersByTime(59999);
    });
    expect(result.current).toBe(start);

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current).toBe(start + 60000);
  });

  it('supports a custom interval and stops ticking after unmount', () => {
    const clearIntervalSpy = vi.spyOn(window, 'clearInterval');
    const start = Date.now();
    const { result, unmount } = renderHook(() => useCurrentTime(1000));

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current).toBe(start + 1000);

    unmount();
    expect(clearIntervalSpy).toHaveBeenCalledTimes(1);

    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(result.current).toBe(start + 1000);

    clearIntervalSpy.mockRestore();
  });
});
