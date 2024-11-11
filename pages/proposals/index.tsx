import { useState } from 'react'
import { useProposalCount } from '../../hooks/useProposalCount'
import { useProposalBatch } from '../../hooks/useProposalBatch'
import { AnalysisTable } from '../../components/parser/AnalysisTable'
import { FilterBar } from '../../components/parser/FilterBar'
import { ExportControls } from '../../components/parser/ExportControls'
import type { ParsedAnalysis } from '../../types/parser'
import type { FilterState } from '../../components/parser/FilterBar'

/**
 * Main page for viewing and managing proposal analyses
 */
export default function ProposalsPage() {
  const [selectedRows, setSelectedRows] = useState<string[]>([])
  const { data: proposalCount } = useProposalCount()
  const { data: proposals, isLoading, error } = useProposalBatch({
    startId: 1,
    batchSize: 10
  })

  // Handle filter changes
  const handleFilterChange = (filters: FilterState) => {
    // TODO: Implement filtering logic
    console.log('Filters updated:', filters)
  }

  // Handle filter clear
  const handleFilterClear = () => {
    // TODO: Implement filter clear logic
    console.log('Filters cleared')
  }

  // Handle export
  const handleExport = async (format: 'csv' | 'xlsx') => {
    // TODO: Implement export logic
    console.log('Exporting as:', format)
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Proposal Analysis
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            {proposalCount?.toString() || '0'} total proposals
          </p>
        </div>

        {/* Filters */}
        <FilterBar
          onChange={handleFilterChange}
          onClear={handleFilterClear}
        />

        {/* Export Controls */}
        <ExportControls
          onExport={handleExport}
          disabled={selectedRows.length === 0}
        />

        {/* Analysis Table */}
        <AnalysisTable
          data={proposals as unknown as ParsedAnalysis[] || []}
          onSelect={setSelectedRows}
          loading={isLoading}
          error={error as Error}
        />
      </div>
    </div>
  )
}
