import { useState, useEffect } from 'react'
import { useProposalCount, useProposals } from '../../hooks/useProposals'
import { AnalysisTable } from '../../components/parser/AnalysisTable'
import { FilterBar } from '../../components/parser/FilterBar'
import { ExportControls } from '../../components/parser/ExportControls'
import type { ParsedAnalysis } from '../../types/parser'
import type { FilterState } from '../../components/parser/FilterBar'
import type { ProposalWithDescription } from '../../types/nouns'
import styles from './proposals.module.css'

/**
 * Main page for viewing and managing proposal analyses
 */
export default function ProposalsPage() {
  const [selectedRows, setSelectedRows] = useState<string[]>([])
  const [analyses, setAnalyses] = useState<ParsedAnalysis[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  
  // Get all proposals using wagmi
  const { data: proposalCount } = useProposalCount()
  const { data: proposals, isLoading: isLoadingProposals } = useProposals() as {
    data: ProposalWithDescription[] | undefined;
    isLoading: boolean;
  }

  // Analyze proposals when they're loaded
  useEffect(() => {
    if (!proposals || isAnalyzing) return

    const analyzeProposals = async () => {
      setIsAnalyzing(true)
      const results: ParsedAnalysis[] = []

      try {
        for (const proposal of proposals) {
          const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              proposalId: Number(proposal.id),
              description: proposal.description
            })
          })

          if (!response.ok) throw new Error('Analysis failed')
          const analysis = await response.json()
          results.push(analysis)
        }

        setAnalyses(results)
      } catch (err) {
        console.error('Analysis failed:', err)
        setError(err instanceof Error ? err : new Error('Analysis failed'))
      } finally {
        setIsAnalyzing(false)
      }
    }

    analyzeProposals()
  }, [proposals, isAnalyzing])

  // Filter the analysis results
  const [activeFilters, setActiveFilters] = useState<FilterState>({})

  const filteredResults = analyses.filter(analysis => {
    // Apply classification filter
    if (activeFilters.classification?.length) {
      if (!activeFilters.classification.includes(analysis.classification)) {
        return false
      }
    }

    // Apply risk level filter
    if (activeFilters.risk_level) {
      if (analysis.risk_assessment.private_benefit_risk !== activeFilters.risk_level) {
        return false
      }
    }

    // Apply date range filter
    if (activeFilters.date_range) {
      const [start, end] = activeFilters.date_range
      const proposalDate = new Date(analysis.id) // Assuming id contains timestamp
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

  const isLoading = isLoadingProposals || isAnalyzing

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
            {isAnalyzing && ` (Analyzing: ${Math.round((analyses.length / (proposals?.length || 1)) * 100)}%)`}
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
          progress={isAnalyzing ? Math.round((analyses.length / (proposals?.length || 1)) * 100) : 100}
        />

        {/* Analysis Table */}
        <AnalysisTable
          data={filteredResults}
          onSelect={setSelectedRows}
          loading={isLoading}
          error={error}
        />
      </div>
    </div>
  )
}
