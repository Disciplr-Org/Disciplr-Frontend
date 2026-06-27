/**
 * Thin logger that no-ops non-error levels in production.
 * Replace `console.*` calls with these so log level, suppression,
 * and future forwarding to an observability service can be controlled
 * from one place.
 *
 * Usage:
 *   import { logger } from '../utils/logger';
 *   logger.debug('Loading tokens');
 *   logger.info('Wallet connected', { address });
 *   logger.warn('No trustline found');
 *   logger.error('Connection failed', err);
 */

const isProd = () => import.meta.env.MODE === 'production';

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
