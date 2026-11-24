import { ArrowDownRight, ArrowUpRight, DollarSign } from 'lucide-react'
import type { AnalyticsSeriesColors } from '../analyticsTheme'
import { Card, SectionTitle } from './AnalyticsPrimitives'

export function CapitalFlowSection({ seriesColors }: { seriesColors: AnalyticsSeriesColors }) {
  return (
    <div className="analytics-section">
      <SectionTitle>Capital Flow</SectionTitle>
      <div className="flow-grid">
        <Card>
          <div className="flow-head">
            <ArrowUpRight size={17} color={seriesColors.success} />
            <span className="flow-label">Released to Success</span>
          </div>
          <div className="flow-value an-text-success">$8,750 USDC</div>
          <div className="flow-caption">Paid out to 14 success addresses</div>
        </Card>

        <Card>
          <div className="flow-head">
            <ArrowDownRight size={17} color={seriesColors.failed} />
            <span className="flow-label">Redirected on Failure</span>
          </div>
          <div className="flow-value an-text-failed">$2,400 USDC</div>
          <div className="flow-caption">Sent to 4 failure destinations</div>
        </Card>

        <Card>
          <div className="flow-head">
            <DollarSign size={17} color="var(--muted)" />
            <span className="flow-label">Fee Summary</span>
          </div>
          <div className="flow-value">$124 USDC</div>
          <div className="flow-caption">1% platform fee on all vaults</div>
        </Card>
      </div>
    </div>
  )
}
