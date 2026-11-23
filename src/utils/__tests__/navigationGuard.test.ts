import { afterEach, describe, expect, it } from 'vitest';
import {
  hasActiveNavigationGuard,
  registerNavigationGuard,
  resetNavigationGuards,
} from '../navigationGuard';

describe('navigationGuard', () => {
  afterEach(() => {
    resetNavigationGuards();
  });

  it('activates on register and clears when the returned unregister function is called', () => {
    expect(hasActiveNavigationGuard()).toBe(false);

    const unregister = registerNavigationGuard();
    expect(hasActiveNavigationGuard()).toBe(true);

    unregister();
    expect(hasActiveNavigationGuard()).toBe(false);
  });

  it('requires both registrations to unregister before clearing (StrictMode double mount)', () => {
    const unregisterFirst = registerNavigationGuard();
    const unregisterSecond = registerNavigationGuard();
    expect(hasActiveNavigationGuard()).toBe(true);

    unregisterFirst();
    expect(hasActiveNavigationGuard()).toBe(true);

    unregisterSecond();
    expect(hasActiveNavigationGuard()).toBe(false);
  });

  it('treats calling an unregister function twice as a no-op', () => {
    const unregisterFirst = registerNavigationGuard();
    const unregisterSecond = registerNavigationGuard();

    unregisterFirst();
    unregisterFirst();
    expect(hasActiveNavigationGuard()).toBe(true);

    unregisterSecond();
    unregisterSecond();
    expect(hasActiveNavigationGuard()).toBe(false);
  });

  it('clears all active guards on resetNavigationGuards()', () => {
    registerNavigationGuard();
    registerNavigationGuard();
    expect(hasActiveNavigationGuard()).toBe(true);

    resetNavigationGuards();
    expect(hasActiveNavigationGuard()).toBe(false);
  });
});
