import { useState, useEffect } from 'react'

export function useTheme() {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('mapapp-theme')
    if (saved) return saved
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
  })

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'light') root.classList.add('light')
    else root.classList.remove('light')
    localStorage.setItem('mapapp-theme', theme)
  }, [theme])

  const toggleTheme = () => setTheme((t) => t === 'dark' ? 'light' : 'dark')

  return { theme, toggleTheme }
}
