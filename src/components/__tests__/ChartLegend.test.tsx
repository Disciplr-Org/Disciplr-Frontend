import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ChartLegend } from '../ChartLegend'

const tokens = {
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
  legendLabelRole: 'caption' as const,
}

describe('ChartLegend', () => {
  it('returns null for an empty series list', () => {
    const { container } = render(
      <ChartLegend
        entries={[]}
        colors={{ success: '#059669', failed: '#DC2626', comparison: '#2563EB', milestone: '#0A7668', active: '#2563EB', warning: '#D97706', platform: '#4B5563' }}
        tokens={tokens}
      />,
    )

    expect(container.firstChild).toBeNull()
  })

  it('renders labels with the configured typography role and tokenized swatches', () => {
    render(
      <ChartLegend
        entries={[
          { label: 'This Period %', colorKey: 'success' },
          { label: 'Failed %', colorKey: 'failed' },
        ]}
        colors={{ success: '#059669', failed: '#DC2626', comparison: '#2563EB', milestone: '#0A7668', active: '#2563EB', warning: '#D97706', platform: '#4B5563' }}
        tokens={tokens}
      />,
    )

    expect(screen.getByLabelText('Chart legend')).toBeInTheDocument()
    expect(screen.getByText('This Period %')).toHaveClass('text-caption')
    expect(screen.getByText('Failed %')).toHaveClass('text-caption')
    expect(screen.getByText('This Period %').previousElementSibling).toHaveStyle({ backgroundColor: '#059669' })
    expect(screen.getByText('Failed %').previousElementSibling).toHaveStyle({ backgroundColor: '#DC2626' })
  })

  it('updates swatch colors when the theme palette changes', () => {
    const { rerender } = render(
      <ChartLegend
        entries={[{ label: 'This Period %', colorKey: 'success' }]}
        colors={{ success: '#059669', failed: '#DC2626', comparison: '#2563EB', milestone: '#0A7668', active: '#2563EB', warning: '#D97706', platform: '#4B5563' }}
        tokens={tokens}
      />,
    )

    expect(screen.getByText('This Period %').previousElementSibling).toHaveStyle({ backgroundColor: '#059669' })

    rerender(
      <ChartLegend
        entries={[{ label: 'This Period %', colorKey: 'success' }]}
        colors={{ success: '#14B8A6', failed: '#F87171', comparison: '#60A5FA', milestone: '#0A7668', active: '#60A5FA', warning: '#F59E0B', platform: '#6B7280' }}
        tokens={tokens}
      />,
    )

    expect(screen.getByText('This Period %').previousElementSibling).toHaveStyle({ backgroundColor: '#14B8A6' })
  })
})