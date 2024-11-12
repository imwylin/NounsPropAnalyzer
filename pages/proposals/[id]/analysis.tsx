import { useRouter } from 'next/router'
import { useProposals } from '../../../hooks/useProposals'
import { ProposalAnalysisDashboard } from '../../../components/analysis/ProposalAnalysisDashboard'
import styles from '../proposals.module.css'
import { useState, useEffect } from 'react'
import type { ParsedAnalysis } from '../../../types/parser'

const DEFAULT_ANALYSIS: ParsedAnalysis = {
  id: '0',
  classification: 'OPERATIONAL',
  primary_purpose: 'Loading...',
  allowable_elements: [],
  unallowable_elements: [],
  required_modifications: [],
  risk_assessment: {
    private_benefit_risk: 'LOW',
    mission_alignment: 'MODERATE',
    implementation_complexity: 'LOW'
  },
  key_considerations: []
}

const ERROR_ANALYSIS: ParsedAnalysis = {
  id: '0',
  classification: 'UNALLOWABLE',
  primary_purpose: 'Error loading analysis',
  allowable_elements: [],
  unallowable_elements: [],
  required_modifications: [],
  risk_assessment: {
    private_benefit_risk: 'HIGH',
    mission_alignment: 'WEAK',
    implementation_complexity: 'HIGH'
  },
  key_considerations: []
}

/**
 * Page for viewing detailed analysis of a single proposal
 */
export default function ProposalAnalysisPage() {
  const router = useRouter()
  const { id } = router.query
  const { data: proposals, isLoading } = useProposals()
  const [analysis, setAnalysis] = useState<ParsedAnalysis>(DEFAULT_ANALYSIS)
  const [error, setError] = useState<Error | null>(null)

  // Find the specific proposal we want to analyze
  const currentProposal = proposals?.find(
    p => p.proposal.id === (id ? BigInt(id.toString()) : undefined)
  )

  // Fetch analysis when proposal data is available
  useEffect(() => {
    if (!id || Array.isArray(id) || !currentProposal) return

    const fetchAnalysis = async () => {
      try {
        const response = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            proposalId: parseInt(id),
            description: currentProposal.description
          })
        })

        if (!response.ok) throw new Error('Failed to analyze proposal')
        const analysisData: ParsedAnalysis = await response.json()
        setAnalysis(analysisData)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to analyze proposal'))
        setAnalysis(ERROR_ANALYSIS)
      }
    }

    fetchAnalysis()
  }, [id, currentProposal])

  // Handle invalid ID
  if (!id || Array.isArray(id)) {
    return (
      <div className={styles.container}>
        <p className={styles.error}>Invalid proposal ID</p>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <ProposalAnalysisDashboard 
          analysis={analysis}
          isLoading={isLoading && analysis === DEFAULT_ANALYSIS}
          error={error}
        />
      </div>
    </div>
  )
}