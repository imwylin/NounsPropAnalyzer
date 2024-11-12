export const GET_PROPOSALS = `
  query GetProposals($first: Int = 100, $skip: Int = 0) {
    proposals(
      first: $first
      skip: $skip
      orderBy: createdTimestamp
      orderDirection: desc
    ) {
      id
      title
      description
      status
      createdTimestamp
      startBlock
      endBlock
      forVotes
      againstVotes
      abstainVotes
      quorumVotes
      proposalThreshold
      totalSupply
      executionETA
      clientId
      votes {
        id
        voter
        support
        votes
        blockNumber
        timestamp
      }
    }
  }
`

export const GET_PROPOSAL = `
  query GetProposal($id: ID!) {
    proposal(id: $id) {
      id
      title
      description
      status
      createdTimestamp
      startBlock
      endBlock
      forVotes
      againstVotes
      abstainVotes
      quorumVotes
      proposalThreshold
      totalSupply
      executionETA
      clientId
      votes(orderBy: votes, orderDirection: desc) {
        id
        voter
        support
        votes
        blockNumber
        timestamp
      }
    }
  }
`

export const GET_PROPOSAL_DESCRIPTION = `
  query GetProposalDescription($id: ID!) {
    proposal(id: $id) {
      description
    }
  }
`

// Add a type for the response
export interface ProposalDescriptionResponse {
  proposal: {
    description: string
  }
} 