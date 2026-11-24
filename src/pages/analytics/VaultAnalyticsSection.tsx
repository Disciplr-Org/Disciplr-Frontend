import { Suspense } from 'react'
import { Clock, DollarSign } from 'lucide-react'
import Skeleton from '../../components/Skeleton'
import { milestoneTypes } from '../analyticsData'
import { Card, ChartSummary, ChartTitle, SectionTitle } from './AnalyticsPrimitives'
import { AnalyticsCharts, type AnalyticsChartProps } from './chartsIsland'

export function VaultAnalyticsSection({
  chartProps,
}: {
  chartProps: AnalyticsChartProps
}) {
  const vaultStats = [
    { icon: <Clock size={15} color="var(--muted)" />, label: 'Average Vault Duration', value: '18 days' },
    { icon: <DollarSign size={15} color="var(--muted)" />, label: 'Average Vault Amount', value: '$592 USDC' },
  ]

  return (
    <div className="analytics-section">
      <SectionTitle>Vault Analytics</SectionTitle>
      <div className="chart-grid">
        {/* Donut */}
        <Card>
          <ChartTitle>Vaults by Status</ChartTitle>
          <ChartSummary>
            Donut chart summarizing the current vault status distribution.
          </ChartSummary>
          <Suspense fallback={<Skeleton height={180} data-testid="chart-skeleton" />}>
            <AnalyticsCharts section="donut" {...chartProps} />
          </Suspense>
        </Card>

        {/* Vault Stats */}
        <Card>
          <ChartTitle>Vault Stats</ChartTitle>
          <div className="vault-stats-list">
            {vaultStats.map((item, i) => (
              <div key={i} className="vault-stat-row">
                <div className="vault-stat-label">
                  {item.icon} {item.label}
                </div>
                <div className="vault-stat-value">{item.value}</div>
              </div>
            ))}
          </div>

          <div className="milestone-heading">Most Common Milestone Types</div>
          {milestoneTypes.map((m, i) => (
            <div key={i} className="milestone-item">
              <div className="milestone-row">
                <span>{m.type}</span>
                <span className="an-text-muted">{m.count}</span>
              </div>
              <div className="progress-track--thin">
                <div
                  className="disciplr-progress-bar progress-bar progress-bar--animated an-bg-milestone"
                  style={{ width: `${(m.count / 12) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  )
}
