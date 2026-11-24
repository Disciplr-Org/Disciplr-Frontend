import type { VaultActivityRecord } from '../services/vaultService'
import type { Vault } from '../types/vault'
import type { AnalyticsDataPoint } from '../utils/analyticsKpis'
import type { Period } from './analyticsData'

interface DateBucket {
  name: string
  start: Date
  end: Date
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function startOfDay(date: Date): Date {
  const result = new Date(date)
  result.setHours(0, 0, 0, 0)
  return result
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

function firstOfMonth(date: Date, offset = 0): Date {
  return new Date(date.getFullYear(), date.getMonth() + offset, 1)
}

function parseDate(value: string | Date | undefined): Date | null {
  if (!value) return null
  const date = value instanceof Date ? new Date(value) : new Date(value)
  return Number.isFinite(date.getTime()) ? date : null
}

function makeMonthBuckets(start: Date, count: number, includeYear = false): DateBucket[] {
  return Array.from({ length: count }, (_, index) => {
    const bucketStart = firstOfMonth(start, index)
    const nextMonth = firstOfMonth(start, index + 1)
    const name = MONTH_NAMES[bucketStart.getMonth()]
    return {
      name: includeYear ? `${name} ${bucketStart.getFullYear()}` : name,
      start: bucketStart,
      end: nextMonth,
    }
  })
}

function throughToday(buckets: DateBucket[], now: Date): DateBucket[] {
  const endOfToday = addDays(startOfDay(now), 1)
  return buckets.map((bucket, index) => (
    index === buckets.length - 1 && bucket.end > endOfToday
      ? { ...bucket, end: endOfToday }
      : bucket
  ))
}

function getRelevantDates(vaults: Vault[], activity: VaultActivityRecord[]): Date[] {
  return [
    ...vaults.map((vault) => parseDate(vault.createdAt)),
    ...activity.map((event) => parseDate(event.timestamp)),
  ].filter((date): date is Date => date !== null)
}

function getBuckets(vaults: Vault[], activity: VaultActivityRecord[], period: Period, now: Date): DateBucket[] {
  if (period === '7d') {
    const firstDay = addDays(startOfDay(now), -6)
    return Array.from({ length: 7 }, (_, index) => {
      const start = addDays(firstDay, index)
      return {
        name: start.toLocaleDateString('en-US', { weekday: 'short' }),
        start,
        end: addDays(start, 1),
      }
    })
  }

  if (period === '30d') {
    const firstDay = addDays(startOfDay(now), -29)
    return Array.from({ length: 4 }, (_, index) => {
      const startOffset = Math.floor((index * 30) / 4)
      const endOffset = Math.floor(((index + 1) * 30) / 4)
      return {
        name: `Wk${index + 1}`,
        start: addDays(firstDay, startOffset),
        end: addDays(firstDay, endOffset),
      }
    })
  }

  if (period === '90d') return throughToday(makeMonthBuckets(firstOfMonth(now, -2), 3), now)
  if (period === '1y') return throughToday(makeMonthBuckets(firstOfMonth(now, -11), 12), now)

  const dates = getRelevantDates(vaults, activity)
  if (dates.length === 0) return []
  const firstYear = Math.min(...dates.map((date) => date.getFullYear()))
  const currentYear = now.getFullYear()
  return throughToday(
    makeMonthBuckets(new Date(firstYear, 0, 1), Math.max(0, currentYear - firstYear + 1), true),
    now,
  )
}

function latestDate(dates: (string | Date | undefined)[]): Date | null {
  return dates
    .map(parseDate)
    .filter((date): date is Date => date !== null)
    .sort((a, b) => b.getTime() - a.getTime())[0] ?? null
}

function addValue(
  target: number[],
  buckets: DateBucket[],
  timestamp: Date | null,
  value: number,
): void {
  if (!timestamp || !Number.isFinite(value)) return
  const index = buckets.findIndex((bucket) => timestamp >= bucket.start && timestamp < bucket.end)
  if (index >= 0) target[index] += value
}

function buildSeries(vaults: Vault[], activity: VaultActivityRecord[], buckets: DateBucket[]): AnalyticsDataPoint[] {
  const capital = buckets.map(() => 0)
  const milestones = buckets.map(() => 0)
  const outcomes = buckets.map(() => ({ completed: 0, failed: 0 }))
  const activityByVaultId = new Map<string, VaultActivityRecord[]>()
  const activityByVaultName = new Map<string, VaultActivityRecord[]>()

  for (const event of activity) {
    const records = event.vaultId
      ? activityByVaultId.get(event.vaultId) ?? []
      : activityByVaultName.get(event.vault) ?? []
    records.push(event)
    if (event.vaultId) activityByVaultId.set(event.vaultId, records)
    else activityByVaultName.set(event.vault, records)
  }

  for (const vault of vaults) {
    addValue(capital, buckets, parseDate(vault.createdAt), vault.amount)

    const events = activityByVaultId.get(vault.id) ?? activityByVaultName.get(vault.name) ?? []
    const validationEvents = events.filter((event) => event.type === 'validate' && event.status === 'confirmed')
    if (validationEvents.length > 0) {
      for (const event of validationEvents) addValue(milestones, buckets, parseDate(event.timestamp), 1)
    } else {
      const validationTransactions = (vault.transactions ?? []).filter((transaction) => transaction.type === 'validate')
      if (validationTransactions.length > 0) {
        for (const transaction of validationTransactions) addValue(milestones, buckets, parseDate(transaction.timestamp), 1)
      } else {
        for (const milestone of vault.milestones ?? []) {
          if (milestone.status === 'validated' && milestone.validatedAt) {
            addValue(milestones, buckets, parseDate(milestone.validatedAt), 1)
          }
        }
      }
    }

    if (vault.status !== 'completed' && vault.status !== 'failed') continue
    const expectedType = vault.status === 'completed' ? 'release' : 'redirect'
    const activityOutcome = events
      .filter((event) => event.type === expectedType)
      .map((event) => event.timestamp)
    const transactionOutcome = (vault.transactions ?? [])
      .filter((transaction) => transaction.type === expectedType)
      .map((transaction) => transaction.timestamp)
    const outcomeAt = latestDate([...activityOutcome, ...transactionOutcome])
      ?? (vault.status === 'completed'
        ? latestDate((vault.milestones ?? []).map((milestone) => milestone.validatedAt))
        : null)
      ?? parseDate(vault.createdAt)
    const bucketIndex = outcomeAt
      ? buckets.findIndex((bucket) => outcomeAt >= bucket.start && outcomeAt < bucket.end)
      : -1
    if (bucketIndex >= 0) outcomes[bucketIndex][vault.status] += 1
  }

  return buckets.map((bucket, index) => {
    const totalOutcomes = outcomes[index].completed + outcomes[index].failed
    const success = totalOutcomes === 0
      ? 0
      : Math.round((outcomes[index].completed / totalOutcomes) * 100)
    return {
      name: bucket.name,
      success,
      failed: totalOutcomes === 0 ? 0 : 100 - success,
      capital: capital[index],
      milestones: milestones[index],
    }
  })
}

/**
 * Build daily, weekly, monthly or yearly analytics buckets from vault records.
 * The supplied `now` keeps date-window behavior deterministic in tests.
 */
export function buildAnalyticsSeries(
  vaults: Vault[],
  activity: VaultActivityRecord[],
  period: Period,
  now: Date,
): AnalyticsDataPoint[] {
  return buildSeries(vaults, activity, getBuckets(vaults, activity, period, now))
}

/** Build the immediately preceding window using the same bucket rules. */
export function buildPreviousAnalyticsSeries(
  vaults: Vault[],
  activity: VaultActivityRecord[],
  period: Period,
  now: Date,
): AnalyticsDataPoint[] {
  if (period === 'All') {
    const currentBuckets = getBuckets(vaults, activity, period, now)
    if (currentBuckets.length === 0) return []
    const firstCurrentYear = currentBuckets[0].start.getFullYear()
    const years = currentBuckets.length
    const previousBuckets = makeMonthBuckets(new Date(firstCurrentYear - years, 0, 1), years, true)
    return buildSeries(vaults, activity, previousBuckets)
  }

  const previousNow = new Date(now)
  if (period === '7d') previousNow.setDate(previousNow.getDate() - 7)
  else if (period === '30d') previousNow.setDate(previousNow.getDate() - 30)
  else if (period === '90d') previousNow.setMonth(previousNow.getMonth() - 3)
  else previousNow.setFullYear(previousNow.getFullYear() - 1)
  return buildAnalyticsSeries(vaults, activity, period, previousNow)
}

/** Build monthly buckets for a validated inclusive custom date range. */
export function buildAnalyticsSeriesForRange(
  vaults: Vault[],
  activity: VaultActivityRecord[],
  from: Date,
  to: Date,
): AnalyticsDataPoint[] {
  const firstMonth = firstOfMonth(from)
  const monthCount = (to.getFullYear() - firstMonth.getFullYear()) * 12 + to.getMonth() - firstMonth.getMonth() + 1
  const includesMultipleYears = monthCount > 12
  const buckets = makeMonthBuckets(firstMonth, monthCount, includesMultipleYears).map((bucket) => ({
    ...bucket,
    start: bucket.start < from ? from : bucket.start,
    end: bucket.end > addDays(startOfDay(to), 1) ? addDays(startOfDay(to), 1) : bucket.end,
  }))
  return buildSeries(vaults, activity, buckets)
}

/** Compare a custom range with the same calendar range one year earlier. */
export function buildPreviousAnalyticsSeriesForRange(
  vaults: Vault[],
  activity: VaultActivityRecord[],
  from: Date,
  to: Date,
): AnalyticsDataPoint[] {
  const shiftYear = (date: Date) => {
    const shifted = new Date(date)
    const month = shifted.getMonth()
    shifted.setDate(1)
    shifted.setFullYear(shifted.getFullYear() - 1)
    shifted.setMonth(month)
    const day = Math.min(date.getDate(), new Date(shifted.getFullYear(), month + 1, 0).getDate())
    shifted.setDate(day)
    return shifted
  }
  return buildAnalyticsSeriesForRange(vaults, activity, shiftYear(from), shiftYear(to))
}

export function buildVaultStatusData(vaults: Vault[]): { name: string; value: number }[] {
  if (vaults.length === 0) return []
  const counts = {
    Completed: 0,
    Active: 0,
    Failed: 0,
    Cancelled: 0,
  }
  for (const vault of vaults) {
    if (vault.status === 'completed') counts.Completed += 1
    else if (vault.status === 'failed') counts.Failed += 1
    else if (vault.status === 'cancelled') counts.Cancelled += 1
    else counts.Active += 1
  }
  return Object.entries(counts).map(([name, value]) => ({ name, value }))
}

export function hasAnalyticsValues(series: AnalyticsDataPoint[]): boolean {
  return series.some((point) => point.success > 0 || point.failed > 0 || point.capital > 0 || point.milestones > 0)
}
