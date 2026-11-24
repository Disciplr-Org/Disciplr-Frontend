import { useMemo } from 'react'
import { AlertTriangle, Award, Flame, TrendingUp } from 'lucide-react'
import type { AnalyticsSeriesColors } from '../analyticsTheme'
import { Card, SectionTitle } from './AnalyticsPrimitives'

export function BehavioralInsightsSection({
  chartData,
  seriesColors,
}: {
  chartData: { name: string; success: number }[]
  seriesColors: AnalyticsSeriesColors
}) {
  const bestPeriod = useMemo(() => {
    if (!chartData.length) return null
    return chartData.reduce((best, current) => (current.success > best.success ? current : best))
  }, [chartData])

  const currentStreak = useMemo(() => {
    let streak = 0
    for (let i = chartData.length - 1; i >= 0; i--) {
      if (chartData[i].success >= 80) {
        streak++
      } else {
        break
      }
    }
    return streak
  }, [chartData])

  return (
    <div className="analytics-section">
      <SectionTitle>Behavioral Insights</SectionTitle>
      <div className="insights-grid">
        <Card className="analytics-card--center">
          <Flame size={26} color={seriesColors.warning} className="insight-icon" />
          <div className="insight-value insight-value--lg an-text-warning">{currentStreak}</div>
          <div className="insight-title">Current Streak</div>
          <div className="insight-caption">consecutive successes 🔥</div>
        </Card>

        <Card className="analytics-card--center">
          <TrendingUp size={26} color={seriesColors.success} className="insight-icon" />
          <div className="insight-value insight-value--md an-text-success">
            {bestPeriod?.name ?? '—'}
          </div>
          <div className="insight-title">Best Period</div>
          <div className="insight-caption">
            {bestPeriod ? `${bestPeriod.success}% success rate` : 'No data yet'}
          </div>
        </Card>

        <Card className="analytics-card--center">
          <AlertTriangle size={26} color={seriesColors.failed} className="insight-icon" />
          <div className="insight-value insight-value--md an-text-failed">Q1</div>
          <div className="insight-title">Needs Work</div>
          <div className="insight-caption">3 failed vaults Jan–Mar</div>
        </Card>

        <Card className="analytics-card--center">
          <Award size={26} color={seriesColors.success} className="insight-icon" />
          <div className="insight-value insight-value--lg an-text-success">82</div>
          <div className="insight-title">Accountability Score</div>
          <div className="insight-caption">out of 100 · Top 15%</div>
        </Card>
      </div>
    </div>
  )
}
