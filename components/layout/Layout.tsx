import { useEffect, useState } from 'react'
import styles from './Layout.module.css'

export default function Layout({ children }: { children: React.ReactNode }) {
  const [isDarkMode, setIsDarkMode] = useState(false)

  useEffect(() => {
    // Check system preference on mount
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
    <div className={styles.layout}>
      <header className={styles.header}>
        <button
          onClick={toggleDarkMode}
          className={styles.darkModeButton}
        >
          {isDarkMode ? '☀️' : '🌙'}
        </button>
      </header>
      <main>
        {children}
      </main>
    </div>
  )
} 