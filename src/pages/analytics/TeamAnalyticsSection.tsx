import { Suspense } from 'react'
import { Crown, Lock, Users } from 'lucide-react'
import Skeleton from '../../components/Skeleton'
import type { AnalyticsSeriesColors } from '../analyticsTheme'
import { Card, ChartSummary, ChartTitle, SectionTitle } from './AnalyticsPrimitives'
import { AnalyticsCharts, type AnalyticsChartProps } from './chartsIsland'

const TEAM_MEMBERS = [
  { name: 'Alice', score: 94, vaults: 8 },
  { name: 'Bob', score: 78, vaults: 5 },
  { name: 'Carol', score: 88, vaults: 6 },
]

const ORG_SUMMARY = [
  { label: 'Total Members', value: '12' },
  { label: 'Team Success Rate', value: '81%' },
  { label: 'Total Capital Locked', value: '$48,200 USDC' },
  { label: 'Active Vaults', value: '23' },
  { label: 'Top Performer', value: 'Alice (94%)' },
]

export function TeamAnalyticsSection({
  chartProps,
  seriesColors,
}: {
  chartProps: AnalyticsChartProps
  seriesColors: AnalyticsSeriesColors
}) {
  return (
    <div className="analytics-section analytics-section--tight">
      <SectionTitle>
        <span>Team &amp; Organization Analytics </span>
        <span className="enterprise-badge">ENTERPRISE</span>
      </SectionTitle>

      {/* Upgrade banner */}
      <div className="enterprise-banner">
        <Crown size={22} color={seriesColors.warning} className="enterprise-crown" />
        <div className="enterprise-body">
          <div className="enterprise-banner-title">Unlock Team Analytics with Enterprise</div>
          <div className="enterprise-banner-text">
            Monitor your entire organization's accountability performance, compare members, and
            export team-wide reports.
          </div>
        </div>
        <button
          onClick={() =>
            window.open('mailto:sales@disciplr.app?subject=Enterprise%20Upgrade%20Inquiry', '_blank')
          }
          className="enterprise-upgrade-btn"
        >
          Upgrade to Enterprise
        </button>
      </div>

      {/* Blurred preview */}
      <div className="bench-grid bench-grid--team">
        {/* Lock overlay */}
        <div className="enterprise-lock-overlay">
          <div className="enterprise-lock">
            <Lock size={28} color={seriesColors.warning} className="enterprise-lock-icon" />
            <div className="enterprise-lock-title">Enterprise Feature</div>
            <div className="enterprise-lock-text">Upgrade to view team data</div>
          </div>
        </div>

        {/* Team Members */}
        <Card className="analytics-card--dimmed" locked>
          <div className="member-head">
            <Users size={17} color="var(--muted)" />
            <span className="member-head-label">Team Members</span>
          </div>
          {TEAM_MEMBERS.map((member, i) => (
            <div key={i} className="member-row">
              <div className="member-left">
                <div className="member-avatar">{member.name[0]}</div>
                {member.name}
              </div>
              <div className="member-right">
                <div className="member-score an-text-success">{member.score}%</div>
                <div className="member-vaults">{member.vaults} vaults</div>
              </div>
            </div>
          ))}
        </Card>

        {/* Team Bar Chart */}
        <Card className="analytics-card--dimmed" locked>
          <ChartTitle>Team Success Rate</ChartTitle>
          <ChartSummary>
            Locked enterprise preview bar chart showing example team member success rates.
          </ChartSummary>
          <Suspense fallback={<Skeleton height={160} data-testid="chart-skeleton" />}>
            <AnalyticsCharts section="team" {...chartProps} />
          </Suspense>
        </Card>

        {/* Org Summary */}
        <Card className="analytics-card--dimmed" locked>
          <ChartTitle>Organization Summary</ChartTitle>
          <div className="org-summary">
            {ORG_SUMMARY.map((item, i) => (
              <div key={i} className="org-row">
                <span className="an-text-muted">{item.label}</span>
                <span className="org-row-value">{item.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
