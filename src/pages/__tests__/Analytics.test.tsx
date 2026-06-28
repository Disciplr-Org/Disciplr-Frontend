import React, { Suspense, lazy } from 'react'
import { describe, expect, it, vi, beforeAll } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { buildAnalyticsSeriesColors } from '../analyticsTheme'
import Analytics, { analyticsPeriodData } from '../Analytics'

beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  })
})

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  AreaChart: ({ children }: any) => <div>{children}</div>,
  BarChart: ({ children }: any) => <div>{children}</div>,
  PieChart: ({ children }: any) => <div>{children}</div>,
  Area: () => null,
  Bar: () => null,
  Pie: () => null,
  Cell: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
  LineChart: ({ children }: any) => <div>{children}</div>,
  Line: () => null,
}))

vi.mock('jspdf', () => ({
  default: class {
    text() {}
    save() {}
    addImage() {}
  },
}))

vi.mock('../../context/WalletContext', () => ({
  WalletProvider: ({ children }: any) => <>{children}</>,
  useWallet: () => ({
    address: null,
    network: null,
    balance: null,
    isConnecting: false,
    error: null,
    connect: async () => {},
    disconnect: () => {},
    checkConnection: async () => {},
  }),
}))

vi.mock('../../context/ThemeContext', () => ({
  ThemeProvider: ({ children }: any) => <>{children}</>,
  useTheme: () => ({ theme: 'light', toggleTheme: () => {} }),
}))

const tokenFixture = {
  accent: 'accent-token',
  success: 'success-token',
  danger: 'danger-token',
  info: 'info-token',
  warning: 'warning-token',
  text: 'text-token',
  muted: 'muted-token',
  surface: 'surface-token',
  surfaceRaised: 'surface-raised-token',
  border: 'border-token',
  bg: 'bg-token',
  accentTransparent: 'accent-transparent-token',
}

describe('Analytics chart theme mapping', () => {
  it('maps semantic chart series to design tokens', () => {
    const colors = buildAnalyticsSeriesColors(tokenFixture)

    expect(colors).toMatchObject({
      success: tokenFixture.success,
      failed: tokenFixture.danger,
      comparison: tokenFixture.info,
      milestone: tokenFixture.accent,
      active: tokenFixture.info,
      warning: tokenFixture.warning,
      platform: tokenFixture.muted,
      grid: tokenFixture.border,
      axis: tokenFixture.muted,
      tooltipBackground: tokenFixture.surface,
      tooltipBorder: tokenFixture.border,
      tooltipText: tokenFixture.text,
      tooltipMuted: tokenFixture.muted,
    })

    expect(colors.pie).toEqual([tokenFixture.success, tokenFixture.info, tokenFixture.danger])
  })
})

export const analyticsThemeCoverage = [
  'success series maps to --success',
  'failed series maps to --danger',
  'comparison series maps to --info',
  'milestone bars map to --accent',
  'axis/grid/tooltip colors map to neutral surface tokens',
]

describe('Analytics lazy route', () => {
  it('Suspense renders skeleton fallback before chunk resolves', async () => {
    const LazyAnalytics = lazy(
      () => new Promise<{ default: React.ComponentType }>(resolve =>
        setTimeout(() => import('../Analytics').then(resolve), 50),
      ),
    )

    render(
      <MemoryRouter>
        <Suspense fallback={<div data-testid="skeleton" />}>
          <LazyAnalytics />
        </Suspense>
      </MemoryRouter>,
    )

    expect(screen.getByTestId('skeleton')).toBeTruthy()
    await waitFor(() => expect(screen.queryByTestId('skeleton')).toBeNull(), { timeout: 2000 })
  })

  it('renders Analytics content after lazy chunk resolves', async () => {
    const LazyAnalytics = lazy(() => import('../Analytics'))

    render(
      <MemoryRouter>
        <Suspense fallback={<div data-testid="skeleton" />}>
          <LazyAnalytics />
        </Suspense>
      </MemoryRouter>,
    )

    await waitFor(() => expect(screen.queryByTestId('skeleton')).toBeNull(), { timeout: 2000 })
  })

  it('lazy-loads jsPDF on export and shows loading state', async () => {
    const { default: LazyLoadedAnalytics } = await import('../Analytics')

    render(
      <MemoryRouter>
        <LazyLoadedAnalytics />
      </MemoryRouter>,
    )

    const pdfBtn = screen.getByRole('button', { name: /pdf report/i })
    expect(pdfBtn).toBeTruthy()

    fireEvent.click(pdfBtn)
    const loadingBtn = screen.getByRole('button', { name: /loading/i })
    expect(loadingBtn).toBeDisabled()

    await waitFor(
      () => expect(screen.getByRole('button', { name: /pdf report/i })).not.toBeDisabled(),
      { timeout: 2000 },
    )
  })

  it('shows the tokenized chart legend when comparison mode is enabled', async () => {
    const { default: LazyLoadedAnalytics } = await import('../Analytics')

    render(
      <MemoryRouter>
        <LazyLoadedAnalytics />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', { name: /compare periods/i }))

    expect(screen.getAllByLabelText('Chart legend')).toHaveLength(2)
    expect(screen.getByText('This Period %')).toHaveClass('text-caption')
    expect(screen.getByText('Prev Period')).toBeInTheDocument()
  })

  it('shows a no-data placeholder for empty periods and restores charts when switching to populated periods', () => {
    const original90d = analyticsPeriodData['90d']
    analyticsPeriodData['90d'] = []

    try {
      render(
        <MemoryRouter>
          <Analytics />
        </MemoryRouter>,
      )

      fireEvent.click(screen.getByRole('button', { name: '90d' }))

      expect(screen.getAllByTestId('analytics-empty-state')).toHaveLength(3)
      expect(screen.getAllByText('No data for this period (90d).')).toHaveLength(3)

      fireEvent.click(screen.getByRole('button', { name: '30d' }))

      expect(screen.queryByTestId('analytics-empty-state')).not.toBeInTheDocument()
      expect(screen.getByText('Success Rate Over Time')).toBeInTheDocument()
      expect(screen.getByText('Capital Locked Over Time')).toBeInTheDocument()
      expect(screen.getByText('Milestone Completion Trend')).toBeInTheDocument()
    } finally {
      analyticsPeriodData['90d'] = original90d
    }
  })
})
