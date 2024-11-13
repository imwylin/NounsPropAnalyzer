import Link from 'next/link'
import { useEffect, useState } from 'react'
import styles from './Navbar.module.css'

export function Navbar() {
  const [isDarkMode, setIsDarkMode] = useState(false)

  useEffect(() => {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDarkMode(true)
      document.documentElement.classList.add('dark')
    }
  }, [])

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode)
    document.documentElement.classList.toggle('dark')
  }

  return (
    <nav className={styles.navbar}>
      <button
        onClick={toggleDarkMode}
        className={styles.darkModeButton}
      >
        {isDarkMode ? '☀️' : '🌙'}
      </button>
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