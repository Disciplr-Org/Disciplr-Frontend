import { describe, expect, it } from 'vitest'
import { isSafeEvidenceUrl } from '../evidenceUrl'

describe('isSafeEvidenceUrl', () => {
  it('rejects missing evidence URLs', () => {
    expect(isSafeEvidenceUrl(undefined)).toBe(false)
    expect(isSafeEvidenceUrl(null)).toBe(false)
    expect(isSafeEvidenceUrl('')).toBe(false)
  })

  it('allows http and https evidence URLs', () => {
    expect(isSafeEvidenceUrl('https://example.com/evidence')).toBe(true)
    expect(isSafeEvidenceUrl('http://localhost:3000/proof')).toBe(true)
    expect(isSafeEvidenceUrl('HTTPS://example.com/evidence')).toBe(true)
  })

  it('rejects script, data, and ambiguous URLs', () => {
    expect(isSafeEvidenceUrl('javascript:alert(1)')).toBe(false)
    expect(isSafeEvidenceUrl('data:text/html,<script>alert(1)</script>')).toBe(false)
    expect(isSafeEvidenceUrl('//example.com/evidence')).toBe(false)
    expect(isSafeEvidenceUrl('/relative/evidence')).toBe(false)
    expect(isSafeEvidenceUrl(' https://example.com/evidence')).toBe(false)
    expect(isSafeEvidenceUrl('https://example.com/evidence ')).toBe(false)
  })
})
