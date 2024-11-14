import Link from 'next/link'
import styles from './index.module.css'

export default function HomePage() {
  return (
    <div className={styles.container}>
      <div className={styles.tools}>
        <Link href="/analyze" className={styles.tool}>
          <h2>Analyze Proposal</h2>
          <div className={styles.description}>
            <p>Enter a proposal ID to analyze its 501(c)(3) compliance.</p>
            <div className={styles.features}>
              <span>Moderate Analysis</span>
              <span>Hawkish Analysis</span>
              <span>Innovative Analysis</span>
            </div>
          </div>
        </Link>
        
        <Link href="/treasury" className={styles.tool}>
          <h2>Treasury Overview</h2>
          <div className={styles.description}>
            <p>Monitor treasury activities and transaction history.</p>
            <div className={styles.features}>
              <span>Balance Tracking</span>
              <span>Transaction History</span>
              <span>Flow Analysis</span>
            </div>
          </div>
        </Link>
      </div>
    </div>
  )
} 