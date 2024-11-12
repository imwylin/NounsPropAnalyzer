import Link from 'next/link'
import { useProposalCount } from '../hooks/useProposals'
import styles from './index.module.css'

/**
 * Landing page for the Nouns 501c3 Analysis system
 */
export default function HomePage() {
  const { data: proposalCount } = useProposalCount()

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <div className={styles.content}>
          <h1 className={styles.title}>
            Nouns DAO 501c3 Analysis
          </h1>
          <p className={styles.subtitle}>
            Automated analysis of DAO proposals for charitable compliance
          </p>
          
          <div className={styles.actions}>
            <Link
              href="/proposals"
              className={styles.primaryButton}
            >
              View Proposals ({proposalCount?.toString() || '0'})
            </Link>
          </div>

          <div className={styles.features}>
            {/* Feature 1 */}
            <div className={styles.feature}>
              <div className={styles.featureCard}>
                <div className={styles.featureContent}>
                  <h3 className={styles.featureTitle}>
                    Automated Analysis
                  </h3>
                  <p className={styles.featureDescription}>
                    AI-powered analysis of proposal compliance with 501c3 requirements
                  </p>
                </div>
              </div>
            </div>

            {/* Feature 2 */}
            <div className={styles.feature}>
              <div className={styles.featureCard}>
                <div className={styles.featureContent}>
                  <h3 className={styles.featureTitle}>
                    Risk Assessment
                  </h3>
                  <p className={styles.featureDescription}>
                    Evaluation of private benefit risk and mission alignment
                  </p>
                </div>
              </div>
            </div>

            {/* Feature 3 */}
            <div className={styles.feature}>
              <div className={styles.featureCard}>
                <div className={styles.featureContent}>
                  <h3 className={styles.featureTitle}>
                    Export & Share
                  </h3>
                  <p className={styles.featureDescription}>
                    Export analysis results in CSV or Excel format
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
} 