/**
 * Single lazy boundary for the recharts chart subtree. Every chart section
 * renders this component, so the recharts vendor chunk is fetched once and
 * stays out of the eager Analytics bundle path.
 */
import { lazy } from 'react'

export const AnalyticsCharts = lazy(() => import('../AnalyticsCharts'))

export type { AnalyticsChartsProps } from '../AnalyticsCharts'
export type AnalyticsChartProps = Omit<import('../AnalyticsCharts').AnalyticsChartsProps, 'section'>
