import { useState } from 'react'
import type { Classification, RiskLevel } from '../../types/parser'

export interface FilterState {
  classification?: Classification[]
  risk_level?: RiskLevel
  date_range?: [Date, Date] | null
  search?: string
}

interface FilterValue {
  classification?: Classification[]
  risk_level?: RiskLevel
  date_range?: [Date, Date] | null
  search?: string
}

interface FilterBarProps {
  onChange: (filters: FilterState) => void
  onClear: () => void
}

/**
 * Component for filtering analysis data
 * Supports classification, risk level, date range, and text search filters
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

  const handleFilterChange = (key: keyof FilterState, value: FilterValue[keyof FilterValue]) => {
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
    <div className="bg-white p-4 border border-gray-200 rounded-lg space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Filters</h3>
        <button
          onClick={handleClearFilters}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Clear all
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Classification Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Classification
          </label>
          <select
            multiple
            value={filters.classification || []}
            onChange={(e) => {
              const values = Array.from(e.target.selectedOptions, option => option.value as Classification)
              handleFilterChange('classification', values)
            }}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            {classifications.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Risk Level Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Risk Level
          </label>
          <select
            value={filters.risk_level || ''}
            onChange={(e) => handleFilterChange('risk_level', e.target.value || undefined)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            <option value="">All</option>
            {riskLevels.map(level => (
              <option key={level} value={level}>{level}</option>
            ))}
          </select>
        </div>

        {/* Date Range Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date Range
          </label>
          <div className="flex space-x-2">
            <input
              type="date"
              value={filters.date_range?.[0]?.toISOString().split('T')[0] || ''}
              onChange={(e) => {
                const start = e.target.value ? new Date(e.target.value) : null
                const end = filters.date_range?.[1] || null
                handleFilterChange('date_range', start && end ? [start, end] : null)
              }}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
            <input
              type="date"
              value={filters.date_range?.[1]?.toISOString().split('T')[0] || ''}
              onChange={(e) => {
                const start = filters.date_range?.[0] || null
                const end = e.target.value ? new Date(e.target.value) : null
                handleFilterChange('date_range', start && end ? [start, end] : null)
              }}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
        </div>

        {/* Search Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Search
          </label>
          <input
            type="text"
            value={filters.search || ''}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            placeholder="Search proposals..."
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>
      </div>
    </div>
  )
} 