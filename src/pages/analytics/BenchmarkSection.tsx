import { useMemo } from 'react'
import type { KpiMetrics } from '../../utils/analyticsKpis'
import type { AnalyticsSeriesColors } from '../analyticsTheme'
import { computeBenchmarkData } from '../analyticsData'
import { Card, SectionTitle } from './AnalyticsPrimitives'

export function BenchmarkSection({
  kpis,
  seriesColors,
}: {
  kpis: KpiMetrics
  seriesColors: AnalyticsSeriesColors
}) {
  const benchmarkData = useMemo(() => computeBenchmarkData(kpis), [kpis])

  return (
    <div className="analytics-section">
      <SectionTitle>Benchmarking — You vs Platform Average</SectionTitle>
      <Card>
        <div className="bench-grid bench-grid--benchmark">
          {benchmarkData.map((item, i) => (
            <div key={i}>
              <div className="bench-head">
                <span className="bench-metric">{item.metric}</span>
                <span
                  className={`bench-delta ${item.you >= item.platform ? 'an-text-success' : 'an-text-failed'}`}
                >
                  {item.you >= item.platform ? '↑' : '↓'} You: {item.you}
                  {item.unit}
                </span>
              </div>
              {/* Your bar */}
              <div className="bench-bar-block">
                <div className="bench-bar-label an-text-success">You</div>
                <div className="progress-track">
                  <div
                    className="disciplr-progress-bar progress-bar an-bg-success"
                    style={{
                      width: `${Math.min((item.you / (Math.max(item.you, item.platform) * 1.2)) * 100, 100)}%`,
                    }}
                  />
                </div>
              </div>
              {/* Platform bar */}
              <div>
                <div className="bench-bar-label an-text-muted">Platform avg</div>
                <div className="progress-track">
                  <div
                    className="progress-bar an-bg-muted"
                    style={{
                      width: `${Math.min((item.platform / (Math.max(item.you, item.platform) * 1.2)) * 100, 100)}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
