// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  ANALYTICS_TOKEN_FALLBACKS,
  getAnalyticsChartTokens,
  buildAnalyticsSeriesColors,
} from '../analyticsTheme'

// jsdom's getComputedStyle doesn't read inline CSS variables, so we stub it.
function makeRoot(props: Record<string, string> = {}): HTMLElement {
  const el = document.createElement('div')
  vi.spyOn(window, 'getComputedStyle').mockImplementation((target) => {
    if (target === el) {
      return {
        getPropertyValue: (p: string) => props[p] ?? '',
      } as unknown as CSSStyleDeclaration
    }
    return window.getComputedStyle(target)
  })
  return el
}

const CSS_PROPS: Record<keyof typeof ANALYTICS_TOKEN_FALLBACKS, string> = {
  accent: '--accent',
  success: '--success',
  danger: '--danger',
  info: '--info',
  warning: '--warning',
  text: '--text',
  muted: '--muted',
  surface: '--surface',
  surfaceRaised: '--surface-raised',
  border: '--border',
  bg: '--bg',
  accentTransparent: '--accent-transparent',
  legendGap: '--legend-gap',
  legendSwatchSize: '--legend-swatch-size',
  legendLabelRole: '--legend-label-role',
}

describe('getAnalyticsChartTokens', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('resolves each CSS custom property when all are defined', () => {
    const values: Record<string, string> = {}
    for (const [key, prop] of Object.entries(CSS_PROPS)) {
      values[prop] = `#custom-${key}`
    }
    const root = makeRoot(values)
    const tokens = getAnalyticsChartTokens(root)

    for (const key of Object.keys(CSS_PROPS) as (keyof typeof CSS_PROPS)[]) {
      expect(tokens[key]).toBe(`#custom-${key}`)
    }
  })

  it('falls back to ANALYTICS_TOKEN_FALLBACKS when no properties are set', () => {
    const root = makeRoot({})
    const tokens = getAnalyticsChartTokens(root)
    expect(tokens).toEqual(ANALYTICS_TOKEN_FALLBACKS)
  })

  it('falls back per-key for partially-defined properties', () => {
    const root = makeRoot({ '--accent': '#aabbcc' })
    const tokens = getAnalyticsChartTokens(root)
    expect(tokens.accent).toBe('#aabbcc')
    expect(tokens.success).toBe(ANALYTICS_TOKEN_FALLBACKS.success)
    expect(tokens.danger).toBe(ANALYTICS_TOKEN_FALLBACKS.danger)
  })

  it('treats whitespace-only property values as missing (uses fallback)', () => {
    const root = makeRoot({ '--accent': '   ' })
    const tokens = getAnalyticsChartTokens(root)
    // trim() makes whitespace-only become '' which is falsy → fallback
    expect(tokens.accent).toBe(ANALYTICS_TOKEN_FALLBACKS.accent)
  })

  it('uses document.documentElement when called with no argument', () => {
    vi.spyOn(window, 'getComputedStyle').mockImplementation(() => ({
      getPropertyValue: () => '#default-root',
    } as unknown as CSSStyleDeclaration))

    const tokens = getAnalyticsChartTokens()
    expect(tokens.accent).toBe('#default-root')
  })
})

describe('buildAnalyticsSeriesColors', () => {
  const tokens = getAnalyticsChartTokens(makeRoot({})) // all fallbacks

  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('maps series keys to the correct token values', () => {
    const series = buildAnalyticsSeriesColors(tokens)
    expect(series.success).toBe(tokens.success)
    expect(series.failed).toBe(tokens.danger)
    expect(series.comparison).toBe(tokens.info)
    expect(series.milestone).toBe(tokens.accent)
    expect(series.active).toBe(tokens.info)
    expect(series.warning).toBe(tokens.warning)
    expect(series.platform).toBe(tokens.muted)
    expect(series.grid).toBe(tokens.border)
    expect(series.axis).toBe(tokens.muted)
    expect(series.tooltipBackground).toBe(tokens.surface)
    expect(series.tooltipBorder).toBe(tokens.border)
    expect(series.tooltipText).toBe(tokens.text)
    expect(series.tooltipMuted).toBe(tokens.muted)
  })

  it('produces pie as [success, info, danger] in that order', () => {
    const series = buildAnalyticsSeriesColors(tokens)
    expect(series.pie).toEqual([tokens.success, tokens.info, tokens.danger])
  })

  it('contains exactly the expected top-level keys', () => {
    const series = buildAnalyticsSeriesColors(tokens)
    expect(Object.keys(series)).toEqual([
      'success', 'failed', 'comparison', 'milestone', 'active',
      'warning', 'platform', 'grid', 'axis',
      'tooltipBackground', 'tooltipBorder', 'tooltipText', 'tooltipMuted', 'pie',
    ])
  })
})

