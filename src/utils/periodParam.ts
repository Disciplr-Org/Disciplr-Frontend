export type Period = '7d' | '30d' | '90d' | '1y' | 'All'

const VALID_PERIODS: Period[] = ['7d', '30d', '90d', '1y', 'All']
const DEFAULT_PERIOD: Period = '30d'

export function parsePeriod(param: string | null): Period {
  if (!param) return DEFAULT_PERIOD
  if (VALID_PERIODS.includes(param as Period)) {
    return param as Period
  }
  return DEFAULT_PERIOD
}

export function serializePeriod(period: Period): string {
  return period
}
