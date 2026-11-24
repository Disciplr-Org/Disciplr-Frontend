import { logger } from './logger';
import { createReferenceId } from './referenceId';
import { normalisePathname, resolveVitalsEndpoint } from './vitalsSink';
import { useToastStore } from '../Zustand/toastStore';

/**
 * Central error reporting for the app.
 *
 * Invariants
 * ----------
 * 1. The reporter never throws. Every failure mode (a throwing sink, a throwing
 *    logger, a throwing toast store, a hostile rejection reason) is swallowed —
 *    reporting must not become a second fault while the app is already broken.
 * 2. Nothing sensitive is recorded. Wallet addresses are redacted before the
 *    report reaches the logger or a sink, and messages are length-capped.
 * 3. Memory is bounded: at most `ERROR_REPORT_BUFFER_LIMIT` reports are kept,
 *    mirroring the wallet telemetry ring buffer.
 * 4. Duplicate noise is throttled: identical failures inside
 *    `ERROR_REPORT_NOTIFY_WINDOW_MS` produce a single user-visible toast.
 *
 * Reports always go to the shared logger so a reference ID shown in the UI can
 * be correlated, and additionally to an opt-in sink (`setErrorReportSink`) for
 * a future backend. No vendor SDK is involved.
 */

export type ErrorReportSource = 'boundary' | 'window' | 'promise';

export interface ErrorReportInput {
  /** The thrown value. May be a non-Error (rejection reasons often are). */
  error: unknown;
  source: ErrorReportSource;
  /** The ID shown to the user; generated when the caller does not supply one. */
  referenceId?: string;
  /** Route the failure happened on, for support triage. */
  route?: string;
  /** React component stack, when the failure came from a boundary. */
  componentStack?: string;
}

export interface ErrorReport {
  referenceId: string;
  source: ErrorReportSource;
  /** Normalised error name (`Error` for non-Error reasons). */
  name: string;
  /** Redacted, truncated message. */
  message: string;
  route?: string;
  componentStack?: string;
  /** Epoch milliseconds. */
  ts: number;
}

type ErrorReportSink = (report: ErrorReport) => void;

export const DEFAULT_ERROR_SAMPLE_RATE = 0.1;
export const ERROR_REPORT_SEND_WINDOW_MS = 60_000;

export interface ErrorReportingEnv {
  readonly VITE_ERROR_ENDPOINT?: string;
  readonly VITE_ERROR_SAMPLE_RATE?: string;
  readonly VITE_APP_VERSION?: string;
}

export interface CreateErrorReportingSinkOptions {
  env?: ErrorReportingEnv;
  rng?: () => number;
  sendBeacon?: (url: string, body: Blob) => boolean;
  fetch?: (url: string, init: RequestInit) => Promise<unknown>;
  logger?: Pick<typeof logger, 'info' | 'warn' | 'error'>;
  pathname?: () => string;
  now?: () => number;
  appVersion?: string;
}

export interface ErrorReportingPayload {
  referenceId: string;
  name: string;
  message: string;
  route: string;
  appVersion: string;
  ts: number;
}

export interface ErrorReportingSink {
  report(report: ErrorReport): void;
  readonly active: boolean;
}

/** Hard cap on the in-memory diagnostics buffer. */
export const ERROR_REPORT_BUFFER_LIMIT = 20;
/** Identical failures inside this window collapse into one toast. */
export const ERROR_REPORT_NOTIFY_WINDOW_MS = 5_000;
/** Bound on the throttle map so a flood of distinct errors cannot grow it. */
export const ERROR_REPORT_THROTTLE_KEY_LIMIT = 100;
/** Cap on recorded message / component-stack length. */
export const ERROR_REPORT_MAX_TEXT_LENGTH = 500;

/**
 * Minimal local redaction: a Stellar StrKey (G.../C...) is the only user data
 * that realistically ends up embedded in an error message here. The logger has
 * no shared scrubber yet, so this stays local to the reporter.
 */
