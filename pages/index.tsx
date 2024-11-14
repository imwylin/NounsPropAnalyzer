import Link from 'next/link'
import styles from './index.module.css'

/**
 * Landing page for the Nouns 501c3 Analysis system
 */
export default function HomePage() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>AI-Enabled DAO Administration Interface</h1>
      
      <section className={styles.section}>
        <h2 className={styles.subtitle}>About This Interface</h2>
        <p className={styles.description}>
          An intelligent administrative interface powered by AI to help DAOs manage their operations
          with enhanced efficiency and compliance.<br /><br />
          Built specifically for Nouns DAO to streamline
          governance and ensure alignment with organizational objectives.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.subtitle}>Core Functions</h2>
        <div className={styles.features}>
          <div className={styles.feature}>
            <h3>Treasury Management</h3>
            <p>AI-powered insights into treasury activities, spending patterns, and financial compliance.</p>
            <Link href="/treasury" className={styles.primaryButton}>
              Treasury Dashboard
            </Link>
          </div>
          
          <div className={styles.feature}>
            <h3>Proposal Intelligence</h3>
            <p>Advanced AI analysis of proposals for risk assessment, impact evaluation, and governance alignment.</p>
            <Link href="/analyze" className={styles.primaryButton}>
              Analyze Proposals
            </Link>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.subtitle}>AI Capabilities</h2>
        <ul className={styles.featureList}>
          <li>Real-time proposal analysis and risk assessment</li>
          <li>Intelligent treasury monitoring and categorization</li>
          <li>Automated compliance checking and recommendations</li>
          <li>Data-driven governance insights</li>
        </ul>
      </section>
    </div>
  )
} 