/**
 * Minimal logger for the design-system package.
 * Suppresses non-error levels when running in a production build.
 */

const isProd = () => {
  if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'production') {
    return true;
  }

  const viteEnv = (import.meta as ImportMeta & {
    env?: { MODE?: string; PROD?: boolean };
  }).env;

  return viteEnv?.MODE === 'production' || viteEnv?.PROD === true;
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