describe('ANALYTICS_TOKEN_FALLBACKS', () => {
  it('has values for all 15 token keys', () => {
    expect(Object.keys(ANALYTICS_TOKEN_FALLBACKS)).toHaveLength(15)
  })

  it('every value is a non-empty string', () => {
    for (const val of Object.values(ANALYTICS_TOKEN_FALLBACKS)) {
      expect(typeof val).toBe('string')
      expect(val.trim().length).toBeGreaterThan(0)
    }
  })
})

describe('legend tokens', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('falls back to default legend gap/swatch sizing when unset', () => {
    const tokens = getAnalyticsChartTokens(makeRoot({}))
    expect(tokens.legendGap).toBe(ANALYTICS_TOKEN_FALLBACKS.legendGap)
    expect(tokens.legendSwatchSize).toBe(ANALYTICS_TOKEN_FALLBACKS.legendSwatchSize)
    // legendLabelRole is not CSS-driven and always uses the fallback role.
    expect(tokens.legendLabelRole).toBe(ANALYTICS_TOKEN_FALLBACKS.legendLabelRole)
  })

  it('resolves legend sizing from CSS variables when present', () => {
    const tokens = getAnalyticsChartTokens(
      makeRoot({ '--legend-gap': '1.25rem', '--legend-swatch-size': '0.5rem' }),
    )
    expect(tokens.legendGap).toBe('1.25rem')
    expect(tokens.legendSwatchSize).toBe('0.5rem')
  })
})

describe('custom root element handling', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('reads tokens from the provided root, not document.documentElement', () => {
    // documentElement returns one set of values…
    const customRoot = document.createElement('section')
    vi.spyOn(window, 'getComputedStyle').mockImplementation((target) => {
      if (target === customRoot) {
        return {
          getPropertyValue: (p: string) => (p === '--accent' ? '#fromcustom' : ''),
        } as unknown as CSSStyleDeclaration
      }
      // a non-custom root would resolve --accent to a different value
      return {
        getPropertyValue: (p: string) => (p === '--accent' ? '#fromdocument' : ''),
      } as unknown as CSSStyleDeclaration
    })

    expect(getAnalyticsChartTokens(customRoot).accent).toBe('#fromcustom')
    expect(getAnalyticsChartTokens().accent).toBe('#fromdocument')
  })
})

describe('buildAnalyticsSeriesColors determinism for N series', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('produces identical output across repeated calls (stable for N series)', () => {
    const tokens = getAnalyticsChartTokens(makeRoot({}))
    const first = buildAnalyticsSeriesColors(tokens)
    const second = buildAnalyticsSeriesColors(tokens)
    expect(second).toEqual(first)
    // pie palette ordering is stable for the N=3 series case.
    expect(second.pie).toEqual(first.pie)
    expect(second.pie).toHaveLength(3)
  })

  it('reflects token changes deterministically without leaking previous values', () => {
    const a = buildAnalyticsSeriesColors(getAnalyticsChartTokens(makeRoot({ '--success': '#001122' })))
    const b = buildAnalyticsSeriesColors(getAnalyticsChartTokens(makeRoot({ '--success': '#334455' })))
    expect(a.success).toBe('#001122')
    expect(b.success).toBe('#334455')
    expect(a.pie[0]).toBe('#001122')
    expect(b.pie[0]).toBe('#334455')
  })
})
