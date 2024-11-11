import type { Proposal, ProposalActions } from '../../types/nouns'
import { NOUNS_CONTRACT } from '../../config/wagmi'

/**
 * Fetches proposal data from the Nouns DAO contract
 */
export async function fetchProposal(id: number): Promise<Proposal> {
  try {
    const response = await fetch(process.env.NEXT_PUBLIC_RPC_URL!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_call',
        params: [{
          to: NOUNS_CONTRACT.address,
          data: `0x013cf08b${id.toString(16).padStart(64, '0')}` // proposals(uint256)
        }, 'latest']
      })
    })

    const result = await response.json()
    if (result.error) {
      throw new Error(result.error.message)
    }

    return decodeProposal(result.result)
  } catch (err) {
    console.error('Failed to fetch proposal:', err)
    throw new Error('Failed to fetch proposal data')
  }
}

/**
 * Fetches proposal actions from the Nouns DAO contract
 */
export async function fetchProposalActions(id: number): Promise<ProposalActions> {
  try {
    const response = await fetch(process.env.NEXT_PUBLIC_RPC_URL!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_call',
        params: [{
          to: NOUNS_CONTRACT.address,
          data: `0x${id.toString(16).padStart(64, '0')}` // getActions(uint256)
        }, 'latest']
      })
    })

    const result = await response.json()
    if (result.error) {
      throw new Error(result.error.message)
    }

    return decodeActions(result.result)
  } catch (err) {
    console.error('Failed to fetch proposal actions:', err)
    throw new Error('Failed to fetch proposal actions')
  }
}

// Helper functions for decoding contract data
function decodeProposal(data: string): Proposal {
  // Implementation depends on contract ABI encoding
  throw new Error('Not implemented')
}

function decodeActions(data: string): ProposalActions {
  // Implementation depends on contract ABI encoding
  throw new Error('Not implemented')
} 