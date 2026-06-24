import { describe, expect, it, test } from 'vitest';
import { getEvidenceUrlSafety, isSafeEvidenceUrl, normalizeEvidenceUrl } from '../url';

describe('evidence URL validation', () => {
  it('accepts plain http and https evidence URLs', () => {
    expect(isSafeEvidenceUrl('https://github.com/org/repo/pull/42')).toBe(true);
    expect(isSafeEvidenceUrl('http://example.com/evidence')).toBe(true);
    expect(getEvidenceUrlSafety('https://example.com/evidence')).toEqual({
      safe: true,
      normalizedUrl: 'https://example.com/evidence',
    });
  });

  it('trims safe URLs before returning them', () => {
    expect(normalizeEvidenceUrl('  https://example.com/doc  ')).toBe('https://example.com/doc');
  });

  it('preserves current behavior for mixed-case schemes and default ports', () => {
    expect(isSafeEvidenceUrl('HTTPS://example.com')).toBe(true);
    expect(isSafeEvidenceUrl('https://example.com:443/evidence')).toBe(true);
    expect(isSafeEvidenceUrl('http://example.com:80/evidence')).toBe(true);
  });

  test.each([
    ['javascript:alert(1)', 'unsupported-protocol'],
    ['data:text/html,hello', 'unsupported-protocol'],
    ['file:///tmp/evidence.txt', 'unsupported-protocol'],
    ['https://user:pass@example.com/evidence', 'embedded-credentials'],
    ['https://user@example.com/evidence', 'embedded-credentials'],
    ['https://xn--pple-43d.com/evidence', 'punycode-host'],
    ['https://XN--PPLE-43D.com/evidence', 'punycode-host'],
    ['https://example.com:8443/evidence', 'unexpected-port'],
    ['http://127.0.0.1/evidence', 'ip-literal-host'],
    ['http://[::1]/evidence', 'ip-literal-host'],
    ['example.com/evidence', 'invalid-url'],
    ['', 'empty'],
  ])('rejects %s as %s', (url, reason) => {
    expect(isSafeEvidenceUrl(url)).toBe(false);
    expect(normalizeEvidenceUrl(url)).toBeNull();
    expect(getEvidenceUrlSafety(url)).toMatchObject({ safe: false, reason });
  });
});
