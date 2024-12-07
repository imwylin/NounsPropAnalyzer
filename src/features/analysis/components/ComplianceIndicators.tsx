import type { ParsedAnalysis } from '../types/parser'
import styles from './ComplianceIndicators.module.css'

interface ComplianceIndicatorsProps {
  analysis: ParsedAnalysis
}

// Utility functions for styling
function getClassificationColor(classification: string): string {
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

function getRiskLevelColor(risk: string): string {
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

/**
 * Visual indicators for proposal's 501c3 compliance status
 */
export function ComplianceIndicators({ analysis }: ComplianceIndicatorsProps) {
  const {
    classification,
    risk_assessment: {
      private_benefit_risk,
      mission_alignment,
      implementation_complexity
    }
  } = analysis

  return (
    <div className={styles.container}>
      <div className={styles.grid}>
        {/* Classification */}
        <div className={styles.indicator}>
          <div className={styles.label}>
            Classification
          </div>
          <div className={`${styles.value} ${getClassificationColor(classification)}`}>
            {classification}
          </div>
        </div>

        {/* Private Benefit Risk */}
        <div className={styles.indicator}>
          <div className={styles.label}>
            Private Benefit Risk
          </div>
          <div className={`${styles.value} ${getRiskLevelColor(private_benefit_risk)}`}>
            {private_benefit_risk}
          </div>
        </div>

        {/* Mission Alignment */}
        <div className={styles.indicator}>
          <div className={styles.label}>
            Mission Alignment
          </div>
          <div className={`${styles.value} ${getRiskLevelColor(mission_alignment)}`}>
            {mission_alignment}
          </div>
        </div>

        {/* Implementation Complexity */}
        <div className={styles.indicator}>
          <div className={styles.label}>
            Complexity
          </div>
          <div className={`${styles.value} ${getRiskLevelColor(implementation_complexity)}`}>
            {implementation_complexity}
          </div>
        </div>
      </div>
    </div>
  )
} 