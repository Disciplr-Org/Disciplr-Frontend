import { ArrowDownRight, ArrowUpRight, Award, CheckCircle, Target } from 'lucide-react'
import type { KpiMetrics } from '../../utils/analyticsKpis'
import { formatCurrency, formatPercentage } from '../../utils/analyticsKpis'
import type { AnalyticsSeriesColors } from '../analyticsTheme'
import { Card, SectionTitle } from './AnalyticsPrimitives'

export function KpiGrid({
  kpis,
  seriesColors,
}: {
  kpis: KpiMetrics
  seriesColors: AnalyticsSeriesColors
}) {
  const stats = [
    {
      label: 'Total Capital Locked',
      value: formatCurrency(kpis.totalCapital),
      sub:
        kpis.capitalDelta !== 0
          ? `${kpis.capitalDelta > 0 ? '+' : ''}${formatCurrency(kpis.capitalDelta)} vs prev`
          : 'USDC',
      icon: <Target size={17} color={seriesColors.success} />,
      up: kpis.capitalTrend,
    },
    {
      label: 'Success Rate',
      value: formatPercentage(kpis.averageSuccessRate),
      sub:
        kpis.successDelta !== 0
          ? `${kpis.successDelta > 0 ? '+' : ''}${formatPercentage(kpis.successDelta, 1)} vs prev`
          : 'Average',
      icon: <CheckCircle size={17} color={seriesColors.success} />,
      up: kpis.successTrend,
    },
    {
      label: 'Total Milestones',
      value: `${kpis.totalMilestones}`,
      sub:
        kpis.milestoneDelta !== 0
          ? `${kpis.milestoneDelta > 0 ? '+' : ''}${kpis.milestoneDelta} vs prev`
          : 'All time',
      icon: <Award size={17} color={seriesColors.success} />,
      up: kpis.milestoneTrend,
    },
  ]

  return (
    <div className="analytics-section">
      <SectionTitle>Key Metrics</SectionTitle>
      <div className="metrics-grid">
        {stats.map((stat, i) => (
          <Card key={i}>
            <div className="kpi-head">
              <span className="kpi-label">{stat.label}</span>
              {stat.icon}
            </div>
            <div className="kpi-value">{stat.value}</div>
            <div className={`kpi-delta ${stat.up ? 'an-text-success' : 'an-text-failed'}`}>
              {stat.up ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
              {stat.sub}
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
