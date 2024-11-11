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
  
  // Automatically analyze all proposals
  const { 
    data: analysisResults,
    isLoading,
    error,
    progress
  } = useBatchAnalysis()

  // Filter the analysis results
  const [activeFilters, setActiveFilters] = useState<FilterState>({})

  const filteredResults = analysisResults?.filter(result => {
    if (!result?.analysis) return false

    // Apply classification filter
    if (activeFilters.classification?.length) {
      if (!activeFilters.classification.includes(result.analysis.classification)) {
        return false
      }
    }

    // Apply risk level filter
    if (activeFilters.risk_level) {
      if (result.analysis.risk_assessment.private_benefit_risk !== activeFilters.risk_level) {
        return false
      }
    }

    // Apply date range filter
    if (activeFilters.date_range && result.proposal.startBlock) {
      const proposalDate = new Date(Number(result.proposal.startBlock) * 1000) // Convert block timestamp to date
      const [start, end] = activeFilters.date_range
      if (proposalDate < start || proposalDate > end) {
        return false
      }
    }

    return true
  })

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
          onChange={setActiveFilters}
          onClear={() => setActiveFilters({})}
        />

        {/* Export Controls */}
        <ExportControls
          onExport={handleExport}
          disabled={selectedRows.length === 0}
          progress={progress}
        />

        {/* Analysis Table */}
        <AnalysisTable
          data={filteredResults?.map(r => r.analysis) as ParsedAnalysis[] || []}
          onSelect={setSelectedRows}
          loading={isLoading}
          error={error as Error}
        />
      </div>
    </div>
  )
}
