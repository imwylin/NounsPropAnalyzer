import Link from 'next/link'
import styles from './index.module.css'

export default function HomePage() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Nouns Admin Dashboard</h1>
      
      <div className={styles.dashboard}>
        <Link href="/analyze" className={styles.card}>
          <div className={styles.cardHeader}>
            <h2>Proposal Analysis</h2>
            <svg className={styles.icon} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" 
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <p className={styles.description}>
            Analyze proposal compliance with multiple AI perspectives
          </p>
          <div className={styles.features}>
            <span>Moderate Analysis</span>
            <span>Hawkish Analysis</span>
            <span>Innovative Analysis</span>
          </div>
          <div className={styles.cardFooter}>
            <span className={styles.accessButton}>Access Tool</span>
          </div>
        </Link>

        <Link href="/treasury" className={styles.card}>
          <div className={styles.cardHeader}>
            <h2>Treasury Overview</h2>
            <svg className={styles.icon} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H10.9v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.21 1.95.46 2.34 1.15 2.34 1.87 0 .53-.39 1.39-2.1 1.39-1.6 0-2.23-.72-2.32-1.64H8.04c.1 1.7 1.36 2.66 2.86 2.97V19h2.34v-1.67c1.52-.29 2.72-1.16 2.73-2.77-.01-2.2-1.9-2.96-3.66-3.42z" 
                fill="currentColor"/>
            </svg>
          </div>
          <p className={styles.description}>
            Monitor treasury activities and transaction flows
          </p>
          <div className={styles.features}>
            <span>Balance Tracking</span>
            <span>Transaction History</span>
            <span>Flow Analysis</span>
          </div>
          <div className={styles.cardFooter}>
            <span className={styles.accessButton}>Access Tool</span>
          </div>
        </Link>

        <div className={`${styles.card} ${styles.comingSoon}`}>
          <div className={styles.cardHeader}>
            <h2>Proposal History</h2>
            <svg className={styles.icon} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" 
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <p className={styles.description}>
            Browse and search historical proposal analyses
          </p>
          <div className={styles.features}>
            <span>Search History</span>
            <span>Filter Results</span>
            <span>Export Data</span>
          </div>
          <div className={styles.cardFooter}>
            <span className={styles.comingSoonLabel}>Coming Soon</span>
          </div>
        </div>
      </div>
    </div>
  )
} 