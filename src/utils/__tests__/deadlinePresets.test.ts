import { describe, expect, it } from 'vitest'
import { computeFutureDeadline, DEADLINE_PRESETS, getPresetLabel } from '../deadlinePresets'

describe('deadlinePresets', () => {
  describe('DEADLINE_PRESETS', () => {
    it('contains expected presets', () => {
      expect(DEADLINE_PRESETS).toEqual(['7d', '30d', '90d'])
    })
  })

  describe('computeFutureDeadline', () => {
    it('returns a future datetime-local formatted string', () => {
      const now = new Date('2026-01-15T12:00:00')
      const result = computeFutureDeadline(7, now)
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)
    })

    it('computes correct date for 7 days offset', () => {
      const now = new Date('2026-01-15T12:00:00')
      const result = computeFutureDeadline(7, now)
      expect(result).toBe('2026-01-22T12:00')
    })

    it('computes correct date for 30 days offset', () => {
      const now = new Date('2026-01-15T12:00:00')
      const result = computeFutureDeadline(30, now)
      expect(result).toBe('2026-02-14T12:00')
    })

    it('computes correct date for 90 days offset', () => {
      const now = new Date('2026-01-15T12:00:00')
      const result = computeFutureDeadline(90, now)
      expect(result).toBe('2026-04-14T12:00')
    })

    it('uses current date when now is not provided', () => {
      const before = new Date()
      const result = computeFutureDeadline(1)
      const after = new Date()
      
      // Result should be within a reasonable range
      const resultDate = new Date(result)
      expect(resultDate.getTime()).toBeGreaterThanOrEqual(before.getTime())
      expect(resultDate.getTime()).toBeLessThanOrEqual(after.getTime() + 60000) // small buffer
    })

    it('handles month boundary correctly', () => {
      const now = new Date('2026-01-31T12:00:00')
      const result = computeFutureDeadline(1, now)
      expect(result).toBe('2026-02-01T12:00')
    })

    it('handles year boundary correctly', () => {
      const now = new Date('2025-12-31T12:00:00')
      const result = computeFutureDeadline(1, now)
      expect(result).toBe('2026-01-01T12:00')
    })
  })

  describe('getPresetLabel', () => {
    it('returns correct label for 7d', () => {
      expect(getPresetLabel('7d')).toBe('7 days')
    })

    it('returns correct label for 30d', () => {
      expect(getPresetLabel('30d')).toBe('30 days')
    })

    it('returns correct label for 90d', () => {
      expect(getPresetLabel('90d')).toBe('90 days')
    })
  })
})