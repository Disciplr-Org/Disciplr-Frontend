export class ConfigError extends Error {
  constructor(message: string) {
    super(`[vite.config] ${message}`);
    this.name = "ConfigError";
  }
}

const DEFAULT_API_TARGET = "http://localhost:3000";

/**
 * Parse an integer env variable with bounds. Returns the default when the
 * variable is absent or empty. Throws on non-numeric, non-integer, or
 * out-of-range values so misconfiguration fails fast and deterministically.
 */
export function parseIntEnv(
  raw: string | undefined,
  name: string,
  defaultValue: number,
  min: number,
  max: number,
): number {
  if (raw === undefined || raw.trim() === "") {
    return defaultValue;
  }
  const trimmed = raw.trim();
  if (!/^[0-9]+$/.test(trimmed)) {
    throw new ConfigError(`${name} must be a non-negative integer, got ${JSON.stringify(raw)}`);
  }
  const parsed = Number(trimmed);
  if (!Number.isSafeInteger(parsed)) {
    throw new ConfigError(`${name} must be a safe integer, got ${JSON.stringify(raw)}`);
  }
  if (parsed < min || parsed > max) {
    throw new ConfigError(`${name} must be between ${min} and ${max}, got ${parsed}`);
  }
  return parsed;
}

/**
 * Validate a proxy target URL. Only absolute http/https URLs are allowed.
 * This prevents accidentally forwarding traffic to a non-HTTP scheme or
 * a relative path that would be interpreted relative to the dev server.
 */
export function validateProxyTarget(
  raw: string | undefined,
  name: string,
  defaultValue = DEFAULT_API_TARGET,
): string {
  if (raw === undefined || raw.trim() === "") {
    return defaultValue;
  }
  const trimmed = raw.trim();
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new ConfigError(`${name} must be a valid absolute URL, got ${JSON.stringify(raw)}`);
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new ConfigError(`${name} must use http or https, got ${parsed.protocol}`);
  }
  if (!parsed.hostname) {
    throw new ConfigError(`${name} must include a hostname, got ${JSON.stringify(raw)}`);
  }
  return trimmed;
}
