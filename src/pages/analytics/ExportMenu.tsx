import { Download } from 'lucide-react'

export type ExportMenuProps = {
  onExportCsv: () => void
  onExportPdf: () => void
  csvDisabled: boolean
  isExportLoading: boolean
  exportError: string | null
}

export function ExportMenu({
  onExportCsv,
  onExportPdf,
  csvDisabled,
  isExportLoading,
  exportError,
}: ExportMenuProps) {
  return (
    <>
      <button className="action-btn" onClick={onExportCsv} disabled={csvDisabled}>
        <Download size={14} /> CSV
      </button>
      <button className="action-btn" onClick={onExportPdf} disabled={isExportLoading}>
        <Download size={14} /> {isExportLoading ? 'Loading...' : 'PDF Report'}
      </button>
      {exportError && <div className="analytics-export-error">{exportError}</div>}
    </>
  )
}
