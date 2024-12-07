import { ComplianceIndicators } from './ComplianceIndicators'
import { CharitableBreakdown } from './CharitableBreakdown'
import type { ParsedAnalysis } from '../types/parser'
import styles from './ProposalAnalysisDashboard.module.css'

interface ProposalAnalysisDashboardProps {
  analysis: ParsedAnalysis
  isLoading?: boolean
  error?: Error | null
}

export function ProposalAnalysisDashboard({
  analysis,
  isLoading = false,
  error = null
}: ProposalAnalysisDashboardProps) {
  if (isLoading) {
    return <div className={styles.loadingState}>Loading analysis...</div>
  }

  if (error) {
    return (
      <div className={styles.errorState}>
        {error.message || 'Failed to load analysis'}
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Analysis Results</h1>
        <div className={styles.badges}>
          <span className={`${styles.badge} ${styles[analysis.classification.toLowerCase()]}`}>
            {analysis.classification}
          </span>
          <span className={`${styles.badge} ${styles[`risk${analysis.risk_assessment.private_benefit_risk}`]}`}>
            {analysis.risk_assessment.private_benefit_risk} Risk
          </span>
        </div>
      </header>

      <div className={styles.content}>
        <ComplianceIndicators analysis={analysis} />
        <CharitableBreakdown analysis={analysis} />
      </div>
    </div>
  )
} 