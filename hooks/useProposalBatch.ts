import { useReadContracts } from 'wagmi'
import { NOUNS_CONTRACT } from '../config/wagmi'
import type { Proposal, ProposalActions } from '../types/nouns'

interface UseProposalBatchProps {
  startId: number
  batchSize?: number
  enabled?: boolean
}

/**
 * Hook to fetch a batch of proposals and their actions
 * Optimized for concurrent loading with error handling
 */
export function useProposalBatch({
  startId,
  batchSize = 10,
  enabled = true
}: UseProposalBatchProps) {
  const batchIds = Array.from(
    { length: batchSize }, 
    (_, i) => BigInt(startId + i)
  )
  const proposalResults = useReadContracts({
    contracts: batchIds.map(id => ({
      address: NOUNS_CONTRACT.address,
      functionName: 'proposals',
      args: [id]
    })),
    query: {
      enabled: enabled && batchIds.length > 0,
      staleTime: 300_000 // 5 minutes
    }
  })
  const actionResults = useReadContracts({
    contracts: batchIds.map(id => ({
      address: NOUNS_CONTRACT.address,
      functionName: 'getActions',
      args: [id.toString()]
    })),
    query: {
      enabled: enabled && batchIds.length > 0 && !proposalResults.isError,
      staleTime: 300_000 // 5 minutes
    }
  })

  // Combine proposal data with actions
  const proposals = proposalResults.data?.map((proposal, i) => ({
    ...proposal,
    actions: actionResults.data?.[i]
  }))

  return {
    data: proposals,
    isLoading: proposalResults.isLoading || actionResults.isLoading,
    isError: proposalResults.isError || actionResults.isError,
    error: proposalResults.error || actionResults.error
  }
} 