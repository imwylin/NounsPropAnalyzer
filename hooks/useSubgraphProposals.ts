import { useQuery } from '@tanstack/react-query'
import { nounsClient } from '../utils/graphql/client'
import { GET_PROPOSAL_DESCRIPTION } from '../utils/graphql/queries'
import type { ProposalDescriptionResponse } from '../types/graphql'

export function useProposalDescription(id: string) {
  return useQuery({
    queryKey: ['proposalDescription', id],
    queryFn: async () => {
      const data = await nounsClient.request<ProposalDescriptionResponse>(
        GET_PROPOSAL_DESCRIPTION,
        { id }
      )
      return data.proposal.description
    },
    enabled: !!id,
  })
} 