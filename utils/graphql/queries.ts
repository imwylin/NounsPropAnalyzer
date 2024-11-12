export const GET_PROPOSAL_DESCRIPTION = `
  query GetProposalDescription($id: ID!) {
    proposal(id: $id) {
      description
    }
  }
`

export interface ProposalDescriptionResponse {
  proposal: {
    description: string
  }
} 