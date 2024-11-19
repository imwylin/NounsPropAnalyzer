import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import styles from './Navbar.module.css'

export function Navbar() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme) {
      setTheme(savedTheme as 'dark' | 'light')
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark')
    } else {
      setTheme('light')
    }
  }, [])

  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark')
    document.documentElement.classList.add(theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'dark' ? 'light' : 'dark')
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
        onClick={toggleTheme}
        className={styles.darkModeButton}
        aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
      >
        {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
      </button>
    </nav>
  )
} 