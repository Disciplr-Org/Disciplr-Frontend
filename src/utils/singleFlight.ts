/*
 * singleFlight.ts
 *
 * Prevents replay of a sensitive async operation: while one invocation is
 * in flight, concurrent callers with the same key receive the SAME promise
 * instead of firing the underlying operation again. This is the boundary
 * guard against double-submits of irreversible vault actions (validate /
 * cancel), even if the UI (or a hostile script) calls the seam more than once
 * in a tick.
 *
 * Invariants:
 *  - At most one underlying runner invocation is in flight per key at any
 *    time.
 *  - Concurrent callers with the same key within the same flight share the
 *    exact same promise (so they observe identical resolution/rejection
 *    and no duplicate side effects).
 *  - A concurrent caller with a different key while another flight is
 *    in flight is rejected immediately with an ActionInFlightError when
 *    `onConflict: 'reject'` is configured.
 *  - The flight is cleared on both resolve and reject, so a legitimate later
 *    action still executes.
 *  - A rejected flight does not poison future flights.
 */

/**
 * Typed error thrown when a conflicting call is made while a different
 * key is already in flight and the runner is configured with
 * `onConflict: 'reject'`.
 */
export class ActionInFlightError extends Error {
  readonly code = 'ACTION_IN_FLIGHT';
  readonly key: string;
  readonly activeKey: string;

  constructor(key: string, activeKey: string) {
    super(
      'Another vault action is still processing. Please wait.',
    );
    this.name = 'ActionInFlightError';
    this.key = key;
    this.activeKey = activeKey;
  }
}

export interface SingleFlightRunnerOptions<TArgs extends unknown[]> {
  /**
   * Derives the coalescing key from the call arguments. Defaults to a
   * constant, preserving the classic "share everything" behaviour (for loads).
   */
  key?: (...args: TArgs) => string;
  /**
   * How to handle a concurrent call with a different key while a flight is
   * in progress. Defaults to 'share' (legacy behaviour).
   */
  onConflict?: 'share' | 'reject';
}

export interface SingleFlightRunner<TArgs extends unknown[], TResult> {
  run: (...args: TArgs) => Promise<TResult>;
  /**
   * Reports whether any flight is in progress. When `vaultId` is provided,
   * only matches flights whose key ends with `:${vaultId}`. When `action`
   * is also provided, only matches that exact key.
   */
  isPending: (action?: string, vaultId?: string) => boolean;
}

const constantKey = (): string => '';

/**
 * Wraps an async runner so overlapping calls are coalesced into one
 * execution per key. After the promise settles (resolve or reject) the
 * runner becomes available again, so a legitimate later action still
 * executes.
 */
export function createSingleFlightRunner<TArgs extends unknown[], TResult>(
  runner: (...args: TArgs) => Promise<TResult>,
  options: SingleFlightRunnerOptions<TArgs> = {},
): SingleFlightRunner<TArgs, TResult> {
  if (typeof runner !== 'function') {
    throw new TypeError('createSingleFlightRunner: runner must be a function');
  }

  const keyFn = options.key ?? constantKey;
  const onConflict = options.onConflict ?? 'share';

  // Map key -> in-flight promise. Multiple distinct keys can be in
  // flight simultaneously only when onConflict is 'share' (the default
  // constant key means at most one entry in practice).
  const inflight = new Map<string, Promise<TResult>>();

  const run = (...args: TArgs): Promise<TResult> => {
    const key = keyFn(...args);

    const existing = inflight.get(key);
    if (existing) {
      return existing;
    }

    if (onConflict === 'reject' && inflight.size > 0) {
      // A different key is already in flight: reject immediately without
      // invoking the runner for this call.
      const activeKey = inflight.keys().next().value ?? '';
      return Promise.reject(new ActionInFlightError(key, activeKey));
    }

    // Capture the flight locally so the `finally` clearance only deletes
    // the slot if it still points at this flight. This prevents a stale
    // flight from clearing a newly started one in theoretical re-entrant
    // settlement orderings.
    const flight = Promise.resolve()
      .then(() => runner(...args))
      .finally(() => {
        if (inflight.get(key) === flight) {
          inflight.delete(key);
        }
      });
    inflight.set(key, flight);
    return flight;
  };

  const isPending = (action?: string, vaultId?: string): boolean => {
    if (action !== undefined && vaultId !== undefined) {
      return inflight.has(`${action}:${vaultId}`);
    }
    if (vaultId !== undefined) {
      const suffix = `:${vaultId}`;
      for (const key of inflight.keys()) {
        if (key.endsWith(suffix)) {
          return true;
        }
      }
      return false;
    }
    return inflight.size > 0;
  };

  return { run, isPending };
}
