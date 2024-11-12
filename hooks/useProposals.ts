import { useReadContract } from 'wagmi'
import { nounsDAOContract } from '../config/wagmi'
import type { Proposal } from '../config/NounsDAOProxy'
import { type Address } from 'viem'
import { useState, useEffect } from 'react'
import type { ParsedAnalysis } from '../types/parser'

export interface ProposalWithAnalysis {
  proposal: Proposal
  description: string
  analysis: ParsedAnalysis | null
}

export function useProposalCount() {
  const { data, isLoading, error } = useReadContract({
    ...nounsDAOContract,
    functionName: 'proposalCount',
  })
  return { data, isLoading, error }
}

export function useProposals() {
  const { data: count } = useProposalCount()
  const [proposals, setProposals] = useState<ProposalWithAnalysis[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    if (!count) return

    const fetchAndAnalyzeProposals = async () => {
      setIsLoading(true)
      const results: ProposalWithAnalysis[] = []

      try {
        for (let i = 1; i <= Number(count); i++) {
          // Fetch proposal data
          const { data: proposal } = await useReadContract({
            ...nounsDAOContract,
            functionName: 'proposals',
            args: [BigInt(i)],
          })

          // Fetch proposal description
          const { data: description } = await useReadContract({
            ...nounsDAOContract,
            functionName: 'proposalDescriptions',
            args: [BigInt(i)],
          })

          if (!proposal || !description) continue

          // Analyze proposal
          const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              proposalId: i,
              description: description as string
            })
          })

          if (!response.ok) throw new Error(`Failed to analyze proposal ${i}`)
          const analysis = await response.json()

          results.push({
            proposal: proposal as Proposal,
            description: description as string,
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

    fetchAndAnalyzeProposals()
  }, [count])

  return {
    data: proposals,
    isLoading,
    progress: count ? Math.round((proposals.length / Number(count)) * 100) : 0
  }
} 