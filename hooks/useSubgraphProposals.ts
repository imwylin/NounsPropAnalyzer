import { useQuery } from '@tanstack/react-query'
import { nounsClient } from '../utils/graphql/client'
import { GET_PROPOSALS, GET_PROPOSAL, GET_PROPOSAL_DESCRIPTION } from '../utils/graphql/queries'
import type { ProposalsQueryResponse, Proposal, ProposalDescriptionResponse } from '../types/graphql'

export function useProposals(first: number = 100, skip: number = 0) {
  return useQuery({
    queryKey: ['proposals', first, skip],
    queryFn: async () => {
      const data = await nounsClient.request<ProposalsQueryResponse>(
        GET_PROPOSALS,
        { first, skip }
      )
      return data.proposals
    },
  })
}

export function useProposal(id: string) {
  return useQuery({
    queryKey: ['proposal', id],
    queryFn: async () => {
      const data = await nounsClient.request<{ proposal: Proposal }>(
        GET_PROPOSAL,
        { id }
      )
      return data.proposal
    },
    enabled: !!id,
  })
}

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