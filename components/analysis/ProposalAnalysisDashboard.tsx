import { useProposalAnalysis } from '../../hooks/useProposalAnalysis'
import { ComplianceIndicators } from './ComplianceIndicators'
import { CharitableBreakdown } from './CharitableBreakdown'
import type { Classification, RiskLevel } from '../../types/parser'
import styles from './ProposalAnalysisDashboard.module.css'

interface ProposalAnalysisDashboardProps {
  proposalId: number
}

/**
 * Dashboard component displaying proposal details and 501c3 analysis
 */
export function ProposalAnalysisDashboard({
  proposalId
}: ProposalAnalysisDashboardProps) {
  const {
    data,
    isLoading,
    isError,
    error
  } = useProposalAnalysis({
    proposalId
  })

  // Loading state
  if (isLoading) {
    return (
      <div className={styles.loadingState}>
        <p>Analyzing proposal {proposalId}...</p>
      </div>
    )
  }

  // Error state
  if (isError) {
    return (
      <div className={styles.errorState}>
        <p>Error: {error?.message || 'Failed to load proposal analysis'}</p>
      </div>
    )
  }

  // No data state
  if (!data) {
    return (
      <div className={styles.loadingState}>
        <p>No analysis available for proposal {proposalId}</p>
      </div>
    )
  }

  const { analysis } = data

  return (
    <div className={styles.container}>
      {/* Proposal Header */}
      <header className={styles.header}>
        <h1 className={styles.title}>
          Proposal {proposalId}
        </h1>
        <div className={styles.badges}>
          <span className={`${styles.badge} ${getClassificationStyle(analysis?.classification)}`}>
            {analysis?.classification || 'Unclassified'}
          </span>
          {analysis?.risk_assessment && (
            <span className={`${styles.badge} ${getRiskLevelStyle(analysis.risk_assessment.private_benefit_risk)}`}>
              {analysis.risk_assessment.private_benefit_risk} Risk
            </span>
          )}
        </div>
      </header>

      {/* Analysis Content */}
      {analysis && (
        <div className={styles.content}>
          <ComplianceIndicators analysis={analysis} />
          <CharitableBreakdown analysis={analysis} />
        </div>
      )}
    </div>
  )
}

// Utility functions for styling
function getClassificationStyle(classification?: Classification): string {
  switch (classification) {
    case 'CHARITABLE':
      return styles.charitable
    case 'OPERATIONAL':
      return styles.operational
    case 'MARKETING':
      return styles.marketing
    case 'PROGRAM_RELATED':
      return styles.programRelated
    case 'UNALLOWABLE':
      return styles.unallowable
    default:
      return ''
  }
}

function getRiskLevelStyle(risk?: RiskLevel): string {
  switch (risk) {
    case 'LOW':
      return styles.riskLow
    case 'MEDIUM':
      return styles.riskMedium
    case 'HIGH':
      return styles.riskHigh
    default:
      return ''
  }
} 