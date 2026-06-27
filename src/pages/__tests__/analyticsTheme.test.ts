import { describe, expect, it } from 'vitest'
import {
  ANALYTICS_TOKEN_FALLBACKS,
  buildAnalyticsSeriesColors,
  getAnalyticsChartTokens,
  type AnalyticsChartTokens,
} from '../analyticsTheme'

const setToken = (root: HTMLElement, token: string, value: string) => {
  root.style.setProperty(token, value)
}

describe('analyticsTheme token resolver', () => {
  it('resolves analytics chart tokens from a provided root element', () => {
    const root = document.createElement('div')

    setToken(root, '--accent', '#123456')
    setToken(root, '--success', '#00AA00')
    setToken(root, '--danger', '#AA0000')
    setToken(root, '--info', '#0000AA')
    setToken(root, '--warning', '#AA6600')
    setToken(root, '--text', '#111111')
    setToken(root, '--muted', '#666666')
    setToken(root, '--surface', '#F1F1F1')
    setToken(root, '--surface-raised', '#E2E2E2')
    setToken(root, '--border', '#CCCCCC')
    setToken(root, '--bg', '#FAFAFA')
    setToken(root, '--accent-transparent', 'rgba(18, 52, 86, 0.2)')

    expect(getAnalyticsChartTokens(root)).toEqual({
      accent: '#123456',
      success: '#00AA00',
      danger: '#AA0000',
      info: '#0000AA',
      warning: '#AA6600',
      text: '#111111',
      muted: '#666666',
      surface: '#F1F1F1',
      surfaceRaised: '#E2E2E2',
      border: '#CCCCCC',
      bg: '#FAFAFA',
      accentTransparent: 'rgba(18, 52, 86, 0.2)',
    })
  })

  it('falls back when tokens are missing or whitespace-only', () => {
    const root = document.createElement('div')

    setToken(root, '--accent', '   ')
    setToken(root, '--success', '#10B981')

    expect(getAnalyticsChartTokens(root)).toEqual({
      ...ANALYTICS_TOKEN_FALLBACKS,
      success: '#10B981',
    })
  })

  it('defaults to document.documentElement when no root is provided', () => {
    const previousAccent = document.documentElement.style.getPropertyValue('--accent')
    const previousInfo = document.documentElement.style.getPropertyValue('--info')

    try {
      setToken(document.documentElement, '--accent', '#0F766E')
      setToken(document.documentElement, '--info', '#1D4ED8')

      expect(getAnalyticsChartTokens()).toEqual({
        ...ANALYTICS_TOKEN_FALLBACKS,
        accent: '#0F766E',
        info: '#1D4ED8',
      })
    } finally {
      document.documentElement.style.setProperty('--accent', previousAccent)
      document.documentElement.style.setProperty('--info', previousInfo)
    }
  })
})

describe('buildAnalyticsSeriesColors', () => {
  it('maps resolved chart tokens to the expected chart series keys and order', () => {
    const tokens: AnalyticsChartTokens = {
      accent: 'accent',
      success: 'success',
      danger: 'danger',
      info: 'info',
      warning: 'warning',
      text: 'text',
      muted: 'muted',
      surface: 'surface',
      surfaceRaised: 'surfaceRaised',
      border: 'border',
      bg: 'bg',
      accentTransparent: 'accentTransparent',
    }

    expect(buildAnalyticsSeriesColors(tokens)).toEqual({
      success: 'success',
      failed: 'danger',
      comparison: 'info',
      milestone: 'accent',
      active: 'info',
      warning: 'warning',
      platform: 'muted',
      grid: 'border',
      axis: 'muted',
      tooltipBackground: 'surface',
      tooltipBorder: 'border',
      tooltipText: 'text',
      tooltipMuted: 'muted',
      pie: ['success', 'info', 'danger'],
    })
  })
})
