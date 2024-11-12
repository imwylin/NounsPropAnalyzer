import Link from 'next/link'
import { useRouter } from 'next/router'
import styles from './Navbar.module.css'

export function Navbar() {
  const router = useRouter()
  
  const isActive = (path: string) => router.pathname === path

  return (
    <nav className={styles.navbar}>
      <div className={styles.content}>
        <Link href="/" className={styles.brand}>
          Nouns 501c3 Analysis
        </Link>

        <div className={styles.links}>
          <Link 
            href="/proposals" 
            className={`${styles.link} ${isActive('/proposals') ? styles.active : ''}`}
          >
            All Proposals
          </Link>
          <Link 
            href="/analyze" 
            className={`${styles.link} ${isActive('/analyze') ? styles.active : ''}`}
          >
            Manual Analysis
          </Link>
        </div>
      </div>
    </nav>
  )
} 