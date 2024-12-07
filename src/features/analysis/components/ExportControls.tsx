import { useState } from 'react'
import styles from './ExportControls.module.css'

type ExportFormat = 'csv' | 'xlsx'

interface ExportControlsProps {
  onExport: (format: ExportFormat) => Promise<void>
  disabled?: boolean
  progress?: number
}

/**
 * Component for managing data export operations with progress tracking
 */
export function ExportControls({
  onExport,
  disabled = false,
  progress = 0
}: ExportControlsProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleExport = async (format: ExportFormat) => {
    if (isExporting || disabled) return

    try {
      setIsExporting(true)
      setError(null)
      await onExport(format)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed')
    } finally {
      setIsExporting(false)
    }
  }

  const buttonClass = (format: ExportFormat) => {
    const baseClass = styles.button
    const stateClass = disabled || isExporting ? styles.buttonDisabled : ''
    const formatClass = format === 'csv' ? styles.buttonCsv : styles.buttonExcel
    return `${baseClass} ${stateClass} ${formatClass}`.trim()
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>Export Data</h3>
        {isExporting && progress > 0 && (
          <span className={styles.progress}>{Math.round(progress)}%</span>
        )}
      </div>

      <div className={styles.buttons}>
        <button
          onClick={() => handleExport('csv')}
          disabled={disabled || isExporting}
          className={buttonClass('csv')}
        >
          Export CSV
        </button>

        <button
          onClick={() => handleExport('xlsx')}
          disabled={disabled || isExporting}
          className={buttonClass('xlsx')}
        >
          Export Excel
        </button>
      </div>

      {isExporting && (
        <div className={styles.progressBar}>
          <div
            className={styles.progressFill}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {error && <p className={styles.error}>{error}</p>}
    </div>
  )
}