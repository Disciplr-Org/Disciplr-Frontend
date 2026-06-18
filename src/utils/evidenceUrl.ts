export function isSafeEvidenceUrl(url: string | null | undefined): url is string {
  if (!url) {
    return false
  }

  if (url.trim() !== url || url.startsWith('//')) {
    return false
  }

  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}
