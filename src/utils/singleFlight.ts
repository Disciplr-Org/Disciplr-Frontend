/**
 * singleFlight.ts
 *
 * Prevents replay of a sensitive async operation: while one invocation is
 * in flight, concurrent callers receive the SAME promise instead of firing
 * the underlying operation again. This is the boundary guard against
 * double-submits of irreversible vault actions (validate / cancel), even if
 * the UI (or a hostile script) calls the seam more than once in a tick.
 */

export interface SingleFlightRunner<TArgs extends unknown[], TResult> {
  run: (...args: TArgs) => Promise<TResult>;
  isPending: () => boolean;
}

export interface SingleFlightOptions {
  /**
   * When true, concurrent calls with different arguments do not reuse the
   * in-flight promise. Instead, the latest arguments are captured and a
   * trailing execution is scheduled after the current one settles, so the
   * final requested state is applied exactly once.
   */
  trailing?: boolean;
  /**
   * Called whenever an execution settles. Useful for client telemetry.
   * `error` is set when the execution failed or was invalidated.
   */
  onSettled?: (info: { durationMs: number; error?: unknown }) => void;
}

/**
 * Wraps an async runner so overlapping calls are coalesced into one execution.
 * After the promise settles (resolve or reject) the runner becomes available
 * again, so a legitimate later action still executes.
 */
export function createSingleFlightRunner<TArgs extends unknown[], TResult>(
  runner: (...args: TArgs) => Promise<TResult>,
  options: SingleFlightOptions = {},
): SingleFlightRunner<TArgs, TResult> {
  let inflight: Promise<TResult> | null = null;
  let latestArgs: TArgs | undefined;
  let trailingPromise: Promise<TResult> | null = null;
  let resolveTrailing: ((value: TResult | PromiseLike<TResult>) => void) | undefined;
  let rejectTrailing: ((reason?: unknown) => void) | undefined;
  let trailingScheduled = false;

  const execute = (args: TArgs): Promise<TResult> => {
    const startedAt = Date.now();
    const tracked = Promise.resolve()
      .then(() => runner(...args))
      .then(
        (value) => {
          options.onSettled?.({ durationMs: Date.now() - startedAt, error: undefined });
          return value;
        },
        (error: unknown) => {
          options.onSettled?.({ durationMs: Date.now() - startedAt, error });
          throw error;
        },
      )
      .finally(() => {
        if (inflight === tracked) {
          inflight = null;
        }
      });
    inflight = tracked;
    return tracked;
  };

  const scheduleTrailing = (args: TArgs): Promise<TResult> => {
    latestArgs = args;

    if (!trailingPromise) {
      trailingPromise = new Promise<TResult>((resolve, reject) => {
        resolveTrailing = resolve;
        rejectTrailing = reject;
      });
    }

    if (!trailingScheduled && inflight) {
      trailingScheduled = true;
      const previousInflight = inflight;
      const scheduleNext = () => {
        trailingScheduled = false;
        const nextArgs = latestArgs;
        latestArgs = undefined;
        const pendingTrailing = trailingPromise;
        trailingPromise = null;
        const doResolve = resolveTrailing;
        const doReject = rejectTrailing;
        resolveTrailing = undefined;
        rejectTrailing = undefined;

        if (nextArgs && pendingTrailing && doResolve && doReject) {
          const trailingRun = execute(nextArgs);
          trailingRun.then(doResolve, doReject);
        } else if (pendingTrailing && doReject) {
          doReject(new Error('Single-flight trailing run was not scheduled'));
        }
      };
      previousInflight.then(scheduleNext, scheduleNext);
    }

    return trailingPromise;
  };

  const run = (...args: TArgs): Promise<TResult> => {
    if (inflight) {
      return options.trailing ? scheduleTrailing(args) : inflight;
    }
    latestArgs = undefined;
    trailingPromise = null;
    resolveTrailing = undefined;
    rejectTrailing = undefined;
    trailingScheduled = false;
    return execute(args);
  };

  return {
    run,
    isPending: () => inflight !== null || trailingPromise !== null,
  };
}