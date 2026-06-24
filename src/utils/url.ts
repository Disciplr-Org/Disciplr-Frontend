export type EvidenceUrlRejectionReason =
  | 'empty'
  | 'invalid-url'
  | 'unsupported-protocol'
  | 'embedded-credentials'
  | 'punycode-host'
  | 'unexpected-port'
  | 'ip-literal-host';

export type EvidenceUrlSafety =
  | { safe: true; normalizedUrl: string }
  | { safe: false; reason: EvidenceUrlRejectionReason };

const REJECTION_LABELS: Record<EvidenceUrlRejectionReason, string> = {
  empty: 'empty URL',
  'invalid-url': 'invalid URL',
  'unsupported-protocol': 'unsupported protocol',
  'embedded-credentials': 'embedded credentials',
  'punycode-host': 'punycode or IDN host',
  'unexpected-port': 'unexpected port',
  'ip-literal-host': 'IP literal host',
};

function hasPunycodeLabel(hostname: string): boolean {
  return hostname
    .toLowerCase()
    .split('.')
    .some((label) => label.startsWith('xn--'));
}

function isIpv4Literal(hostname: string): boolean {
  const parts = hostname.split('.');

  return (
    parts.length === 4 &&
    parts.every((part) => {
      if (!/^\d{1,3}$/.test(part)) {
        return false;
      }

      const value = Number(part);
      return value >= 0 && value <= 255;
    })
  );
}

function isIpLiteralHost(hostname: string): boolean {
  return isIpv4Literal(hostname) || hostname.startsWith('[') || hostname.includes(':');
}

function hasUnexpectedPort(url: URL): boolean {
  return url.port !== '';
}

export function getEvidenceUrlRejectionLabel(reason: EvidenceUrlRejectionReason): string {
  return REJECTION_LABELS[reason];
}

/**
 * Validates if a URL is safe to render as a link.
 * Only allows plain http and https URLs with clear hostnames.
 * Rejects ambiguous externally sourced evidence URLs.
 */
export function getEvidenceUrlSafety(value: string): EvidenceUrlSafety {
  const trimmed = value.trim();

  if (!trimmed) {
    return { safe: false, reason: 'empty' };
  }

  try {
    const parsed = new URL(trimmed);

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { safe: false, reason: 'unsupported-protocol' };
    }

    if (parsed.username || parsed.password) {
      return { safe: false, reason: 'embedded-credentials' };
    }

    if (hasPunycodeLabel(parsed.hostname)) {
      return { safe: false, reason: 'punycode-host' };
    }

    if (hasUnexpectedPort(parsed)) {
      return { safe: false, reason: 'unexpected-port' };
    }

    if (isIpLiteralHost(parsed.hostname)) {
      return { safe: false, reason: 'ip-literal-host' };
    }

    return { safe: true, normalizedUrl: trimmed };
  } catch {
    return { safe: false, reason: 'invalid-url' };
  }
}

export function normalizeEvidenceUrl(value: string): string | null {
  const safety = getEvidenceUrlSafety(value);
  return safety.safe ? safety.normalizedUrl : null;
}

export function isSafeEvidenceUrl(value: string): boolean {
  return getEvidenceUrlSafety(value).safe;
}
