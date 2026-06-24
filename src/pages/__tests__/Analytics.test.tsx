import '@testing-library/jest-dom/vitest'
import React, { Suspense, lazy, type ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Analytics from '../Analytics'
import { buildAnalyticsSeriesColors } from '../analyticsTheme'

type ChartDatum = { name?: string }

const chartMockState = vi.hoisted(() => ({
  lineProps: [] as Array<Record<string, unknown>>,
  areaProps: [] as Array<Record<string, unknown>>,
  barProps: [] as Array<Record<string, unknown>>,
  pieProps: [] as Array<Record<string, unknown>>,
}))

const pdfMockState = vi.hoisted(() => ({
  instances: [] as Array<Record<string, ReturnType<typeof vi.fn>>>,
}))

// ── Browser API stubs (jsdom doesn't implement these) ─────────────────────────

let prefersReducedMotion = false

function installMatchMedia() {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: query === '(prefers-reduced-motion: reduce)' ? prefersReducedMotion : false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  })
}

beforeEach(() => {
  prefersReducedMotion = false
  installMatchMedia()
  chartMockState.lineProps.length = 0
  chartMockState.areaProps.length = 0
  chartMockState.barProps.length = 0
  chartMockState.pieProps.length = 0
  pdfMockState.instances.length = 0
  document.documentElement.removeAttribute('data-theme')
  document.documentElement.removeAttribute('style')
})

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

// ── Heavy dep mocks ───────────────────────────────────────────────────────────

vi.mock('recharts', () => {
  function seriesNames(data?: ChartDatum[]) {
    return data?.map((datum) => datum.name).join(',') ?? ''
  }

  function ResponsiveContainer({ children }: { children: ReactNode }) {
    return <div data-testid="responsive-container">{children}</div>
  }

  function LineChart({ children, data }: { children: ReactNode; data?: ChartDatum[] }) {
    return <div data-testid="line-chart" data-series={seriesNames(data)}>{children}</div>
  }

  function AreaChart({ children, data }: { children: ReactNode; data?: ChartDatum[] }) {
    return <div data-testid="area-chart" data-series={seriesNames(data)}>{children}</div>
  }

  function BarChart({ children, data }: { children: ReactNode; data?: ChartDatum[] }) {
    return <div data-testid="bar-chart" data-series={seriesNames(data)}>{children}</div>
  }

  function PieChart({ children }: { children: ReactNode }) {
    return <div data-testid="pie-chart">{children}</div>
  }

  function Line(props: Record<string, unknown>) {
    chartMockState.lineProps.push(props)
    const dataKey = String(props.dataKey)
    return (
      <div
        data-testid={`line-${dataKey}`}
        data-animation={String(props.isAnimationActive)}
        data-stroke={String(props.stroke)}
      >
        {String(props.name)}
      </div>
    )
  }

  function Area(props: Record<string, unknown>) {
    chartMockState.areaProps.push(props)
    const dataKey = String(props.dataKey)
    return (
      <div
        data-testid={`area-${dataKey}`}
        data-animation={String(props.isAnimationActive)}
        data-stroke={String(props.stroke)}
      >
        {String(props.name)}
      </div>
    )
  }

  function Bar(props: Record<string, unknown>) {
    chartMockState.barProps.push(props)
    const dataKey = String(props.dataKey)
    return (
      <div
        data-testid={`bar-${dataKey}`}
        data-animation={String(props.isAnimationActive)}
        data-fill={String(props.fill)}
      >
        {String(props.name ?? dataKey)}
      </div>
    )
  }

  function Pie(props: { children?: ReactNode; data?: ChartDatum[]; isAnimationActive?: boolean }) {
    chartMockState.pieProps.push(props as Record<string, unknown>)
    return (
      <div
        data-testid="pie"
        data-series={seriesNames(props.data)}
        data-animation={String(props.isAnimationActive)}
      >
        {props.children}
      </div>
    )
  }

  function Tooltip(props: { contentStyle?: { background?: string; border?: string; color?: string } }) {
    return (
      <div
        data-testid="chart-tooltip"
        data-background={props.contentStyle?.background ?? ''}
        data-border={props.contentStyle?.border ?? ''}
      />
    )
  }

  return {
    ResponsiveContainer,
    AreaChart,
    BarChart,
    PieChart,
    Area,
    Bar,
    Pie,
    Cell: () => null,
    XAxis: () => null,
    YAxis: () => null,
    CartesianGrid: () => null,
    Tooltip,
    Legend: () => <div data-testid="chart-legend" />,
    LineChart,
    Line,
  }
})

