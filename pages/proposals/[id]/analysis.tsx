import { useRouter } from 'next/router'
import { useProposals } from '../../../hooks/useProposals'
import { ProposalAnalysisDashboard } from '../../../components/analysis/ProposalAnalysisDashboard'
import styles from '../proposals.module.css'
import { useState, useEffect } from 'react'
import type { ParsedAnalysis } from '../../../types/parser'

// Default analysis state to handle loading and error cases
const defaultAnalysis: ParsedAnalysis = {
  id: '',
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

/**
 * Page for viewing detailed analysis of a single proposal
 */
export default function ProposalAnalysisPage() {
  const router = useRouter()
  const { id } = router.query
  const { data: proposal, isLoading } = useProposals()
  const [analysis, setAnalysis] = useState<ParsedAnalysis>(defaultAnalysis)
  const [error, setError] = useState<Error | null>(null)

  // Fetch analysis when proposal data is available
  useEffect(() => {
    if (!id || Array.isArray(id) || !proposal?.description) return

    const fetchAnalysis = async () => {
      try {
        const response = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            proposalId: parseInt(id),
            description: proposal.description
          })
        })

        if (!response.ok) throw new Error('Failed to analyze proposal')
        const analysisData = await response.json()
        setAnalysis(analysisData)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to analyze proposal'))
      }
    }

    fetchAnalysis()
  }, [id, proposal])

  // Handle invalid ID
  if (!id || Array.isArray(id)) {
    return (
      <div className={styles.container}>
        <p className={styles.error}>Invalid proposal ID</p>
      </div>
    )
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.content}>
          <ProposalAnalysisDashboard 
            analysis={{
              ...defaultAnalysis,
              id: id
            }}
            isLoading={true}
            error={null}
          />
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.content}>
          <ProposalAnalysisDashboard 
            analysis={{
              ...defaultAnalysis,
              id: id,
              classification: 'UNALLOWABLE',
              primary_purpose: 'Error loading analysis',
              unallowable_elements: [error.message],
              risk_assessment: {
                private_benefit_risk: 'HIGH',
                mission_alignment: 'WEAK',
                implementation_complexity: 'HIGH'
              }
            }}
            isLoading={false}
            error={error}
          />
        </div>
      </div>
    )
  }

  // Show analysis
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <ProposalAnalysisDashboard 
          analysis={analysis}
          isLoading={isLoading}
          error={null}
        />
      </div>
    </div>
  )
}