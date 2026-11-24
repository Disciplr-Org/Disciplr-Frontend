import { useMemo } from 'react'
import { BarChart2, CheckCircle, Flag, Flame } from 'lucide-react'
import type { KpiMetrics } from '../../utils/analyticsKpis'
import { formatCurrency, formatPercentage } from '../../utils/analyticsKpis'
import { safePercent, parseGoalInput } from '../analyticsValidation'
import { formatUsdc } from '../../utils/format'
import type { AnalyticsSeriesColors } from '../analyticsTheme'
import { Card, SectionTitle } from './AnalyticsPrimitives'

const RATE_GOAL_BOUNDS = { min: 0, max: 100 }
const CAPITAL_GOAL_BOUNDS = { min: 0, max: 1_000_000_000 }

export type GoalsSectionProps = {
  kpis: KpiMetrics
  seriesColors: AnalyticsSeriesColors
  goalRate: string
  goalCapital: string
  onGoalRateChange: (value: string) => void
  onGoalCapitalChange: (value: string) => void
}

export function GoalsSection({
  kpis,
  seriesColors,
  goalRate,
  goalCapital,
  onGoalRateChange,
  onGoalCapitalChange,
}: GoalsSectionProps) {
  // Invariant: goal progress is only evaluated against a finite, in-range goal.
  // Empty/invalid input shows a message and no marker — never "Goal achieved",
  // "NaN% to go" or a marker outside the bar.
  const rateGoal = useMemo(() => parseGoalInput(goalRate, RATE_GOAL_BOUNDS), [goalRate])
  const capitalGoal = useMemo(() => parseGoalInput(goalCapital, CAPITAL_GOAL_BOUNDS), [goalCapital])
  const rateGoalMet = rateGoal.value !== null && kpis.averageSuccessRate >= rateGoal.value
  const capitalGoalMet = capitalGoal.value !== null && kpis.totalCapital >= capitalGoal.value

  const quickTips = [
    { icon: <BarChart2 size={14} color={seriesColors.success} />, text: 'You outperform 85% of users' },
    { icon: <Flame size={14} color={seriesColors.warning} />, text: 'Keep your 5-vault streak going' },
    { icon: <CheckCircle size={14} color={seriesColors.success} />, text: 'Best month was June (92%)' },
  ]

  return (
    <div className="analytics-section analytics-section--tight">
      <SectionTitle>Goal Setting &amp; Tracking</SectionTitle>
      <Card>
        <div className="goals-header">
          <Flag size={17} color="var(--accent)" />
          <span className="goals-title">Set your targets for this period</span>
        </div>
        <div className="bench-grid bench-grid--goals">
          {/* Success Rate Goal */}
          <div>
            <label className="goal-label">Target Success Rate (%)</label>
            <input
              type="number"
              value={goalRate}
              min={0}
              max={100}
              aria-label="Target success rate"
              aria-invalid={rateGoal.error ? true : undefined}
              aria-describedby="goal-rate-status"
              onChange={(e) => onGoalRateChange(e.target.value)}
            />
            <div className="goal-progress">
              <div className="goal-head">
                <span className="goal-current">
                  Current: {formatPercentage(kpis.averageSuccessRate)}
                </span>
                <span className={rateGoalMet ? 'an-text-success' : 'an-text-comparison'}>
                  Goal: {rateGoal.value !== null ? `${rateGoal.value}%` : '—'}
                </span>
              </div>
              <div className="progress-track progress-track--goal">
                <div
                  className="disciplr-progress-bar progress-bar an-bg-success"
                  data-testid="goal-rate-progress"
                  style={{ width: `${safePercent(kpis.averageSuccessRate, 100)}%` }}
                />
                {rateGoal.value !== null && (
                  <div
                    data-testid="goal-rate-marker"
                    className="goal-marker an-bg-comparison"
                    style={{ left: `${safePercent(rateGoal.value, 100)}%` }}
                  />
                )}
              </div>
              <div
                className={`goal-hint ${
                  kpis.averageSuccessRate >= Number(goalRate) ? 'an-text-success' : 'an-text-muted'
                }`}
              >
                {kpis.averageSuccessRate >= (rateGoal.value ?? 90)
                  ? '✓ Goal achieved!'
                  : `${((rateGoal.value ?? 90) - kpis.averageSuccessRate).toFixed(1)}% to go`}
              </div>
            </div>
          </div>

          {/* Capital Goal */}
          <div>
            <label className="goal-label">Target Capital Locked (USDC)</label>
            <input
              type="number"
              value={goalCapital}
              min={0}
              aria-label="Target capital locked"
              aria-invalid={capitalGoal.error ? true : undefined}
              aria-describedby="goal-capital-status"
              onChange={(e) => onGoalCapitalChange(e.target.value)}
            />
            <div className="goal-progress">
              <div className="goal-head">
                <span className="goal-current">Current: {formatCurrency(kpis.totalCapital)}</span>
                <span className={capitalGoalMet ? 'an-text-success' : 'an-text-comparison'}>
                  Goal: {capitalGoal.value !== null ? `$${formatUsdc(capitalGoal.value)}` : '—'}
                </span>
              </div>
              <div className="progress-track progress-track--goal">
                <div
                  className="disciplr-progress-bar progress-bar an-bg-success"
                  style={{
                    width: `${Math.min(
                      (kpis.totalCapital / Math.max(capitalGoal.value ?? 5000, kpis.totalCapital)) * 100,
                      100,
                    )}%`,
                  }}
                />
                <div
                  className="goal-marker an-bg-comparison"
                  style={{
                    left: `${Math.min(
                      ((capitalGoal.value ?? 5000) / Math.max(capitalGoal.value ?? 5000, kpis.totalCapital)) * 100,
                      100,
                    )}%`,
                  }}
                />
              </div>
              <div
                className={`goal-hint ${
                  kpis.totalCapital >= Number(goalCapital) ? 'an-text-success' : 'an-text-muted'
                }`}
              >
                {kpis.totalCapital >= (capitalGoal.value ?? 5000)
                  ? '✓ Goal achieved!'
                  : `$${formatUsdc((capitalGoal.value ?? 5000) - kpis.totalCapital)} to go`}
              </div>
            </div>
          </div>

          {/* Score tip */}
          <div className="quick-insights">
            <div className="quick-insights-title">Quick Insights</div>
            {quickTips.map((tip, i) => (
              <div key={i} className="quick-tip">
                {tip.icon} {tip.text}
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  )
}
