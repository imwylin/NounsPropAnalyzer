import type { ParsedAnalysis } from '../types/parser'
import styles from './CharitableBreakdown.module.css'

interface CharitableBreakdownProps {
  analysis: ParsedAnalysis
}

/**
 * Displays detailed breakdown of charitable elements and compliance concerns
 */
export function CharitableBreakdown({ analysis }: CharitableBreakdownProps) {
  return (
    <div className={styles.container}>
      {/* Allowable Elements */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>
          Charitable Elements
        </h3>
        <ul className={styles.list}>
          {analysis.allowable_elements.map((element, i) => (
            <li key={i} className={styles.listItem}>
              <span className={`${styles.icon} ${styles.iconSuccess}`}>✓</span>
              <p className={styles.text}>{element}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* Unallowable Elements */}
      {analysis.unallowable_elements.length > 0 && (
        <section className={styles.section}>
          <h3 className={styles.sectionTitleRed}>
            Compliance Concerns
          </h3>
          <ul className={styles.list}>
            {analysis.unallowable_elements.map((element, i) => (
              <li key={i} className={styles.listItem}>
                <span className={`${styles.icon} ${styles.iconError}`}>✕</span>
                <p className={styles.textRed}>{element}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Required Modifications */}
      {analysis.required_modifications.length > 0 && (
        <section className={styles.section}>
          <h3 className={styles.sectionTitleYellow}>
            Required Modifications
          </h3>
          <ul className={styles.list}>
            {analysis.required_modifications.map((modification, i) => (
              <li key={i} className={styles.listItem}>
                <span className={`${styles.icon} ${styles.iconWarning}`}>!</span>
                <p className={styles.textYellow}>{modification}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
} 