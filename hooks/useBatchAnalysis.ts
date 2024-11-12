import { useEffect, useState } from 'react'
import { useProposalCount } from './useProposalCount'
import { useProposalBatch } from './useProposalBatch'
import type { ProposalWithAnalysis } from './useProposalAnalysis'
import type { Proposal, ProposalActions } from '../types/nouns'
import type { ParsedAnalysis } from '../types/parser'

interface UseBatchAnalysisProps {
  batchSize?: number
  enabled?: boolean
}

interface ProposalWithActions extends Proposal {
  actions: ProposalActions
}

/**
 * Hook to fetch and analyze multiple proposals in batches
 */
export function useBatchAnalysis({
  batchSize = 10,
  enabled = true
}: UseBatchAnalysisProps = {}) {
  const { data: proposalCount } = useProposalCount()
  const [analysisResults, setAnalysisResults] = useState<ProposalWithAnalysis[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const totalProposals = proposalCount ? Number(proposalCount) : 0

  // Calculate number of batches needed
  const batchCount = Math.ceil(totalProposals / batchSize)
  const batches = Array.from({ length: batchCount }, (_, i) => ({
    startId: i * batchSize + 1,
    size: Math.min(batchSize, totalProposals - (i * batchSize))
  }))

  // Fetch proposals in batches
  const batchResults = batches.map(batch => 
    useProposalBatch({
      startId: batch.startId,
      batchSize: batch.size,
      enabled
    })
  )

  // Analyze proposals through Claude
  useEffect(() => {
    const analyzeProposals = async () => {
      if (!enabled || isAnalyzing) return
      
      setIsAnalyzing(true)
      
      try {
        // Get all available proposals
        const proposals = batchResults
          .map(batch => batch.data)
          .flat()
          .filter((p): p is ProposalWithActions => !!p)

        // Analyze each proposal
        const results = await Promise.all(
          proposals.map(async (proposal) => {
            try {
              const response = await fetch('/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  proposalId: Number(proposal.id),
                  proposal
                })
              })

              if (!response.ok) throw new Error('Analysis failed')
              
              const analysis: ParsedAnalysis = await response.json()
              return { proposal, analysis }
            } catch (err) {
              console.error(`Failed to analyze proposal ${proposal.id}:`, err)
              return { proposal, analysis: null }
            }
          })
        )

        setAnalysisResults(results)
      } catch (err) {
        console.error('Batch analysis failed:', err)
      } finally {
        setIsAnalyzing(false)
      }
    }

    analyzeProposals()
  }, [enabled, batchResults, isAnalyzing])

  const isLoading = batchResults.some(batch => batch.isLoading) || isAnalyzing
  const error = batchResults.find(batch => batch.error)?.error

  return {
    data: analysisResults,
    isLoading,
    error,
    progress: isLoading ? 
      Math.round((analysisResults.length / totalProposals) * 100) : 
      100
  }
}