/**
 * Contract Interface Notes:
 * 
 * READ FUNCTIONS:
 * Core Proxy:
 * - admin(): Get admin address
 * - implementation(): Get implementation address
 * - pendingAdmin(): Get pending admin
 * 
 * Governance:
 * - proposalCount(): Total proposals
 * - proposals(id): Get proposal details
 * - getActions(id): Get proposal actions
 * - getReceipt(id, voter): Get vote receipt
 * - quorumVotes(): Required votes for quorum
 * - votingPeriod(): Voting duration
 * 
 * WRITE FUNCTIONS:
 * Proposals:
 * - propose(): Create proposal
 * - queue(): Queue passed proposal
 * - execute(): Execute queued proposal
 * - cancel(): Cancel proposal
 * - veto(): Veto proposal (vetoer only)
 * 
 * Voting:
 * - castVote(): Vote on proposal
 * - castVoteWithReason(): Vote with reason
 * - castRefundableVote(): Vote with gas refund
 * - castVoteBySig(): Vote by signature 
 */

export interface Proposal {
    id: bigint;
    proposer: string;
    eta: bigint;
    startBlock: bigint;
    endBlock: bigint;
    forVotes: bigint;
    againstVotes: bigint;
    abstainVotes: bigint;
    canceled: boolean;
    executed: boolean;
  }
  
  export interface VoteReceipt {
    hasVoted: boolean;
    support: number;
    votes: bigint;
  }
  
  export interface ProposalActions {
    targets: string[];
    values: bigint[];
    signatures: string[];
    calldatas: string[];
  }

/*Contract address*/
export const NOUNS_DAO_ADDRESS = "0x6f3E6272A167e8AcCb32072d08E0957F9c79223d" as const;

export const NOUNS_DAO_ABI = [
    // Read Functions
    {
      "inputs": [],
      "name": "admin",
      "outputs": [{"internalType": "address", "name": "", "type": "address"}],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "implementation",
      "outputs": [{"internalType": "address", "name": "", "type": "address"}],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "pendingAdmin",
      "outputs": [{"internalType": "address", "name": "", "type": "address"}],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "proposalCount",
      "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
      "name": "proposals",
      "outputs": [
        {"internalType": "uint256", "name": "id", "type": "uint256"},
        {"internalType": "address", "name": "proposer", "type": "address"},
        {"internalType": "uint256", "name": "eta", "type": "uint256"},
        {"internalType": "uint256", "name": "startBlock", "type": "uint256"},
        {"internalType": "uint256", "name": "endBlock", "type": "uint256"},
        {"internalType": "uint256", "name": "forVotes", "type": "uint256"},
        {"internalType": "uint256", "name": "againstVotes", "type": "uint256"},
        {"internalType": "uint256", "name": "abstainVotes", "type": "uint256"},
        {"internalType": "bool", "name": "canceled", "type": "bool"},
        {"internalType": "bool", "name": "executed", "type": "bool"}
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [{"internalType": "uint256", "name": "proposalId", "type": "uint256"}],
      "name": "getActions",
      "outputs": [
        {"internalType": "address[]", "name": "targets", "type": "address[]"},
        {"internalType": "uint256[]", "name": "values", "type": "uint256[]"},
        {"internalType": "string[]", "name": "signatures", "type": "string[]"},
        {"internalType": "bytes[]", "name": "calldatas", "type": "bytes[]"}
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {"internalType": "uint256", "name": "proposalId", "type": "uint256"},
        {"internalType": "address", "name": "voter", "type": "address"}
      ],
      "name": "getReceipt",
      "outputs": [
        {
          "components": [
            {"internalType": "bool", "name": "hasVoted", "type": "bool"},
            {"internalType": "uint8", "name": "support", "type": "uint8"},
            {"internalType": "uint96", "name": "votes", "type": "uint96"}
          ],
          "name": "",
          "type": "tuple"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [{"internalType": "uint256", "name": "proposalId", "type": "uint256"}],
      "name": "proposalDescriptions",
      "outputs": [{"internalType": "string", "name": "", "type": "string"}],
      "stateMutability": "view",
      "type": "function"
    },
    
    // Write Functions
    {
      "inputs": [
        {"internalType": "address[]", "name": "targets", "type": "address[]"},
        {"internalType": "uint256[]", "name": "values", "type": "uint256[]"},
        {"internalType": "string[]", "name": "signatures", "type": "string[]"},
        {"internalType": "bytes[]", "name": "calldatas", "type": "bytes[]"},
        {"internalType": "string", "name": "description", "type": "string"}
      ],
      "name": "propose",
      "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [{"internalType": "uint256", "name": "proposalId", "type": "uint256"}],
      "name": "queue",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [{"internalType": "uint256", "name": "proposalId", "type": "uint256"}],
      "name": "execute",
      "outputs": [],
      "stateMutability": "payable",
      "type": "function"
    },
    {
      "inputs": [{"internalType": "uint256", "name": "proposalId", "type": "uint256"}],
      "name": "cancel",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [{"internalType": "uint256", "name": "proposalId", "type": "uint256"}],
      "name": "veto",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {"internalType": "uint256", "name": "proposalId", "type": "uint256"},
        {"internalType": "uint8", "name": "support", "type": "uint8"}
      ],
      "name": "castVote",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {"internalType": "uint256", "name": "proposalId", "type": "uint256"},
        {"internalType": "uint8", "name": "support", "type": "uint8"},
        {"internalType": "string", "name": "reason", "type": "string"}
      ],
      "name": "castVoteWithReason",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {"internalType": "uint256", "name": "proposalId", "type": "uint256"},
        {"internalType": "uint8", "name": "support", "type": "uint8"}
      ],
      "name": "castRefundableVote",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ];
