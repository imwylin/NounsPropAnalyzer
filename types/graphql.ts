export interface Proposal {
  id: string
  proposer: string
  title: string
  description: string
  status: ProposalStatus
  createdTimestamp: string
  startBlock: string
  endBlock: string
  forVotes: string
  againstVotes: string
  abstainVotes: string
  quorumVotes: string
  proposalThreshold: string
  totalSupply: string
  votes: Vote[]
  executionETA: string | null
  clientId: number
}

export enum ProposalStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  CANCELLED = 'CANCELLED',
  VETOED = 'VETOED',
  EXECUTED = 'EXECUTED',
  QUEUED = 'QUEUED',
  EXPIRED = 'EXPIRED',
  DEFEATED = 'DEFEATED'
}

export interface Vote {
  id: string
  voter: string
  support: boolean
  votes: string
  blockNumber: string
  timestamp: string
}

export interface ProposalsQueryResponse {
  proposals: Proposal[]
}

export interface ProposalDescriptionResponse {
  proposal: {
    description: string
  }
} 