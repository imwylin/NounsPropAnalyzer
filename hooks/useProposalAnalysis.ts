import { useEffect, useState } from 'react'
import { useProposalBatch } from './useProposalBatch'
import type { ParsedAnalysis } from '../types/parser'
import type { Proposal, ProposalActions } from '../types/nouns'

export interface ProposalWithAnalysis {
  proposal: Proposal & { actions: ProposalActions }
  analysis: ParsedAnalysis | null
}

interface UseProposalAnalysisProps {
  proposalId: number
  enabled?: boolean
}

/**
 * Hook to fetch and analyze a proposal for 501c3 compliance
 */
export function useProposalAnalysis({
  proposalId,
  enabled = true
}: UseProposalAnalysisProps) {
  const [analysis, setAnalysis] = useState<ParsedAnalysis | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  // Fetch on-chain proposal data
  const {
    data: proposals,
    isLoading: isLoadingProposal,
    isError,
    error
  } = useProposalBatch({
    startId: proposalId,
    batchSize: 1,
    enabled
  })

  // Trigger analysis when proposal data is available
  useEffect(() => {
    if (!proposals?.[0] || !enabled || analysis) return

    const analyzeProposal = async () => {
      setIsAnalyzing(true)
      try {
        // Request analysis from API
        const response = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            proposalId,
            proposal: proposals[0]
          })
        })

        if (!response.ok) {
          throw new Error('Analysis request failed')
        }

        const result = await response.json()
        setAnalysis(result)
      } catch (err) {
        console.error('Failed to analyze proposal:', err)
        setAnalysis(null)
      } finally {
        setIsAnalyzing(false)
      }
    }

    analyzeProposal()
  }, [proposalId, proposals, enabled, analysis])

  return {
    data: proposals?.[0] ? {
      proposal: proposals[0],
      analysis
    } : undefined,
    isLoading: isLoadingProposal || isAnalyzing,
    isError,
    error
  }
} 