import { useMemo, useState } from 'react'
import type { ParsedAnalysis } from '../../types/parser'
import styles from './AnalysisTable.module.css'

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
 */
export function AnalysisTable({
  data,
  onSelect,
  onSort,
  loading = false,
  error = null
}: AnalysisTableProps) {
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

  if (loading) {
    return <div className={styles.loading}>Loading analysis data...</div>
  }

  if (error) {
    return (
      <div className={styles.error}>
        {error instanceof Error ? error.message : 'Failed to load analysis data'}
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead className={styles.thead}>
            <tr>
              <th scope="col" className={styles.cellCheckbox}>
                <input
                  type="checkbox"
                  className={styles.checkbox}
                  checked={selectedRows.size === data.length}
                  onChange={handleSelectAll}
                />
              </th>
              {[
                { key: 'id', label: 'ID' },
                { key: 'classification', label: 'Classification' },
                { key: 'primary_purpose', label: 'Purpose' },
                { key: 'risk_assessment', label: 'Risk Level' },
                { key: 'risk_assessment', label: 'Mission Alignment' },
                { key: 'risk_assessment', label: 'Complexity' }
              ].map(({ key, label }) => (
                <th
                  key={`${key}-${label}`}
                  scope="col"
                  className={styles.headerCell}
                  onClick={() => handleSort(key as keyof ParsedAnalysis)}
                >
                  <div className={styles.headerContent}>
                    <span>{label}</span>
                    {sortConfig.key === key && (
                      <span className={styles.sortIndicator}>
                        {sortConfig.direction === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className={styles.tbody}>
            {sortedData.map(row => (
              <tr
                key={row.id}
                onClick={() => handleSelectRow(row.id)}
                className={`${styles.row} ${selectedRows.has(row.id) ? styles.rowSelected : ''}`}
              >
                <td className={styles.cellCheckbox}>
                  <input
                    type="checkbox"
                    className={styles.checkbox}
                    checked={selectedRows.has(row.id)}
                    onChange={(e) => e.stopPropagation()}
                  />
                </td>
                <td className={styles.cell}>{row.id}</td>
                <td className={styles.cell}>
                  <span className={`${styles.badge} ${styles[row.classification.toLowerCase()]}`}>
                    {row.classification}
                  </span>
                </td>
                <td className={styles.cell}>{row.primary_purpose}</td>
                <td className={styles.cell}>
                  <span className={`${styles.badge} ${styles[`risk${row.risk_assessment.private_benefit_risk}`]}`}>
                    {row.risk_assessment.private_benefit_risk}
                  </span>
                </td>
                <td className={styles.cell}>
                  <span className={`${styles.badge} ${styles[`alignment${row.risk_assessment.mission_alignment}`]}`}>
                    {row.risk_assessment.mission_alignment}
                  </span>
                </td>
                <td className={styles.cell}>
                  <span className={`${styles.badge} ${styles[`complexity${row.risk_assessment.implementation_complexity}`]}`}>
                    {row.risk_assessment.implementation_complexity}
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