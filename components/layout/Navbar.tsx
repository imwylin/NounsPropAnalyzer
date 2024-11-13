import Link from 'next/link'
import styles from './Navbar.module.css'

export function Navbar() {
  return (
    <nav className={styles.navbar}>
      <div className={styles.links}>
        <Link href="/" className={styles.link}>
          Home
        </Link>
        <Link href="/analyze" className={styles.link}>
          Analyze
        </Link>
        <Link href="/proposals" className={styles.link}>
          Proposals
        </Link>
      </div>
    </nav>
  )
} 