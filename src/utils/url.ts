/**
 * Validates if a URL is safe to render as a link.
 * Only allows http and https schemes.
 * Rejects javascript:, data:, and other potentially dangerous schemes.
 */
export function normalizeEvidenceUrl(value: string): string | null {
  const trimmed = value.trim()

  if (!trimmed) {
    return null
  }

  try {
    const parsed = new URL(trimmed)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null
    }
    // Reject userinfo-bearing URLs (e.g. https://trusted.com@evil.com) — a
    // common credential/phishing vector that hides the real host.
    if (parsed.username || parsed.password) {
      return null
    }
    return trimmed
  } catch {
    return null
  }
}

export function isSafeEvidenceUrl(value: string): boolean {
  return normalizeEvidenceUrl(value) !== null
}
