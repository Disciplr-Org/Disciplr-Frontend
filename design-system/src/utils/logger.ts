/**
 * Minimal Node-compatible logger for the design-system package.
 * Suppresses non-error levels when NODE_ENV=production.
 */

const isProd = () => process.env.NODE_ENV === 'production';

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
