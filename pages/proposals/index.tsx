import { useState } from 'react'
import { useProposalCount } from '../../hooks/useProposalCount'
import { useBatchAnalysis } from '../../hooks/useBatchAnalysis'
import { AnalysisTable } from '../../components/parser/AnalysisTable'
import { FilterBar } from '../../components/parser/FilterBar'
import { ExportControls } from '../../components/parser/ExportControls'
import type { ParsedAnalysis } from '../../types/parser'
import type { FilterState } from '../../components/parser/FilterBar'
import styles from './proposals.module.css'

/**
 * Main page for viewing and managing proposal analyses
 */
export default function ProposalsPage() {
  const [selectedRows, setSelectedRows] = useState<string[]>([])
  const { data: proposalCount } = useProposalCount()
  const { 
    data: analysisResults,
    isLoading,
    error,
    progress
  } = useBatchAnalysis()

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
    <div className={styles.container}>
      <div className={styles.content}>
        {/* Header */}
        <div className={styles.header}>
          <h1 className={styles.title}>
            Proposal Analysis
          </h1>
          <p className={styles.subtitle}>
            {proposalCount?.toString() || '0'} total proposals
            {isLoading && ` (Analyzing: ${progress}%)`}
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
          progress={progress}
        />

        {/* Analysis Table */}
        <AnalysisTable
          data={analysisResults?.map(r => r.analysis) as ParsedAnalysis[] || []}
          onSelect={setSelectedRows}
          loading={isLoading}
          error={error as Error}
        />
      </div>
    </div>
  )
}
