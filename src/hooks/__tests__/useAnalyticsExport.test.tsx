import { describe, expect, it, vi, beforeEach } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { ANALYTICS_EXPORT_ERROR, useAnalyticsExport } from '../useAnalyticsExport'
import { downloadCsv, toCsv } from '../../utils/csv'
import type { KpiMetrics } from '../../utils/analyticsKpis'

const { jsPDFImport, jsPDFCtor, pdfDoc } = vi.hoisted(() => {
  const doc = {
    setFillColor: vi.fn(),
    rect: vi.fn(),
    setTextColor: vi.fn(),
    setFontSize: vi.fn(),
    setFont: vi.fn(),
    text: vi.fn(),
    setDrawColor: vi.fn(),
    setLineWidth: vi.fn(),
    line: vi.fn(),
    save: vi.fn(),
  }
  const ctor = vi.fn(() => doc)
  const factory = vi.fn(() => ({ default: ctor }))
  return { jsPDFImport: factory, jsPDFCtor: ctor, pdfDoc: doc }
})

vi.mock('jspdf', jsPDFImport)

vi.mock('../../utils/csv', () => ({
  toCsv: vi.fn(() => 'csv-output'),
  downloadCsv: vi.fn(),
}))

const rows = [
  { name: 'Wk1', success: 65, failed: 35, capital: 800, milestones: 3 },
  { name: 'Wk2', success: 70, failed: 30, capital: 1200, milestones: 5 },
]

const kpis: KpiMetrics = {
  totalCapital: 2000,
  prevTotalCapital: 1500,
  averageSuccessRate: 67.5,
  prevAverageSuccessRate: 60,
  totalMilestones: 8,
  prevTotalMilestones: 6,
  capitalDelta: 500,
  successDelta: 7.5,
  milestoneDelta: 2,
  capitalTrend: true,
  successTrend: true,
  milestoneTrend: true,
}

function options(overrides: Partial<Parameters<typeof useAnalyticsExport>[0]> = {}) {
  return {
    rows,
    kpis,
    period: '30d',
    customRangeActive: false,
    customFrom: '',
    customTo: '',
    ...overrides,
  }
}

beforeEach(() => {
  jsPDFImport.mockClear()
  jsPDFCtor.mockClear()
  vi.mocked(toCsv).mockClear()
  vi.mocked(downloadCsv).mockClear()
})

describe('useAnalyticsExport', () => {
  it('does not import jspdf until exportPdf() is invoked', async () => {
    const { result } = renderHook(() => useAnalyticsExport(options()))

    expect(jsPDFImport).toHaveBeenCalledTimes(0)

    await act(async () => {
      await result.current.exportPdf()
    })

    expect(jsPDFImport).toHaveBeenCalledTimes(1)
    expect(jsPDFCtor).toHaveBeenCalledTimes(1)
    expect(pdfDoc.save).toHaveBeenCalledWith('disciplr-report-30d.pdf')
    expect(result.current.exportError).toBeNull()
  })

  it('passes the analytics rows through toCsv(rows, "analytics")', () => {
    const { result } = renderHook(() =>
      useAnalyticsExport(options({ customRangeActive: true, customFrom: '2025-03-01', customTo: '2025-05-31' })),
    )

    act(() => {
      result.current.exportCsv()
    })

    expect(toCsv).toHaveBeenCalledWith(rows, 'analytics')
    expect(downloadCsv).toHaveBeenCalledWith(
      'csv-output',
      'disciplr-analytics-2025-03-01-to-2025-05-31.csv',
    )
  })

  it('surfaces an error message instead of throwing when the import fails', async () => {
    vi.resetModules()
    vi.doMock('jspdf', () => {
      throw new Error('chunk load failed')
    })
    vi.doMock('../../utils/csv', () => ({ toCsv: vi.fn(), downloadCsv: vi.fn() }))

    const mod = await import('../useAnalyticsExport')
    const { result } = renderHook(() => mod.useAnalyticsExport(options()))

    await act(async () => {
      await expect(result.current.exportPdf()).resolves.toBeUndefined()
    })

    expect(result.current.exportError).toBe(mod.ANALYTICS_EXPORT_ERROR)
    expect(result.current.exportError).toBe(ANALYTICS_EXPORT_ERROR)
    expect(result.current.isExportLoading).toBe(false)
  })
})
