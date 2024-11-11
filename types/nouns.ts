import { type Address } from 'viem'

export interface Proposal {
  id: bigint
  proposer: Address
  eta: bigint
  startBlock: bigint
  endBlock: bigint
  forVotes: bigint
  againstVotes: bigint
  abstainVotes: bigint
  canceled: boolean
  executed: boolean
}

export interface VoteReceipt {
  hasVoted: boolean
  support: number
  votes: bigint
}

export interface ProposalActions {
  targets: Address[]
  values: bigint[]
  signatures: string[]
  calldatas: string[]
} 