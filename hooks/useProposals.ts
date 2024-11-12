import { useReadContract } from 'wagmi'
import { nounsDAOContract } from '../config/wagmi'
import type { Proposal } from '../config/NounsDAOProxy'
import { type Address } from 'viem'

export interface ProposalWithDescription extends Proposal {
  description: string
}

export function useProposalCount() {
  const { data, isLoading, error } = useReadContract({
    ...nounsDAOContract,
    functionName: 'proposalCount',
  })
  return { data, isLoading, error }
}

export function useProposals() {
  const { data: count } = useProposalCount()
  
  // Get proposal metadata with proper typing
  const { data: proposal, isLoading: isLoadingProposal } = useReadContract({
    ...nounsDAOContract,
    functionName: 'proposals',
    args: count ? [BigInt(count.toString())] : undefined,
  }) as { data: Proposal | undefined, isLoading: boolean }

  // Get proposal description
  const { data: description, isLoading: isLoadingDescription } = useReadContract({
    ...nounsDAOContract,
    functionName: 'proposalDescriptions',
    args: count ? [BigInt(count.toString())] : undefined,
  }) as { data: string | undefined, isLoading: boolean }

  if (!proposal || !description) {
    return { data: undefined, isLoading: isLoadingProposal || isLoadingDescription }
  }

  const proposalData: ProposalWithDescription = {
    ...proposal,
    description
  }

  return {
    data: proposalData,
    description, // Expose description separately for analysis
    isLoading: isLoadingProposal || isLoadingDescription 
  }
} 