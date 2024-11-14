import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import styles from './Navbar.module.css'

export function Navbar() {
  console.log('Navbar rendering');

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
      <Link href="/" className={styles.homeLink}>
        <Image 
          src="/apple-touch-icon.png" 
          alt="Home" 
          width={32} 
          height={32}
          unoptimized
        />
      </Link>
      <div className={styles.links}>
        <Link href="/treasury" className={styles.link}>
          Treasury
        </Link>
        <Link href="/analyze" className={styles.link}>
          Analyze
        </Link>
      </div>
      <button
        onClick={toggleDarkMode}
        className={styles.darkModeButton}
      >
        {isDarkMode ? '☀️' : '🌙'}
      </button>
    </nav>
  )
} 