const STELLAR_STRKEY_PATTERN = /\b[GC][A-Z2-7]{55}\b/g;

export function redactErrorText(value: string): string {
  return value
    .replace(STELLAR_STRKEY_PATTERN, '[redacted-address]')
    .replace(/(\bhttps?:\/\/[^\s?#]+)\?[^\s#]+/gi, '$1')
    .replace(/([?&](?:wallet|address|token|secret|key|account|amount|q|query)=)[^\s&#]+/gi, '$1[redacted-query]');
}

function truncate(value: string): string {
  if (value.length <= ERROR_REPORT_MAX_TEXT_LENGTH) return value;
  return `${value.slice(0, ERROR_REPORT_MAX_TEXT_LENGTH)}…`;
}

/**
 * Normalises any thrown value into a name/message pair. `unhandledrejection`
 * reasons are arbitrary values (strings, plain objects, `undefined`), so the
 * reporter must never assume `instanceof Error`.
 */
export function normalizeErrorReason(reason: unknown): { name: string; message: string } {
  if (reason instanceof Error) {
    return { name: reason.name || 'Error', message: reason.message || String(reason) };
  }
  if (typeof reason === 'string') {
    return { name: 'Error', message: reason };
  }
  if (reason === null || reason === undefined) {
    return { name: 'Error', message: String(reason) };
  }
  try {
    const serialized = JSON.stringify(reason);
    if (typeof serialized === 'string') {
      return { name: 'Error', message: serialized };
    }
  } catch {
    // Circular or otherwise unserialisable — fall back to the type tag.
  }
  return { name: 'Error', message: Object.prototype.toString.call(reason) };
}

const defaultSink: ErrorReportSink = () => {
  // The logger write below is mandatory; the default sink adds nothing.
};

let sink: ErrorReportSink = defaultSink;
const recentReports: ErrorReport[] = [];
const lastNotifiedAt = new Map<string, number>();

function currentRoute(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    return window.location?.pathname;
  } catch {
    return undefined;
  }
}

export function resolveErrorEndpoint(env?: ErrorReportingEnv): string | undefined {
  return resolveVitalsEndpoint({
    VITE_VITALS_ENDPOINT: env?.VITE_ERROR_ENDPOINT,
  });
}

export function resolveErrorSampleRate(env?: ErrorReportingEnv): number {
  const raw = env?.VITE_ERROR_SAMPLE_RATE?.trim();
  if (!raw) return DEFAULT_ERROR_SAMPLE_RATE;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 1) {
    return DEFAULT_ERROR_SAMPLE_RATE;
  }
  return parsed;
}

export function normaliseErrorRoute(pathname: string): string {
  return normalisePathname(pathname);
}

function readImportMetaErrorEnv(): ErrorReportingEnv {
  try {
    return {
      VITE_ERROR_ENDPOINT: import.meta.env.VITE_ERROR_ENDPOINT,
      VITE_ERROR_SAMPLE_RATE: import.meta.env.VITE_ERROR_SAMPLE_RATE,
      VITE_APP_VERSION: import.meta.env.VITE_APP_VERSION,
    };
  } catch {
    return {};
  }
}

function defaultAppVersion(): string {
  try {
    if (typeof __DISCIPLR_APP_VERSION__ === 'string' && __DISCIPLR_APP_VERSION__.trim()) {
      return __DISCIPLR_APP_VERSION__;
    }
  } catch {
    // The build constant is optional in tests and alternate toolchains.
  }
  return 'unknown';
}

function defaultSendBeacon(url: string, body: Blob): boolean {
  if (typeof navigator === 'undefined' || typeof navigator.sendBeacon !== 'function') {
    return false;
  }
  return navigator.sendBeacon(url, body);
}

function defaultFetch(url: string, init: RequestInit): Promise<unknown> {
  if (typeof fetch !== 'function') {
    return Promise.reject(new Error('fetch unavailable'));
  }
  return fetch(url, init);
}

/**
 * Opt-in remote sink for boundary and global error reports.
 *
 * Disabled with no VITE_ERROR_ENDPOINT. Payloads contain only the support
 * reference ID, normalised error metadata, sanitised route and app version.
 */
export function createErrorReportingSink(
  options: CreateErrorReportingSinkOptions = {},
): ErrorReportingSink {
  try {
    const env = options.env ?? readImportMetaErrorEnv();
    const log = options.logger ?? logger;
    const endpoint = resolveErrorEndpoint(env);
    if (endpoint === undefined && env.VITE_ERROR_ENDPOINT?.trim()) {
      log.warn('[Error Reporting] ignoring invalid VITE_ERROR_ENDPOINT');
    }

    const rng = options.rng ?? Math.random;
    const sampleRate = resolveErrorSampleRate(env);
    const sampled = endpoint !== undefined && rng() < sampleRate;
    const pathname = options.pathname ?? currentRoute;
    const now = options.now ?? Date.now;
    const appVersion =
      options.appVersion?.trim() ||
      env.VITE_APP_VERSION?.trim() ||
      defaultAppVersion();
    const sendBeacon = options.sendBeacon ?? defaultSendBeacon;
    const fetchTransport = options.fetch ?? defaultFetch;
    const lastSent = new Map<string, number>();

    const report = (reportInput: ErrorReport): void => {
      if (!sampled || endpoint === undefined) return;

      try {
        const route = normaliseErrorRoute(
          reportInput.route ?? pathname() ?? '/',
        );
        const message = truncate(redactErrorText(reportInput.message));
        const throttleKey = `${message}|${route}`;
        const timestamp = now();
        const previous = lastSent.get(throttleKey);
        if (previous !== undefined && timestamp - previous < ERROR_REPORT_SEND_WINDOW_MS) {
          return;
        }
        lastSent.set(throttleKey, timestamp);
        if (lastSent.size > ERROR_REPORT_THROTTLE_KEY_LIMIT) {
          for (const [key, sentAt] of lastSent) {
            if (timestamp - sentAt >= ERROR_REPORT_SEND_WINDOW_MS) {
              lastSent.delete(key);
            }
          }
        }

        const payload: ErrorReportingPayload = {
          referenceId: reportInput.referenceId,
          name: truncate(redactErrorText(reportInput.name)),
          message,
          route,
          appVersion,
          ts: timestamp,
        };
        const payloadJson = JSON.stringify(payload);
        const body = new Blob([payloadJson], {
          type: 'application/json',
        });

        let beaconSent = false;
        try {
          beaconSent = sendBeacon(endpoint, body);
        } catch (error) {
          log.error('[Error Reporting] failed to send beacon', error);
        }

        if (beaconSent) return;

        void Promise.resolve(
          fetchTransport(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: payloadJson,
            keepalive: true,
          }),
        ).catch((error) => {
          log.error('[Error Reporting] failed to send report', error);
        });
      } catch (error) {
        log.error('[Error Reporting] sink failed to send report', error);
      }
    };

    return { report, active: sampled };
  } catch (error) {
    try {
      logger.error('[Error Reporting] sink failed to initialise', error);
    } catch {
      // Best-effort only.
    }
    return { report: () => {}, active: false };
  }
}

export const createErrorReportSink = createErrorReportingSink;

export function installErrorReportingSink(
  options: CreateErrorReportingSinkOptions = {},
): ErrorReportingSink {
  const sink = createErrorReportingSink(options);
  setErrorReportSink((report) => sink.report(report));
  return sink;
}

function throttleKey(report: ErrorReport): string {
  return `${report.source}|${report.name}|${report.message}`;
}

/**
 * Records the notification and reports whether this failure should reach the
 * user. The first occurrence always notifies; identical follow-ups inside the
 * window are suppressed.
 */
export function shouldNotifyError(report: ErrorReport, now: number = Date.now()): boolean {
  const key = throttleKey(report);
  const previous = lastNotifiedAt.get(key);
  if (previous !== undefined && now - previous < ERROR_REPORT_NOTIFY_WINDOW_MS) {
    return false;
  }

  lastNotifiedAt.set(key, now);
  if (lastNotifiedAt.size > ERROR_REPORT_THROTTLE_KEY_LIMIT) {
    for (const [entryKey, timestamp] of lastNotifiedAt) {
      if (now - timestamp >= ERROR_REPORT_NOTIFY_WINDOW_MS) {
        lastNotifiedAt.delete(entryKey);
      }
    }
    // Still over the cap (a burst of distinct errors): drop the oldest entry.
    const oldest = lastNotifiedAt.keys().next();
    if (!oldest.done && lastNotifiedAt.size > ERROR_REPORT_THROTTLE_KEY_LIMIT) {
      lastNotifiedAt.delete(oldest.value);
    }
  }
  return true;
}

/**
 * Report a failure. Returns the recorded report, or null when reporting was
 * impossible — the caller never has to handle a throw from here.
 */
export function reportError(input: ErrorReportInput): ErrorReport | null {
  try {
    const referenceId = input.referenceId || createReferenceId();
    const { name, message } = normalizeErrorReason(input.error);
    const route = input.route ?? currentRoute();
    const report: ErrorReport = {
      referenceId,
      source: input.source,
      name,
      message: truncate(redactErrorText(message)),
      ts: Date.now(),
      ...(route ? { route } : {}),
      ...(input.componentStack
        ? { componentStack: truncate(redactErrorText(input.componentStack)) }
        : {}),
    };

    recentReports.push(report);
    if (recentReports.length > ERROR_REPORT_BUFFER_LIMIT) {
      recentReports.shift();
    }

    try {
      sink(report);
    } catch {
      // A consumer sink must never break the error path.
    }

    try {
      logger.error('[error-report]', report);
    } catch {
      // Logging is best-effort.
    }

    // A boundary already renders its own fallback UI, so only failures the user
    // would otherwise never see (async/unhandled) raise a toast.
    if (report.source !== 'boundary' && shouldNotifyError(report)) {
      try {
        useToastStore.getState().push({
          message: `Something went wrong (ref ${report.referenceId})`,
          variant: 'error',
        });
      } catch {
        // Pushing a toast can throw (e.g. boundary input validation).
      }
    }

    return report;
  } catch {
    return null;
  }
}

/** Bounded, read-only view of the most recent reports (oldest first). */
export function getRecentErrorReports(): readonly ErrorReport[] {
  return recentReports;
}

/** Opt-in structured sink (e.g. a metrics backend). The logger is always written to. */
export function setErrorReportSink(next: ErrorReportSink): void {
  sink = next;
}

export function resetErrorReportSink(): void {
  sink = defaultSink;
}

/**
 * Installs `error` and `unhandledrejection` listeners. React error boundaries
 * cannot see rejections or failures raised outside render, so without this
 * those failures are invisible. Returns a disposer.
 *
 * Idempotent: a second call returns the existing disposer rather than
 * double-registering listeners.
 */
let installedDisposer: (() => void) | null = null;

export function installGlobalErrorHandlers(target?: Window): () => void {
  if (installedDisposer) return installedDisposer;

  const scope = target ?? (typeof window !== 'undefined' ? window : undefined);
  if (!scope) return () => {};

  const handleError = (event: ErrorEvent) => {
    reportError({ error: event.error ?? event.message, source: 'window' });
  };

  const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    reportError({ error: event.reason, source: 'promise' });
  };

  scope.addEventListener('error', handleError);
  scope.addEventListener('unhandledrejection', handleUnhandledRejection);

  installedDisposer = () => {
    scope.removeEventListener('error', handleError);
    scope.removeEventListener('unhandledrejection', handleUnhandledRejection);
    installedDisposer = null;
  };
  return installedDisposer;
}

/** Test-only: clears the buffer, sink, throttle state and global listeners. */
export function resetErrorReporterForTests(): void {
  recentReports.length = 0;
  lastNotifiedAt.clear();
  sink = defaultSink;
  installedDisposer?.();
  installedDisposer = null;
}
