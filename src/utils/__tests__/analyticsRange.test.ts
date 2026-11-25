import { describe, it, expect } from 'vitest'
import { validateCustomRange, dedupeByName } from '../analyticsRange'

describe('validateCustomRange', () => {
  it('returns null when from is blank', () => {
    expect(validateCustomRange('', '2025-01-01')).toBeNull()
  })

  it('returns null when to is blank', () => {
    expect(validateCustomRange('2025-01-01', '')).toBeNull()
  })

  it('returns null for invalid dates', () => {
    expect(validateCustomRange('not-a-date', '2025-01-01')).toBeNull()
    expect(validateCustomRange('2025-01-01', 'not-a-date')).toBeNull()
  })

  it('returns null when from is after to', () => {
    expect(validateCustomRange('2025-02-01', '2025-01-01')).toBeNull()
  })

  it('accepts a same-day range', () => {
    const result = validateCustomRange('2025-01-01', '2025-01-01')
    expect(result).not.toBeNull()
    expect(result!.from.getTime()).toBe(result!.to.getTime())
  })

  it('returns Date objects for a valid range', () => {
    const result = validateCustomRange('2025-01-01', '2025-01-31')
    expect(result).not.toBeNull()
    expect(result!.from).toBeInstanceOf(Date)
    expect(result!.to).toBeInstanceOf(Date)
    expect(result!.from < result!.to).toBe(true)
  })
})

describe('dedupeByName', () => {
  it('keeps the last occurrence per name', () => {
    const rows = [{ name: 'a', v: 1 }, { name: 'b', v: 5 }, { name: 'a', v: 2 }]
    const result = dedupeByName(rows)
    const a = result.find((r) => r.name === 'a')
    expect(a?.v).toBe(2)
    expect(result).toHaveLength(2)
  })

  it('preserves first-seen order', () => {
    const rows = [{ name: 'a' }, { name: 'b' }, { name: 'a' }, { name: 'c' }]
    expect(dedupeByName(rows).map((r) => r.name)).toEqual(['a', 'b', 'c'])
  })

  it('returns an empty array for empty input', () => {
    expect(dedupeByName([])).toEqual([])
  })
})
