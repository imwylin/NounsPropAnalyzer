import { useState } from 'react'
import { useProposals } from '../../hooks/useProposals'
import { AnalysisTable } from '../../components/parser/AnalysisTable'
import { FilterBar } from '../../components/parser/FilterBar'
import { ExportControls } from '../../components/parser/ExportControls'
import type { FilterState } from '../../components/parser/FilterBar'
import styles from './proposals.module.css'

/**
 * Main page for viewing and managing proposal analyses
 */
export default function ProposalsPage() {
  const [selectedRows, setSelectedRows] = useState<string[]>([])
  const { data: proposals, isLoading, progress } = useProposals()

  // Filter the analysis results
  const [activeFilters, setActiveFilters] = useState<FilterState>({})

  const filteredResults = proposals?.filter(p => {
    if (!p.analysis) return false

    // Apply classification filter
    if (activeFilters.classification?.length) {
      if (!activeFilters.classification.includes(p.analysis.classification)) {
        return false
      }
    }

    // Apply risk level filter
    if (activeFilters.risk_level) {
      if (p.analysis.risk_assessment.private_benefit_risk !== activeFilters.risk_level) {
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
            {proposals?.length || 0} total proposals
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
          data={filteredResults?.map(p => p.analysis).filter((a): a is NonNullable<typeof a> => a !== null) || []}
          onSelect={setSelectedRows}
          loading={isLoading}
        />
      </div>
    </div>
  )
}
