import React, { Suspense, lazy, act } from 'react'
import { describe, expect, it, vi, beforeAll, beforeEach } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { buildAnalyticsSeriesColors } from '../analyticsTheme'

type ChartContainerProps = React.PropsWithChildren

const pdfMocks = vi.hoisted(() => {
  const doc = {
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

  return {
    doc,
    importDelayMs: 0,
    constructor: vi.fn(() => doc),
  }
})

// ── Browser API stubs (jsdom doesn't implement these) ─────────────────────────

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

beforeEach(() => {
  pdfMocks.importDelayMs = 0
  pdfMocks.constructor.mockClear()
  Object.values(pdfMocks.doc).forEach(mock => mock.mockClear())
})

// ── Heavy dep mocks ───────────────────────────────────────────────────────────

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: ChartContainerProps) => <div>{children}</div>,
  AreaChart: ({ children }: ChartContainerProps) => <div>{children}</div>,
  BarChart: ({ children }: ChartContainerProps) => <div>{children}</div>,
  PieChart: ({ children }: ChartContainerProps) => <div>{children}</div>,
  Area: () => null,
  Bar: () => null,
  Pie: () => null,
  Cell: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
  LineChart: ({ children }: ChartContainerProps) => <div>{children}</div>,
  Line: () => null,
}))

vi.mock('jspdf', async () => {
  if (pdfMocks.importDelayMs > 0) {
    await new Promise(resolve => setTimeout(resolve, pdfMocks.importDelayMs))
  }

  return {
    default: pdfMocks.constructor,
  }
})

vi.mock('../../context/WalletContext', () => ({
  WalletProvider: ({ children }: ChartContainerProps) => <>{children}</>,
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
  ThemeProvider: ({ children }: ChartContainerProps) => <>{children}</>,
  useTheme: () => ({ theme: 'light', toggleTheme: () => {} }),
}))

async function renderAnalytics() {
  const { default: Analytics } = await import('../Analytics')

  return render(
    <MemoryRouter>
      <Analytics />
    </MemoryRouter>,
  )
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

// ── PDF export tests ─────────────────────────────────────────────────────────

describe('Analytics PDF export', () => {
  it('disables the PDF export button while jsPDF loads and then saves the report', async () => {
    pdfMocks.importDelayMs = 25

    await renderAnalytics()

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: /pdf report/i }))
    })

    expect(screen.getByRole('button', { name: /preparing pdf/i })).toBeDisabled()

    await waitFor(() => {
      expect(pdfMocks.doc.save).toHaveBeenCalledWith('disciplr-report-30d.pdf')
    })
    expect(screen.getByRole('button', { name: /pdf report/i })).not.toBeDisabled()
  })

  it('shows an inline error when PDF export fails', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    pdfMocks.constructor.mockImplementationOnce(() => {
      throw new Error('jsPDF failed to load')
    })

    await renderAnalytics()

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: /pdf report/i }))
    })

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('PDF export could not load. Please try again.')
    })
    expect(pdfMocks.constructor).not.toHaveBeenCalled()
    expect(pdfMocks.doc.save).not.toHaveBeenCalled()

    consoleError.mockRestore()
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
