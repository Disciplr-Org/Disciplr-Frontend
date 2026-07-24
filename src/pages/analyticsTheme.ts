import type { TypographyRole } from '../utils/typography'

export type AnalyticsChartTokens = {
  accent: string
  success: string
  danger: string
  info: string
  warning: string
  text: string
  muted: string
  surface: string
  surfaceRaised: string
  border: string
  bg: string
  accentTransparent: string
  legendGap: string
  legendSwatchSize: string
  legendLabelRole: TypographyRole
}

export type AnalyticsSeriesColors = ReturnType<typeof buildAnalyticsSeriesColors>

export const ANALYTICS_TOKEN_FALLBACKS: AnalyticsChartTokens = {
  accent: '#0A7668',
  success: '#059669',
  danger: '#DC2626',
  info: '#2563EB',
  warning: '#D97706',
  text: '#111827',
  muted: '#4B5563',
  surface: '#F3F4F6',
  surfaceRaised: '#E5E7EB',
  border: '#E5E7EB',
  bg: '#F9FAFB',
  accentTransparent: 'rgba(10, 118, 104, 0.1)',
  legendGap: '0.75rem',
  legendSwatchSize: '0.625rem',
  legendLabelRole: 'caption',
}

function readToken(computed: CSSStyleDeclaration, token: string, fallback: string) {
  const value = computed.getPropertyValue(token).trim()
  return value || fallback
}

export function getAnalyticsChartTokens(root: HTMLElement = document.documentElement): AnalyticsChartTokens {
  const computed = getComputedStyle(root)

  return {
    accent: readToken(computed, '--accent', ANALYTICS_TOKEN_FALLBACKS.accent),
    success: readToken(computed, '--success', ANALYTICS_TOKEN_FALLBACKS.success),
    danger: readToken(computed, '--danger', ANALYTICS_TOKEN_FALLBACKS.danger),
    info: readToken(computed, '--info', ANALYTICS_TOKEN_FALLBACKS.info),
    warning: readToken(computed, '--warning', ANALYTICS_TOKEN_FALLBACKS.warning),
    text: readToken(computed, '--text', ANALYTICS_TOKEN_FALLBACKS.text),
    muted: readToken(computed, '--muted', ANALYTICS_TOKEN_FALLBACKS.muted),
    surface: readToken(computed, '--surface', ANALYTICS_TOKEN_FALLBACKS.surface),
    surfaceRaised: readToken(computed, '--surface-raised', ANALYTICS_TOKEN_FALLBACKS.surfaceRaised),
    border: readToken(computed, '--border', ANALYTICS_TOKEN_FALLBACKS.border),
    bg: readToken(computed, '--bg', ANALYTICS_TOKEN_FALLBACKS.bg),
    accentTransparent: readToken(computed, '--accent-transparent', ANALYTICS_TOKEN_FALLBACKS.accentTransparent),
    legendGap: readToken(computed, '--legend-gap', ANALYTICS_TOKEN_FALLBACKS.legendGap),
    legendSwatchSize: readToken(computed, '--legend-swatch-size', ANALYTICS_TOKEN_FALLBACKS.legendSwatchSize),
    legendLabelRole: ANALYTICS_TOKEN_FALLBACKS.legendLabelRole,
  }
}

export function buildAnalyticsSeriesColors(tokens: AnalyticsChartTokens) {
  return {
    success: tokens.success,
    failed: tokens.danger,
    comparison: tokens.info,
    milestone: tokens.accent,
    active: tokens.info,
    warning: tokens.warning,
    platform: tokens.muted,
    grid: tokens.border,
    axis: tokens.muted,
    tooltipBackground: tokens.surface,
    tooltipBorder: tokens.border,
    tooltipText: tokens.text,
    tooltipMuted: tokens.muted,
    pie: [tokens.success, tokens.info, tokens.danger],
  }
}
