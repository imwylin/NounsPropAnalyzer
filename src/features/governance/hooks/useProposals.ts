import { useReadContracts } from 'wagmi'
import { nounsDAOContract } from '../../../config/wagmi'
import type { Proposal } from '../config/NounsDAOProxy'
import { useState, useEffect, useMemo } from 'react'
import type { ParsedAnalysis } from '../../analysis/types/parser'
import { type Abi } from 'viem'

export interface ProposalWithAnalysis {
  proposal: Proposal
  description: string
  analysis: ParsedAnalysis | null
}

export function useProposalCount() {
  const { data, isLoading, error } = useReadContracts({
    contracts: [{
      address: nounsDAOContract.address,
      abi: nounsDAOContract.abi as Abi,
      functionName: 'proposalCount'
    }],
    query: {
      enabled: true
    }
  })
  return { 
    data: data?.[0]?.result, 
    isLoading, 
    error 
  }
}

export function useProposals() {
  const { data: count } = useProposalCount()
  const [proposals, setProposals] = useState<ProposalWithAnalysis[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  // Memoize proposalIds to prevent unnecessary re-renders
  const proposalIds = useMemo(() => 
    count ? Array.from({ length: Number(count) }, (_, i) => i + 1) : []
  , [count])
  
  // Memoize contract calls to prevent unnecessary re-renders
  const contracts = useMemo(() => 
    proposalIds.flatMap(id => [
      {
        address: nounsDAOContract.address,
        abi: nounsDAOContract.abi as Abi,
        functionName: 'proposals',
        args: [BigInt(id)]
      },
      {
        address: nounsDAOContract.address,
        abi: nounsDAOContract.abi as Abi,
        functionName: 'proposalDescriptions',
        args: [BigInt(id)]
      }
    ])
  , [proposalIds])

  const { data: contractData } = useReadContracts({
    contracts,
    query: {
      enabled: proposalIds.length > 0
    }
  })

  useEffect(() => {
    if (!count || !contractData) return

    const fetchAnalysis = async () => {
      setIsLoading(true)
      const results: ProposalWithAnalysis[] = []

      try {
        for (let i = 0; i < proposalIds.length; i++) {
          const proposalData = contractData[i * 2]?.result
          const descriptionData = contractData[i * 2 + 1]?.result

          if (!proposalData || !descriptionData) continue

          // Analyze proposal
          const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              proposalId: proposalIds[i],
              description: descriptionData as string
            })
          })

          if (!response.ok) throw new Error(`Failed to analyze proposal ${proposalIds[i]}`)
          const analysis = await response.json()

          results.push({
            proposal: proposalData as Proposal,
            description: descriptionData as string,
            analysis
          })
        }

        setProposals(results)
      } catch (err) {
        console.error('Failed to fetch and analyze proposals:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAnalysis()
  }, [count, contractData, proposalIds])

  return {
    data: proposals,
    isLoading,
    progress: count ? Math.round((proposals.length / Number(count)) * 100) : 0
  }
} 