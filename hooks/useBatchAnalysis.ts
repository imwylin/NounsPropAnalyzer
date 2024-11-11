import { useEffect } from 'react'
import { useProposalCount } from './useProposalCount'
import { useProposalBatch } from './useProposalBatch'
import { useProposalAnalysis } from './useProposalAnalysis'
import type { Proposal, ProposalActions } from '../types/nouns'

// Props interface
interface UseBatchAnalysisProps {
  batchSize?: number
  enabled?: boolean
}

// Base proposal types
interface ProposalWithActions extends Proposal {
  actions: ProposalActions
}

// Analysis data types
type Classification = 'CHARITABLE' | 'OPERATIONAL' | 'MARKETING' | 'PROGRAM_RELATED' | 'UNALLOWABLE'
type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH'
type AlignmentLevel = 'STRONG' | 'MODERATE' | 'WEAK'

interface RiskAssessment {
  private_benefit_risk: RiskLevel
  mission_alignment: AlignmentLevel
  implementation_complexity: RiskLevel
}

interface AnalysisData {
  classification: Classification
  primary_purpose: string
  allowable_elements: string[]
  unallowable_elements: string[]
  required_modifications: string[]
  risk_assessment: RiskAssessment
  key_considerations: string[]
}

// Combined types
interface ProposalWithAnalysis {
  proposal: ProposalWithActions
  analysis: AnalysisData
}

// Hook result types
interface BatchResult {
  data?: ProposalWithActions[]
  isLoading: boolean
  error?: Error
}

interface AnalysisResult {
  data?: ProposalWithAnalysis
  isLoading: boolean
  error?: Error
}

interface BatchAnalysisResult {
  data: ProposalWithAnalysis[]
  isLoading: boolean
  error?: Error
  progress: number
}

/**
 * Hook to fetch and analyze multiple proposals in batches
 */
export function useBatchAnalysis({
  batchSize = 10,
  enabled = true
}: UseBatchAnalysisProps = {}): BatchAnalysisResult {
  const { data: proposalCount } = useProposalCount()
  const totalProposals = proposalCount ? Number(proposalCount) : 0

  // Calculate number of batches needed
  const batchCount = Math.ceil(totalProposals / batchSize)
  const batches = Array.from({ length: batchCount }, (_, i) => ({
    startId: i * batchSize + 1,
    size: Math.min(batchSize, totalProposals - (i * batchSize))
  }))

  // Fetch proposals in batches
  const batchResults = batches.map(batch => 
    useProposalBatch({
      startId: batch.startId,
      batchSize: batch.size,
      enabled
    }) as BatchResult
  )

  // Analyze each proposal
  const analysisResults = batchResults.flatMap(batch => {
    const proposals = batch.data
    return (proposals || []).map(proposal => 
      useProposalAnalysis({
        proposalId: Number(proposal.id),
        enabled: enabled && !!proposal
      }) as AnalysisResult
    )
  })

  // Combine results
  const isLoading = batchResults.some(batch => batch.isLoading) ||
    analysisResults.some(analysis => analysis.isLoading)

  const error = batchResults.find(batch => batch.error)?.error ||
    analysisResults.find(analysis => analysis.error)?.error

  const data = analysisResults
    .filter((result): result is AnalysisResult & { data: ProposalWithAnalysis } => 
      result.data !== undefined && result.data !== null
    )
    .map(result => result.data)
    .sort((a, b) => {
      if (!a.proposal?.id || !b.proposal?.id) return 0
      return Number(b.proposal.id) - Number(a.proposal.id)
    })

  return {
    data,
    isLoading,
    error,
    progress: isLoading ? 
      Math.round((analysisResults.filter(r => r.data).length / totalProposals) * 100) : 
      100
  }
}