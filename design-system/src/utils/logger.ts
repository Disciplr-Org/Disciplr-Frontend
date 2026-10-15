/**
 * Canonical runtime-agnostic logger shared by the design-system and app.
 *
 * Detects production via Vite's compile-time process.env.NODE_ENV replacement
 * or the Node runtime value, so it works in both runtimes from one source.
 *
 * The app re-exports this module from src/utils/logger.ts rather than
 * maintaining its own copy. When changing behaviour here, confirm both
 * packages' tests still pass before merging.
 *
 */

const isProd = (): boolean => {
  // Vite replaces this expression with a string literal in application builds.
  // In Node/Jest it reads the runtime environment; in an unbundled browser,
  // the missing process global is safely ignored.
  try {
    if (process.env.NODE_ENV === 'production') {
      return true;
    }
  } catch {
    // `process` is not defined in an unbundled browser runtime.
  }

  return false;
};

/* eslint-disable no-console */
export const logger = {
  debug: (...args: unknown[]): void => {
    if (!isProd()) console.debug(...args);
  },
  info: (...args: unknown[]): void => {
    if (!isProd()) console.info(...args);
  },
  warn: (...args: unknown[]): void => {
    if (!isProd()) console.warn(...args);
  },
  error: (...args: unknown[]): void => {
    console.error(...args);
  },
};
/* eslint-enable no-console */
