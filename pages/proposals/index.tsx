import Link from 'next/link'
import styles from './proposals.module.css'

/**
 * Main page for viewing and managing proposal analyses
 */
export default function ProposalsPage() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Nouns Proposals</h1>
      <Link href="/analyze" className={styles.link}>
        Go to Proposal Analyzer →
      </Link>
    </div>
  )
}
