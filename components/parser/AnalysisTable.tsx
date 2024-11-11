import { useMemo, useState } from 'react'
import type { ParsedAnalysis, Classification, RiskLevel } from '../../types/parser'

interface TableState {
  data: ParsedAnalysis[]
  loading: boolean
  error: string | null
  selectedRows: string[]
  sortConfig: {
    key: keyof ParsedAnalysis
    direction: 'asc' | 'desc'
  }
}

interface AnalysisTableProps {
  data: ParsedAnalysis[]
  onSelect?: (rows: string[]) => void
  onSort?: (config: TableState['sortConfig']) => void
  loading?: boolean
  error?: Error | null
}

/**
 * Table component for displaying and managing parsed analysis data
 * Implements virtual scrolling for large datasets and column management
 */
export function AnalysisTable({
  data,
  onSelect,
  onSort,
  loading = false,
  error = null
}: AnalysisTableProps) {
  // Local state management
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())
  const [sortConfig, setSortConfig] = useState<TableState['sortConfig']>({
    key: 'id',
    direction: 'desc'
  })

  // Memoized sorted data
  const sortedData = useMemo(() => {
    if (!data?.length) return []
    
    return [...data].sort((a, b) => {
      const aValue = a[sortConfig.key]
      const bValue = b[sortConfig.key]
      
      if (sortConfig.direction === 'asc') {
        return String(aValue).localeCompare(String(bValue))
      }
      return String(bValue).localeCompare(String(aValue))
    })
  }, [data, sortConfig])

  // Selection handlers
  const handleSelectAll = () => {
    const newSelected = selectedRows.size === data.length
      ? new Set<string>()
      : new Set(data.map(row => row.id))
    setSelectedRows(newSelected)
    onSelect?.(Array.from(newSelected))
  }

  const handleSelectRow = (id: string) => {
    const newSelected = new Set(selectedRows)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedRows(newSelected)
    onSelect?.(Array.from(newSelected))
  }

  // Sort handlers
  const handleSort = (key: keyof ParsedAnalysis) => {
    const newConfig = {
      key,
      direction: sortConfig.key === key && sortConfig.direction === 'asc'
        ? 'desc'
        : 'asc'
    } as const
    
    setSortConfig(newConfig)
    onSort?.(newConfig)
  }

  // Render loading state
  if (loading) {
    return (
      <div className="min-h-[200px] flex items-center justify-center">
        <p className="text-gray-500">Loading analysis data...</p>
      </div>
    )
  }

  // Render error state
  if (error) {
    return (
      <div className="min-h-[200px] flex items-center justify-center">
        <p className="text-red-500">
          {error instanceof Error ? error.message : 'Failed to load analysis data'}
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden border border-gray-200 rounded-lg">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="relative w-12 px-6 py-3">
                <input
                  type="checkbox"
                  className="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-gray-300"
                  checked={selectedRows.size === data.length}
                  onChange={handleSelectAll}
                />
              </th>
              {[
                { key: 'id', label: 'ID' },
                { key: 'classification', label: 'Classification' },
                { key: 'primary_purpose', label: 'Purpose' },
                { key: 'risk_assessment', label: 'Risk Level' }
              ].map(({ key, label }) => (
                <th
                  key={key}
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort(key as keyof ParsedAnalysis)}
                >
                  <div className="flex items-center space-x-1">
                    <span>{label}</span>
                    {sortConfig.key === key && (
                      <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedData.map(row => (
              <tr
                key={row.id}
                onClick={() => handleSelectRow(row.id)}
                className={`hover:bg-gray-50 cursor-pointer ${
                  selectedRows.has(row.id) ? 'bg-blue-50' : ''
                }`}
              >
                <td className="relative w-12 px-6 py-4">
                  <input
                    type="checkbox"
                    className="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-gray-300"
                    checked={selectedRows.has(row.id)}
                    onChange={(e) => e.stopPropagation()}
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {row.id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full font-medium
                    ${getClassificationColor(row.classification)}`}>
                    {row.classification}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 max-w-md truncate">
                  {row.primary_purpose}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full font-medium
                    ${getRiskLevelColor(row.risk_assessment.private_benefit_risk)}`}>
                    {row.risk_assessment.private_benefit_risk}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// Utility functions for styling
function getClassificationColor(classification: Classification): string {
  switch (classification) {
    case 'CHARITABLE':
      return 'bg-green-100 text-green-800'
    case 'OPERATIONAL':
      return 'bg-blue-100 text-blue-800'
    case 'MARKETING':
      return 'bg-purple-100 text-purple-800'
    case 'PROGRAM_RELATED':
      return 'bg-yellow-100 text-yellow-800'
    case 'UNALLOWABLE':
      return 'bg-red-100 text-red-800'
  }
}

function getRiskLevelColor(risk: RiskLevel): string {
  switch (risk) {
    case 'LOW':
      return 'bg-green-100 text-green-800'
    case 'MEDIUM':
      return 'bg-yellow-100 text-yellow-800'
    case 'HIGH':
      return 'bg-red-100 text-red-800'
  }
} 