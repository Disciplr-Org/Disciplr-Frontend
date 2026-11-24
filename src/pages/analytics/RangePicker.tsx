import type { Period } from '../../utils/periodParam'

const PERIODS: Period[] = ['7d', '30d', '90d', '1y', 'All']

export type RangePickerProps = {
  period: Period
  customFrom: string
  customTo: string
  customRangeActive: boolean
  dateRangeError: string | null
  showComparison: boolean
  showMovingAverage: boolean
  movingAverageWindow: number
  onPeriodSelect: (period: Period) => void
  onFromChange: (value: string) => void
  onToChange: (value: string) => void
  onClearRange: () => void
  onToggleComparison: () => void
  onToggleMovingAverage: () => void
}

/**
 * Period presets, the custom date-range inputs (including their validation
 * message) and the comparison / moving-average view toggles.
 */
export function RangePicker({
  period,
  customFrom,
  customTo,
  customRangeActive,
  dateRangeError,
  showComparison,
  showMovingAverage,
  movingAverageWindow,
  onPeriodSelect,
  onFromChange,
  onToChange,
  onClearRange,
  onToggleComparison,
  onToggleMovingAverage,
}: RangePickerProps) {
  const rangeInputState = customRangeActive
    ? ' is-active'
    : dateRangeError
      ? ' is-invalid'
      : ''

  return (
    <>
      {/* Period Toggle Buttons */}
      <div className="analytics-period-group">
        {PERIODS.map((p) => (
          <button
            key={p}
            className={`period-btn${period === p && !customRangeActive ? ' active' : ''}${
              customRangeActive ? ' is-dimmed' : ''
            }`}
            onClick={() => {
              onPeriodSelect(p)
              // Clicking a preset clears the custom range
              onClearRange()
            }}
            aria-pressed={period === p && !customRangeActive}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Divider */}
      <div className="analytics-divider" />

      {/* Custom Date Range */}
      <div className="analytics-custom-range">
        <span className={`analytics-custom-label${customRangeActive ? ' is-active' : ''}`}>
          Custom:
        </span>
        <input
          type="date"
          className={`analytics-input${rangeInputState}`}
          value={customFrom}
          onChange={(e) => onFromChange(e.target.value)}
          aria-label="Custom range start date"
          aria-invalid={dateRangeError ? true : undefined}
          aria-describedby={dateRangeError ? 'custom-range-error' : undefined}
        />
        <span className="analytics-range-arrow">→</span>
        <input
          type="date"
          className={`analytics-input${rangeInputState}`}
          value={customTo}
          min={customFrom || undefined}
          onChange={(e) => onToChange(e.target.value)}
          aria-label="Custom range end date"
          aria-invalid={dateRangeError ? true : undefined}
          aria-describedby={dateRangeError ? 'custom-range-error' : undefined}
        />
        {(customFrom || customTo) && (
          <button className="action-btn analytics-clear-btn" onClick={onClearRange} aria-label="Clear custom date range">
            ✕ Clear
          </button>
        )}
        {dateRangeError && (
          <span id="custom-range-error" role="alert" className="analytics-range-error">
            {dateRangeError}
          </span>
        )}
      </div>

      {/* Divider */}
      <div className="analytics-divider" />

      {/* Compare Toggle */}
      <button
        className={`toggle-btn${showComparison ? ' active' : ''}`}
        onClick={onToggleComparison}
      >
        {showComparison ? '✓' : ''} Compare Periods
      </button>
      <button
        className={`toggle-btn${showMovingAverage ? ' active' : ''}`}
        onClick={onToggleMovingAverage}
        aria-pressed={showMovingAverage}
        title={`Toggle ${movingAverageWindow}-point moving average overlay on Success Rate chart`}
      >
        {showMovingAverage ? '✓' : ''} Moving Avg
      </button>
    </>
  )
}
