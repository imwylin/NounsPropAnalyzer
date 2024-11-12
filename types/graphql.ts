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

export interface AIAnalysisResult {
  classification: 'CHARITABLE' | 'OPERATIONAL' | 'MARKETING' | 'PROGRAM_RELATED' | 'UNALLOWABLE'
  primary_purpose: string
  allowable_elements: string[]
  unallowable_elements: string[]
  required_modifications: string[]
  risk_assessment: {
    private_benefit_risk: 'LOW' | 'MEDIUM' | 'HIGH'
    mission_alignment: 'STRONG' | 'MODERATE' | 'WEAK'
    implementation_complexity: 'LOW' | 'MEDIUM' | 'HIGH'
  }
  key_considerations: string[]
} 