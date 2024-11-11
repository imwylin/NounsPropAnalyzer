import { useState } from 'react'

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

  return (
    <div className="bg-white p-4 border border-gray-200 rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium">Export Data</h3>
        {isExporting && progress > 0 && (
          <span className="text-sm text-gray-500">
            {Math.round(progress)}%
          </span>
        )}
      </div>

      <div className="flex gap-4">
        <button
          onClick={() => handleExport('csv')}
          disabled={disabled || isExporting}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors
            ${disabled || isExporting
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
            }`}
        >
          Export CSV
        </button>

        <button
          onClick={() => handleExport('xlsx')}
          disabled={disabled || isExporting}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors
            ${disabled || isExporting
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-green-50 text-green-700 hover:bg-green-100'
            }`}
        >
          Export Excel
        </button>
      </div>

      {isExporting && (
        <div className="mt-4">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {error && (
        <p className="mt-2 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  )
} 