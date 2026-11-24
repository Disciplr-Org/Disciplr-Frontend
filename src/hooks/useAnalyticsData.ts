import { useCallback, useEffect, useMemo, useState } from 'react'
import { isApiEnabled } from '../services/api'
import { listAllActivity, listVaults, type VaultActivityRecord } from '../services/vaultService'
import type { Vault } from '../types/vault'
import { logger } from '../utils/logger'
import { dedupeByName } from '../utils/analyticsRange'
import { useOnRecovered } from './useOnRecovered'
import {
  alignPreviousByName,
  filterMonthlySeries,
  type DateRangeResult,
} from '../pages/analyticsValidation'
import {
  analyticsPeriodData,
  prevPeriodData,
  vaultStatusData as demoVaultStatusData,
  type Period,
} from '../pages/analyticsData'
import {
  buildAnalyticsSeries,
  buildAnalyticsSeriesForRange,
  buildPreviousAnalyticsSeries,
  buildPreviousAnalyticsSeriesForRange,
  buildVaultStatusData,
  hasAnalyticsValues,
} from '../pages/analyticsSeries'

interface SourceState {
  mode: 'fixture' | 'api'
  vaults: Vault[]
  activity: VaultActivityRecord[]
  loading: boolean
  error: string | null
}

export interface AnalyticsDataState {
  chartData: ReturnType<typeof buildAnalyticsSeries>
  prevChartData: ReturnType<typeof buildAnalyticsSeries>
  vaultStatusData: { name: string; value: number }[]
  isLoading: boolean
  error: string | null
  retry: () => void
}

function isFixtureMode(isDemo: boolean): boolean {
  return !isApiEnabled() || isDemo
}

export function useAnalyticsData(
  period: Period,
  dateRange: DateRangeResult,
  isDemo: boolean,
): AnalyticsDataState {
  const fixtureMode = isFixtureMode(isDemo)
  const mode = fixtureMode ? 'fixture' : 'api'
  const [now] = useState(() => new Date())
  const [retryCount, setRetryCount] = useState(0)
  const [source, setSource] = useState<SourceState>(() => ({
    mode,
    vaults: [],
    activity: [],
    loading: !fixtureMode,
    error: null,
  }))

  const retry = useCallback(() => setRetryCount((count) => count + 1), [])

  useEffect(() => {
    let cancelled = false
    if (fixtureMode) {
      setSource({ mode: 'fixture', vaults: [], activity: [], loading: false, error: null })
      return () => {
        cancelled = true
      }
    }

    setSource((current) => ({
      ...current,
      mode: 'api',
      loading: true,
      error: null,
    }))
    Promise.all([listVaults(), listAllActivity()])
      .then(([vaults, activity]) => {
        if (cancelled) return
        setSource({ mode: 'api', vaults, activity, loading: false, error: null })
      })
      .catch((error: unknown) => {
        if (cancelled) return
        const message = error instanceof Error ? error.message : String(error)
        logger.error('[analytics] data_load_failed', { message })
        setSource({
          mode: 'api',
          vaults: [],
          activity: [],
          loading: false,
          error: 'Analytics data could not be loaded. Please retry.',
        })
      })

    return () => {
      cancelled = true
    }
  }, [fixtureMode, retryCount])

  useOnRecovered(retry)

  const chartData = useMemo(() => {
    if (fixtureMode) {
      return dateRange.status === 'valid'
        ? filterMonthlySeries(dedupeByName(analyticsPeriodData['1y']), dateRange.from, dateRange.to)
        : dedupeByName(analyticsPeriodData[period])
    }
    if (source.mode !== 'api' || source.loading || source.error) return []
    const series = dateRange.status === 'valid'
      ? buildAnalyticsSeriesForRange(source.vaults, source.activity, dateRange.from, dateRange.to)
      : buildAnalyticsSeries(source.vaults, source.activity, period, now)
    return hasAnalyticsValues(series) ? series : []
  }, [dateRange, fixtureMode, now, period, source])

  const prevChartData = useMemo(() => {
    if (fixtureMode) {
      return dateRange.status === 'valid'
        ? alignPreviousByName(chartData, prevPeriodData['1y'])
        : prevPeriodData[period]
    }
    if (source.mode !== 'api' || source.loading || source.error) return []
    return dateRange.status === 'valid'
      ? buildPreviousAnalyticsSeriesForRange(source.vaults, source.activity, dateRange.from, dateRange.to)
      : buildPreviousAnalyticsSeries(source.vaults, source.activity, period, now)
  }, [chartData, dateRange, fixtureMode, now, period, source])

  const currentSource = source.mode === mode ? source : null
  const currentVaults = currentSource?.vaults ?? []
  const statusData = fixtureMode
    ? demoVaultStatusData
    : currentSource && !currentSource.loading && !currentSource.error
      ? buildVaultStatusData(currentVaults)
      : []

  return {
    chartData,
    prevChartData,
    vaultStatusData: statusData,
    isLoading: !fixtureMode && (!currentSource || currentSource.loading),
    error: currentSource?.error ?? null,
    retry,
  }
}
