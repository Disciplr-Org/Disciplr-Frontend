import { describe, expect, it } from 'vitest'
import { parsePeriod, serializePeriod, type Period } from '../periodParam'

describe('periodParam', () => {
  describe('parsePeriod', () => {
    it('returns default period when param is null', () => {
      expect(parsePeriod(null)).toBe('30d')
    })

    it('returns default period when param is empty string', () => {
      expect(parsePeriod('')).toBe('30d')
    })

    it('returns default period when param is invalid', () => {
      expect(parsePeriod('invalid')).toBe('30d')
      expect(parsePeriod('100d')).toBe('30d')
      expect(parsePeriod('1year')).toBe('30d')
    })

    it('returns the parsed period when param is valid', () => {
      expect(parsePeriod('7d')).toBe('7d')
      expect(parsePeriod('30d')).toBe('30d')
      expect(parsePeriod('90d')).toBe('90d')
      expect(parsePeriod('1y')).toBe('1y')
      expect(parsePeriod('All')).toBe('All')
    })
  })

  describe('serializePeriod', () => {
    it('serializes each period to string', () => {
      const periods: Period[] = ['7d', '30d', '90d', '1y', 'All']
      periods.forEach(p => {
        expect(serializePeriod(p)).toBe(p)
      })
    })
  })
})
