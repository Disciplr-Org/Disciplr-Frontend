import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import AnalyticsCharts, {
  type AnalyticsChartsProps,
  type PeriodRow,
} from '../AnalyticsCharts'
import {
  ANALYTICS_TOKEN_FALLBACKS,
  buildAnalyticsSeriesColors,
} from '../analyticsTheme'
import type { ChartLegendEntry } from '../../components/ChartLegend'

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  LineChart: () => <div data-testid="line-chart" />,
  AreaChart: () => <div data-testid="area-chart" />,
  BarChart: () => <div data-testid="bar-chart" />,
  PieChart: () => <div data-testid="pie-chart" />,
  Line: () => null,
  Area: () => null,
  Bar: () => null,
  Pie: () => <div data-testid="pie" />,
  Cell: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
}))

const seriesColors = buildAnalyticsSeriesColors(ANALYTICS_TOKEN_FALLBACKS)

const successLegendEntries: ChartLegendEntry[] = [
  { label: 'This Period %', colorKey: 'success', id: 'success' },
  { label: 'Failed %', colorKey: 'failed', id: 'failed' },
  { label: 'Prev Period %', colorKey: 'comparison', id: 'comparison' },
]

const capitalLegendEntries: ChartLegendEntry[] = [
  { label: 'USDC Locked', colorKey: 'success', id: 'capital' },
  { label: 'Prev Period', colorKey: 'comparison', id: 'prev-capital' },
]

const samplePeriodRow: PeriodRow = {
  name: 'Week 1',
  success: 82,
  failed: 18,
  capital: 1200,
  milestones: 4,
  prevSuccess: 75,
  prevCapital: 900,
}

function baseProps(overrides: Partial<AnalyticsChartsProps> = {}): AnalyticsChartsProps {
  return {
    section: 'performance',
    displayData: [samplePeriodRow],
    chartData: [samplePeriodRow],
    period: '30d',
    vaultStatusData: [
      { name: 'Active', value: 5 },
      { name: 'Completed', value: 3 },
      { name: 'Failed', value: 1 },
    ],
    teamChartData: [
      { name: 'Alice', rate: 94 },
      { name: 'Bob', rate: 81 },
    ],
    showComparison: false,
    chartAnimationEnabled: false,
    tooltipStyle: {},
    seriesColors,
    chartTokens: ANALYTICS_TOKEN_FALLBACKS,
    successLegendEntries,
    capitalLegendEntries,
    isLoading: false,
    ...overrides,
  }
}

function renderCharts(overrides: Partial<AnalyticsChartsProps> = {}) {
  return render(<AnalyticsCharts {...baseProps(overrides)} />)
}

describe('AnalyticsCharts — performance section', () => {
  it('shows loading skeletons when isLoading is true', () => {
    renderCharts({ section: 'performance', isLoading: true })

    expect(screen.getAllByTestId('chart-skeleton')).toHaveLength(3)
    expect(screen.queryByTestId('analytics-empty-state')).not.toBeInTheDocument()
    expect(screen.queryByTestId('line-chart')).not.toBeInTheDocument()
  })

  it('shows empty states when chartData is empty', () => {
    renderCharts({
      section: 'performance',
      chartData: [],
      displayData: [],
      period: '90d',
    })

    const emptyStates = screen.getAllByTestId('analytics-empty-state')
    expect(emptyStates).toHaveLength(3)
    expect(screen.getAllByText('No data for this period (90d).')).toHaveLength(3)
    expect(screen.queryByTestId('chart-skeleton')).not.toBeInTheDocument()
  })

  it('renders chart titles when populated', () => {
    renderCharts({ section: 'performance' })

    expect(screen.getByText('Success Rate Over Time')).toBeInTheDocument()
    expect(screen.getByText('Capital Locked Over Time')).toBeInTheDocument()
    expect(screen.getByText('Milestone Completion Trend')).toBeInTheDocument()
    expect(screen.getByTestId('line-chart')).toBeInTheDocument()
    expect(screen.getByTestId('area-chart')).toBeInTheDocument()
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument()
    expect(screen.queryByTestId('analytics-empty-state')).not.toBeInTheDocument()
  })

  it('shows comparison legends when showComparison is true', () => {
    renderCharts({ section: 'performance', showComparison: true })

    expect(screen.getAllByLabelText('Chart legend')).toHaveLength(2)
    expect(screen.getByText('This Period %')).toBeInTheDocument()
    expect(screen.getByText('Prev Period %')).toBeInTheDocument()
    expect(screen.getByText('USDC Locked')).toBeInTheDocument()
    expect(screen.getByText('Prev Period')).toBeInTheDocument()
    expect(
      screen.getByText(/Previous period success rate is included for comparison/),
    ).toBeInTheDocument()
  })

  it('hides comparison legends when showComparison is false', () => {
    renderCharts({ section: 'performance', showComparison: false })

    expect(screen.queryByLabelText('Chart legend')).not.toBeInTheDocument()
    expect(
      screen.queryByText(/Previous period success rate is included for comparison/),
    ).not.toBeInTheDocument()
  })
})

describe('AnalyticsCharts — donut section', () => {
  it('shows a loading skeleton when isLoading is true', () => {
    renderCharts({ section: 'donut', isLoading: true })

    expect(screen.getByTestId('chart-skeleton')).toBeInTheDocument()
    expect(screen.queryByTestId('analytics-empty-state')).not.toBeInTheDocument()
    expect(screen.queryByTestId('pie-chart')).not.toBeInTheDocument()
  })

  it('shows empty state when vaultStatusData is empty', () => {
    renderCharts({ section: 'donut', vaultStatusData: [] })

    expect(screen.getByTestId('analytics-empty-state')).toBeInTheDocument()
    expect(screen.getByText('No data for this period.')).toBeInTheDocument()
    expect(screen.queryByTestId('pie-chart')).not.toBeInTheDocument()
  })

  it('renders pie chart and status legend when populated', () => {
    renderCharts({ section: 'donut' })

    expect(screen.getByTestId('pie-chart')).toBeInTheDocument()
    expect(screen.getByText('Active (5)')).toBeInTheDocument()
    expect(screen.getByText('Completed (3)')).toBeInTheDocument()
    expect(screen.getByText('Failed (1)')).toBeInTheDocument()
    expect(screen.queryByTestId('analytics-empty-state')).not.toBeInTheDocument()
  })
})

describe('AnalyticsCharts — team section', () => {
  it('shows a loading skeleton when isLoading is true', () => {
    renderCharts({ section: 'team', isLoading: true })

    expect(screen.getByTestId('chart-skeleton')).toBeInTheDocument()
    expect(screen.queryByTestId('bar-chart')).not.toBeInTheDocument()
    expect(screen.queryByTestId('analytics-empty-state')).not.toBeInTheDocument()
  })

  it('shows empty state when teamChartData is empty', () => {
    renderCharts({ section: 'team', teamChartData: [], period: '7d' })

    expect(screen.getByTestId('analytics-empty-state')).toBeInTheDocument()
    expect(screen.getByText('No data for this period (7d).')).toBeInTheDocument()
    expect(screen.queryByTestId('bar-chart')).not.toBeInTheDocument()
  })

  it('renders the team bar chart when populated', () => {
    renderCharts({ section: 'team' })

    expect(screen.getByTestId('bar-chart')).toBeInTheDocument()
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
    expect(screen.queryByTestId('analytics-empty-state')).not.toBeInTheDocument()
    expect(screen.queryByTestId('chart-skeleton')).not.toBeInTheDocument()
  })
})
