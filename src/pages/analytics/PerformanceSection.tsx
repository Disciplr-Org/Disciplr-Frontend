import { Suspense } from 'react'
import Skeleton from '../../components/Skeleton'
import { SectionTitle } from './AnalyticsPrimitives'
import { AnalyticsCharts, type AnalyticsChartProps } from './chartsIsland'

export function PerformanceSection({
  chartProps,
  showComparison,
}: {
  chartProps: AnalyticsChartProps
  showComparison: boolean
}) {
  return (
    <div className="analytics-section">
      <SectionTitle>
        Performance Charts{' '}
        {showComparison && (
          <span className="analytics-comparison-note">Comparing with previous period</span>
        )}
      </SectionTitle>
      <Suspense fallback={<Skeleton height={300} data-testid="chart-skeleton" />}>
        <AnalyticsCharts section="performance" {...chartProps} />
      </Suspense>
    </div>
  )
}