vi.mock('jspdf', () => ({
  default: vi.fn(() => {
    const instance = {
      setFillColor: vi.fn(),
      rect: vi.fn(),
      setTextColor: vi.fn(),
      setFontSize: vi.fn(),
      setFont: vi.fn(),
      text: vi.fn(),
      setDrawColor: vi.fn(),
      setLineWidth: vi.fn(),
      line: vi.fn(),
      save: vi.fn(),
    }
    pdfMockState.instances.push(instance)
    return instance
  }),
}))

vi.mock('../../context/WalletContext', () => ({
  WalletProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
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
  ThemeProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
  useTheme: () => ({ theme: 'light', toggleTheme: () => {} }),
}))

function renderAnalytics() {
  return render(<Analytics />)
}

function firstLineChart() {
  return screen.getAllByTestId('line-chart')[0]
}

// ── Theme mapping tests ───────────────────────────────────────────────────────

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

// ── Analytics page behavior ──────────────────────────────────────────────────

describe('Analytics page behavior', () => {
  it.each([
    ['7d', 'Mon,Tue,Wed,Thu,Fri,Sat,Sun'],
    ['30d', 'Wk1,Wk2,Wk3,Wk4'],
    ['90d', 'Jan,Feb,Mar'],
    ['1y', 'Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec'],
    ['All', '2023,2024,2025'],
  ])('updates rendered chart data when switching to %s', (period, expectedSeries) => {
    renderAnalytics()

    fireEvent.click(screen.getByRole('button', { name: period }))

    expect(firstLineChart()).toHaveAttribute('data-series', expectedSeries)
  })

  it('adds previous-period series when comparison mode is enabled', () => {
    renderAnalytics()

    expect(screen.queryByTestId('line-prevSuccess')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /compare periods/i }))

    expect(screen.getByText(/Comparing with previous period/i)).toBeInTheDocument()
    expect(screen.getByTestId('line-prevSuccess')).toHaveAttribute('data-animation', 'true')
    expect(screen.getByTestId('area-prevCapital')).toHaveAttribute('data-animation', 'true')
  })

  it('disables chart animation when reduced motion is preferred', async () => {
    prefersReducedMotion = true
    installMatchMedia()

    renderAnalytics()

    await waitFor(() => {
      expect(screen.getByTestId('line-success')).toHaveAttribute('data-animation', 'false')
    })
    expect(screen.getByTestId('bar-milestones')).toHaveAttribute('data-animation', 'false')
    expect(screen.getByTestId('pie')).toHaveAttribute('data-animation', 'false')
  })

  it('runs the jsPDF export pipeline for the selected period', () => {
    renderAnalytics()

    fireEvent.click(screen.getByRole('button', { name: 'All' }))
    fireEvent.click(screen.getByRole('button', { name: /pdf report/i }))

    expect(pdfMockState.instances).toHaveLength(1)
    const [doc] = pdfMockState.instances
    expect(doc.text).toHaveBeenCalledWith(
      expect.stringContaining('Period: All'),
      14,
      24,
    )
    expect(doc.text).toHaveBeenCalledWith('2023', 17, 128)
    expect(doc.save).toHaveBeenCalledWith('disciplr-report-All.pdf')
  })

  it('recomputes chart tokens after the document theme attribute changes', async () => {
    document.documentElement.style.setProperty('--success', 'rgb(1, 2, 3)')
    renderAnalytics()

    expect(screen.getByTestId('line-success')).toHaveAttribute('data-stroke', 'rgb(1, 2, 3)')

    document.documentElement.style.setProperty('--success', 'rgb(4, 5, 6)')
    document.documentElement.style.setProperty('--surface', 'rgb(7, 8, 9)')
    document.documentElement.style.setProperty('--border', 'rgb(10, 11, 12)')
    document.documentElement.setAttribute('data-theme', 'dark')

    await waitFor(() => {
      expect(screen.getByTestId('line-success')).toHaveAttribute('data-stroke', 'rgb(4, 5, 6)')
    })
    expect(screen.getAllByTestId('chart-tooltip')[0]).toHaveAttribute(
      'data-background',
      'rgb(7, 8, 9)',
    )
    expect(screen.getAllByTestId('chart-tooltip')[0]).toHaveAttribute(
      'data-border',
      '1px solid rgb(10, 11, 12)',
    )
  })
})

// ── Lazy-route / Suspense tests ───────────────────────────────────────────────

describe('Analytics lazy route', () => {
  it('Suspense renders skeleton fallback before chunk resolves', async () => {
    const LazyAnalytics = lazy(
      // Delay the import so the fallback is visible during the test
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

    // Skeleton must be present while chunk is loading
    expect(screen.getByTestId('skeleton')).toBeTruthy()

    // Wait for the lazy chunk to settle and skeleton to disappear
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

    // After the chunk resolves the skeleton must be gone
    await waitFor(() => expect(screen.queryByTestId('skeleton')).toBeNull(), { timeout: 2000 })
  })
})
