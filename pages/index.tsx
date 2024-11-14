import Link from 'next/link'
import styles from './index.module.css'

/**
 * Landing page for the Nouns 501c3 Analysis system
 */
export default function HomePage() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Nouns DAO 501(c)(3) Analysis Tool</h1>
      <p className={styles.description}>
        This tool helps analyze Nouns DAO proposals for 501(c)(3) compliance by:
      </p>
      <ul className={styles.featureList}>
        <li>Fetching proposal data from the Nouns subgraph</li>
        <li>Analyzing proposal content with AI for compliance</li>
        <li>Providing detailed analysis with risk assessments</li>
        <li>Enabling export of analysis results</li>
      </ul>
      <div className={styles.actions}>
        <Link href="/analyze" className={styles.primaryButton}>
          Start Analysis
        </Link>
      </div>
    </div>
  )
} 