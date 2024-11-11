import { useEffect } from 'react'
import { useProposalCount } from './useProposalCount'
import { useProposalBatch } from './useProposalBatch'
import { useProposalAnalysis } from './useProposalAnalysis'

interface UseBatchAnalysisProps {
  batchSize?: number
  enabled?: boolean
}

/**
 * Hook to fetch and analyze multiple proposals in batches
 */
export function useBatchAnalysis({
  batchSize = 10,
  enabled = true
}: UseBatchAnalysisProps = {}) {
  const { data: proposalCount } = useProposalCount()
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

  // Analyze each proposal
  const analysisResults = batchResults.flatMap(batch => 
    (batch.data || []).map(proposal => 
      useProposalAnalysis({
        proposalId: Number(proposal.id),
        enabled: enabled && !!proposal
      })
    )
  )

  // Combine results
  const isLoading = batchResults.some(batch => batch.isLoading) ||
    analysisResults.some(analysis => analysis.isLoading)

  const error = batchResults.find(batch => batch.error)?.error ||
    analysisResults.find(analysis => analysis.error)?.error

  const data = analysisResults
    .filter(result => result.data)
    .map(result => result.data!)
    .sort((a, b) => Number(b.proposal.id) - Number(a.proposal.id))

  return {
    data,
    isLoading,
    error,
    progress: isLoading ? 
      Math.round((analysisResults.filter(r => r.data).length / totalProposals) * 100) : 
      100
  }
} 