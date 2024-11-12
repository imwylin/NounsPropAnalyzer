import { useState } from 'react'
import type { Classification, RiskLevel } from '../../types/parser'
import styles from './FilterBar.module.css'

export interface FilterState {
  classification?: Classification[]
  risk_level?: RiskLevel
  date_range?: [Date, Date] | null
}

interface FilterBarProps {
  onChange: (filters: FilterState) => void
  onClear: () => void
}

type FilterValue = string | string[] | [Date, Date] | null | undefined;

/**
 * Component for filtering analysis data
 * Supports classification, risk level, and date range filters
 */
export function FilterBar({ onChange, onClear }: FilterBarProps) {
  const [filters, setFilters] = useState<FilterState>({})

  // Classification options
  const classifications: Classification[] = [
    'CHARITABLE',
    'OPERATIONAL',
    'MARKETING',
    'PROGRAM_RELATED',
    'UNALLOWABLE'
  ]

  // Risk level options
  const riskLevels: RiskLevel[] = ['LOW', 'MEDIUM', 'HIGH']

  const handleFilterChange = (key: keyof FilterState, value: FilterValue) => {
    const newFilters = { ...filters, [key]: value }
    if (value === '' || value === null) {
      delete newFilters[key]
    }
    setFilters(newFilters)
    onChange(newFilters)
  }

  const handleClearFilters = () => {
    setFilters({})
    onClear()
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>Filters</h3>
        <button
          onClick={handleClearFilters}
          className={styles.clearButton}
        >
          Clear all
        </button>
      </div>

      <div className={styles.filterGrid}>
        {/* Classification Filter */}
        <div className={styles.filterGroup}>
          <label className={styles.label}>
            Classification
          </label>
          <select
            multiple
            value={filters.classification || []}
            onChange={(e) => {
              const values = Array.from(e.target.selectedOptions, option => option.value as Classification)
              handleFilterChange('classification', values)
            }}
            className={styles.select}
          >
            {classifications.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Risk Level Filter */}
        <div className={styles.filterGroup}>
          <label className={styles.label}>
            Risk Level
          </label>
          <select
            value={filters.risk_level || ''}
            onChange={(e) => handleFilterChange('risk_level', e.target.value || undefined)}
            className={styles.select}
          >
            <option value="">All</option>
            {riskLevels.map(level => (
              <option key={level} value={level}>{level}</option>
            ))}
          </select>
        </div>

        {/* Date Range Filter */}
        <div className={styles.filterGroup}>
          <label className={styles.label}>
            Date Range
          </label>
          <div className={styles.dateRange}>
            <input
              type="date"
              value={filters.date_range?.[0]?.toISOString().split('T')[0] || ''}
              onChange={(e) => {
                const start = e.target.value ? new Date(e.target.value) : null
                const end = filters.date_range?.[1] || null
                handleFilterChange('date_range', start && end ? [start, end] : null)
              }}
              className={styles.input}
            />
            <input
              type="date"
              value={filters.date_range?.[1]?.toISOString().split('T')[0] || ''}
              onChange={(e) => {
                const start = filters.date_range?.[0] || null
                const end = e.target.value ? new Date(e.target.value) : null
                handleFilterChange('date_range', start && end ? [start, end] : null)
              }}
              className={styles.input}
            />
          </div>
        </div>
      </div>
    </div>
  )
} 