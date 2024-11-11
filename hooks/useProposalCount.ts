import { useReadContract } from 'wagmi'
import { NOUNS_CONTRACT } from '../config/wagmi'

/**
 * Hook to fetch the total number of proposals from the Nouns DAO contract
 */
export function useProposalCount() {
  return useReadContract({
    ...NOUNS_CONTRACT,
    functionName: 'proposalCount',
    query: {
      staleTime: 300_000 // 5 minutes
    }
  })
} 