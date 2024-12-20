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

export type Classification = 'CHARITABLE' | 'OPERATIONAL' | 'MARKETING' | 'PROGRAM_RELATED' | 'UNALLOWABLE'
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH'
export type MissionAlignment = 'STRONG' | 'MODERATE' | 'WEAK'

export interface RiskAssessment {
  private_benefit_risk: RiskLevel
  mission_alignment: MissionAlignment
  implementation_complexity: RiskLevel
}

export interface ClaudeConfidenceMetadata {
  response_confidence?: number
  rubric_scores?: {
    classification: number
    risk_assessment: number
    modifications: number
    elements: number
  }
  grading_response?: string
}

export interface AIAnalysisResult {
  classification: Classification
  primary_purpose: string
  allowable_elements: string[]
  unallowable_elements: string[]
  required_modifications: string[]
  risk_assessment: RiskAssessment
  key_considerations: string[]
  needs_human_review: boolean
  rawResponse?: string
  validationWarnings?: ValidationError[]
  reviewReasons?: string[]
  native_confidence?: ClaudeConfidenceMetadata
}

export interface ValidationError {
  rule: string
  message: string
  severity: 'WARNING' | 'ERROR'
}

export interface ErrorResponse {
  field: string
  message: string
  received?: string
  expected?: string[]
} 