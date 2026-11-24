import { useState, useMemo, useCallback, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom' // Ensure search params are available
import { useTheme } from '../context/ThemeContext'
import { useOptionalWallet } from '../context/WalletContext'
import { usePrefersReducedMotion } from '../utils/usePrefersReducedMotion'
import { computeAnalyticsKpis } from '../utils/analyticsKpis'
import { type Period, parsePeriod, serializePeriod } from '../utils/periodParam'
import { dedupeByName } from '../utils/analyticsRange'
import { useAnalyticsExport } from '../hooks/useAnalyticsExport'
import { useAnalyticsData } from '../hooks/useAnalyticsData'

import { buildAnalyticsSeriesColors, getAnalyticsChartTokens } from './analyticsTheme'
import type { ChartLegendEntry } from '../components/ChartLegend'
import { TEAM_CHART_DATA } from './analyticsData'
import { validateDateRange } from './analyticsValidation'

import { RangePicker } from './analytics/RangePicker'
import { ExportMenu } from './analytics/ExportMenu'
import { KpiGrid } from './analytics/KpiGrid'
import { PerformanceSection } from './analytics/PerformanceSection'
import { VaultAnalyticsSection } from './analytics/VaultAnalyticsSection'
import { BehavioralInsightsSection } from './analytics/BehavioralInsightsSection'
import { CapitalFlowSection } from './analytics/CapitalFlowSection'
import { BenchmarkSection } from './analytics/BenchmarkSection'
import { GoalsSection } from './analytics/GoalsSection'
import { TeamAnalyticsSection } from './analytics/TeamAnalyticsSection'
import type { AnalyticsChartProps } from './analytics/chartsIsland'

import './Analytics.css'

const MA_WINDOW = 3

function useAnalyticsChartTokens() {
  const { theme } = useTheme()
  const [tokens, setTokens] = useState(() => getAnalyticsChartTokens())

  useEffect(() => {
    const root = document.documentElement
    const syncTokens = () => setTokens(getAnalyticsChartTokens(root))
    syncTokens()

    const observer = new MutationObserver(syncTokens)
    observer.observe(root, { attributes: true, attributeFilter: ['data-theme'] })

    return () => observer.disconnect()
  }, [theme])

  return tokens
}

export default function Analytics() {
  const chartTokens = useAnalyticsChartTokens()
  const seriesColors = useMemo(() => buildAnalyticsSeriesColors(chartTokens), [chartTokens])
  const prefersReducedMotion = usePrefersReducedMotion()
  const [searchParams, setSearchParams] = useSearchParams()
  const [period, setPeriodInternal] = useState<Period>(() => parsePeriod(searchParams.get('period')))
  const [showComparison, setShowComparison] = useState(false)
  const [showMovingAverage, setShowMovingAverage] = useState(false)
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [goalRate, setGoalRate] = useState('90')
  const [goalCapital, setGoalCapital] = useState('5000')
  const isDemo = useOptionalWallet()?.isDemo ?? false

  const setPeriod = useCallback((p: Period) => {
    setPeriodInternal(p)
    const nextParams = new URLSearchParams(searchParams)
    nextParams.set('period', serializePeriod(p))
    setSearchParams(nextParams)
  }, [searchParams, setSearchParams])

  useEffect(() => {
    const queryPeriod = parsePeriod(searchParams.get('period'))
    if (queryPeriod !== period) {
      setPeriodInternal(queryPeriod)
    }
  }, [period, searchParams])

  // ─── Custom date range filtering ─────────────────────────────────────────
  // Invariant: the custom range only drives the data when both inputs parse as
  // local dates and start <= end. Any other state (empty, half-filled,
  // malformed, reversed) falls back to the selected preset period, and
  // malformed/reversed input surfaces `dateRangeError` instead of failing silently.
  // The preset period buttons are visually deactivated while a custom range is active.
  const dateRange = useMemo(() => validateDateRange(customFrom, customTo), [customFrom, customTo])
  const dateRangeError = dateRange.status === 'invalid' ? dateRange.error : null
  const customRangeActive = dateRange.status === 'valid'

  // ─── Memoized data selections ──────────────────────────────────────────────
  const {
    chartData,
    prevChartData,
    vaultStatusData,
    isLoading,
    error: analyticsError,
    retry: retryAnalytics,
  } = useAnalyticsData(period, dateRange, isDemo)

  const comparisonData = useMemo(
    () => dedupeByName(chartData).map((d, i) => ({
      ...d,
      prevSuccess: prevChartData[i]?.success ?? 0,
      prevCapital: prevChartData[i]?.capital ?? 0,
    })),
    [chartData, prevChartData]
  )

  const displayData = useMemo(
    () => (showComparison ? comparisonData : chartData),
    [showComparison, comparisonData, chartData]
  )

  // ─── Memoized KPI computation ──────────────────────────────────────────────
  const kpis = useMemo(
    () => computeAnalyticsKpis(chartData, prevChartData),
    [chartData, prevChartData]
  )

  // Benchmarks are computed inside BenchmarkSection from the same memoized KPIs.

  const chartAnimationEnabled = !prefersReducedMotion

  const tooltipStyle = useMemo(() => ({
    contentStyle: {
      background: seriesColors.tooltipBackground,
      border: `1px solid ${seriesColors.tooltipBorder}`,
      borderRadius: '10px',
      color: seriesColors.tooltipText,
      fontSize: '0.85rem',
    },
    itemStyle: { color: seriesColors.tooltipText },
    labelStyle: { color: seriesColors.tooltipMuted },
  }), [seriesColors])

  const successLegendEntries = useMemo<ChartLegendEntry[]>(() => showComparison
    ? [
        { label: 'This Period %', colorKey: 'success', id: 'success' },
        { label: 'Failed %', colorKey: 'failed', id: 'failed' },
        { label: 'Prev Period %', colorKey: 'comparison', id: 'comparison' },
      ]
    : [
        { label: 'This Period %', colorKey: 'success', id: 'success' },
        { label: 'Failed %', colorKey: 'failed', id: 'failed' },
      ], [showComparison])

  const capitalLegendEntries = useMemo<ChartLegendEntry[]>(() => showComparison
    ? [
        { label: 'USDC Locked', colorKey: 'success', id: 'capital' },
        { label: 'Prev Period', colorKey: 'comparison', id: 'prev-capital' },
      ]
    : [
        { label: 'USDC Locked', colorKey: 'success', id: 'capital' },
      ], [showComparison])

  // ─── Stable callback for period buttons ───────────────────────────────────
  const handlePeriodClick = useCallback((p: Period) => {
    setPeriod(p)
  }, [setPeriod])

  const clearCustomRange = useCallback(() => {
    setCustomFrom('')
    setCustomTo('')
  }, [])

  // ─── Stable callbacks for AnalyticsCharts ────────────────────
  const analyticsChartProps = useMemo<AnalyticsChartProps>(() => ({
    displayData,
    chartData,
    period,
    vaultStatusData,
    teamChartData: TEAM_CHART_DATA,
    showComparison,
    chartAnimationEnabled,
    tooltipStyle,
    seriesColors,
    chartTokens,
    successLegendEntries,
    capitalLegendEntries,
    isLoading,
  }), [
    displayData,
    chartData,
    period,
    vaultStatusData,
    showComparison,
    chartAnimationEnabled,
    tooltipStyle,
    seriesColors,
    chartTokens,
    successLegendEntries,
    capitalLegendEntries,
    isLoading,
  ])

  // ─── Export handlers (CSV + lazy jsPDF) ────────────────────────────────────
  const { exportCsv, exportPdf, isExportLoading, exportError } = useAnalyticsExport({
    rows: chartData,
    kpis,
    period,
    customRangeActive,
    customFrom,
    customTo,
  })

  return (
    <div className="analytics-page">
      {/* ── Header ── */}
      <div className="analytics-header">
        <h1 className="analytics-title">Analytics</h1>
        <p className="analytics-subtitle">
          Track your vault performance and accountability patterns.
        </p>
      </div>
                <div style={{ fontSize: '0.75rem', color: stat.up ? 'var(--accent)' : 'var(--danger-text)', display: 'flex', alignItems: 'center', gap: '0.15rem' }}>
                    <span style={{ color: item.you >= item.platform ? 'var(--accent)' : 'var(--danger-text)', fontWeight: 700 }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--accent)', marginBottom: '0.15rem' }}>You</div>
                    <span style={{ color: rateGoalMet ? 'var(--accent)' : 'var(--warning-text)' }}>
                  <div style={{ fontSize: '0.75rem', color: kpis.averageSuccessRate >= Number(goalRate) ? 'var(--accent)' : 'var(--muted)', marginTop: '0.3rem' }}>
                    <span style={{ color: capitalGoalMet ? 'var(--accent)' : 'var(--warning-text)' }}>
                  <div style={{ fontSize: '0.75rem', color: kpis.totalCapital >= Number(goalCapital) ? 'var(--accent)' : 'var(--muted)', marginTop: '0.3rem' }}>

      {analyticsError && (
        <div role="alert" style={{ color: 'var(--danger)', marginBottom: '1rem' }}>
          {analyticsError}{' '}
          <button type="button" onClick={retryAnalytics}>Retry</button>
        </div>
      )}

      {/* ── Controls Bar ── */}
      <div className="analytics-controls">
        <RangePicker
          period={period}
          customFrom={customFrom}
          customTo={customTo}
          customRangeActive={customRangeActive}
          dateRangeError={dateRangeError}
          showComparison={showComparison}
          showMovingAverage={showMovingAverage}
          movingAverageWindow={MA_WINDOW}
          onPeriodSelect={handlePeriodClick}
          onFromChange={setCustomFrom}
          onToChange={setCustomTo}
          onClearRange={clearCustomRange}
          onToggleComparison={() => setShowComparison((v) => !v)}
          onToggleMovingAverage={() => setShowMovingAverage((v) => !v)}
        />

        {/* Spacer */}
        <div className="analytics-spacer" />

        {/* Export Buttons */}
        <ExportMenu
          onExportCsv={exportCsv}
          onExportPdf={exportPdf}
          csvDisabled={chartData.length === 0}
          isExportLoading={isExportLoading}
          exportError={exportError}
        />
      </div>
              color: '#111827',

      {/* ── SECTION 1: Key Metrics Cards ── */}
      <KpiGrid kpis={kpis} seriesColors={seriesColors} />
              color: '#111827',

      {/* ── SECTION 2: Performance Charts ── */}
      <PerformanceSection chartProps={analyticsChartProps} showComparison={showComparison} />

      {/* ── SECTION 3: Vault Analytics ── */}
      <VaultAnalyticsSection chartProps={analyticsChartProps} />

      {/* ── SECTION 4: Behavioral Insights ── */}
      <BehavioralInsightsSection chartData={chartData} seriesColors={seriesColors} />
                    <div style={{ fontWeight: 700, color: 'var(--accent)' }}>{member.score}%</div>

      {/* ── SECTION 5: Capital Flow ── */}
      <CapitalFlowSection seriesColors={seriesColors} />

      {/* ── SECTION 6: Benchmarking ── */}
      <BenchmarkSection kpis={kpis} seriesColors={seriesColors} />

      {/* ── SECTION 7: Goal Setting ── */}
      <GoalsSection
        kpis={kpis}
        seriesColors={seriesColors}
        goalRate={goalRate}
        goalCapital={goalCapital}
        onGoalRateChange={setGoalRate}
        onGoalCapitalChange={setGoalCapital}
      />

      {/* ── SECTION 8: Team / Organization Analytics (Enterprise) ── */}
      <TeamAnalyticsSection chartProps={analyticsChartProps} seriesColors={seriesColors} />
    </div>
  )
}
