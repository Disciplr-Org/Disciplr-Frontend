import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useOnRecovered } from '../useOnRecovered';
import { useConnectivityStore } from '../../services/connectivity';

describe('useOnRecovered', () => {
  beforeEach(() => {
    useConnectivityStore.getState().reset();
    vi.stubEnv('VITE_API', 'https://api.disciplr.test');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    useConnectivityStore.getState().reset();
  });

  it('fires exactly once when transitioning from offline to online, and not on online to online', () => {
    const onRecovered = vi.fn();
    renderHook(() => useOnRecovered(onRecovered));

    expect(onRecovered).not.toHaveBeenCalled();

    act(() => {
      useConnectivityStore.setState({ status: 'online' });
    });
    expect(onRecovered).not.toHaveBeenCalled();

    act(() => {
      useConnectivityStore.setState({ status: 'offline' });
    });
    expect(onRecovered).not.toHaveBeenCalled();

    act(() => {
      useConnectivityStore.setState({ status: 'online' });
    });
    expect(onRecovered).toHaveBeenCalledTimes(1);

    // Subsequent online update does not re-trigger
    act(() => {
      useConnectivityStore.setState({ status: 'online' });
    });
    expect(onRecovered).toHaveBeenCalledTimes(1);
  });

  it('does not fire when VITE_API is unset', () => {
    vi.stubEnv('VITE_API', '');
    const onRecovered = vi.fn();
    renderHook(() => useOnRecovered(onRecovered));

    act(() => {
      useConnectivityStore.setState({ status: 'offline' });
    });
    act(() => {
      useConnectivityStore.setState({ status: 'online' });
    });

    expect(onRecovered).not.toHaveBeenCalled();
  });

  it('always calls the latest callback reference', () => {
    const firstCallback = vi.fn();
    const secondCallback = vi.fn();

    const { rerender } = renderHook(({ cb }) => useOnRecovered(cb), {
      initialProps: { cb: firstCallback },
    });

    act(() => {
      useConnectivityStore.setState({ status: 'api-down' });
    });

    rerender({ cb: secondCallback });

    act(() => {
      useConnectivityStore.setState({ status: 'online' });
    });

    expect(firstCallback).not.toHaveBeenCalled();
    expect(secondCallback).toHaveBeenCalledTimes(1);
  });
});
