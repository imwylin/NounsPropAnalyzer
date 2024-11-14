import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import styles from './Navbar.module.css'

export function Navbar() {
  const [isDarkMode, setIsDarkMode] = useState(false)

  useEffect(() => {
    setIsDarkMode(document.documentElement.classList.contains('dark'))
  }, [])

  const toggleDarkMode = () => {
    const newMode = !isDarkMode
    setIsDarkMode(newMode)
    document.documentElement.classList.toggle('dark', newMode)
    localStorage.setItem('theme', newMode ? 'dark' : 'light')
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
        aria-label="Toggle dark mode"
      >
        <svg 
          className={styles.darkModeIcon} 
          width="20" 
          height="20" 
          viewBox="0 0 24 24" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          {isDarkMode ? (
            // Perfectly balanced sun
            <g>
              <circle 
                cx="12" 
                cy="12" 
                r="4" 
                stroke="currentColor" 
                strokeWidth="2"
              />
              <path 
                d="M12 3v2m0 14v2M3 12h2m14 0h2M6.34 6.34l1.42 1.42m8.48-1.42l-1.42 1.42m-8.48 8.48l1.42-1.42m8.48 1.42l-1.42-1.42"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </g>
          ) : (
            // Moon icon remains the same
            <path
              d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          )}
        </svg>
      </button>
    </nav>
  )
} 