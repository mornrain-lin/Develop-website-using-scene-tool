import { useEffect, useState } from 'react'
import { loadTheme, saveTheme } from '@/lib/storage'

export function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => loadTheme())

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') root.classList.add('dark')
    else root.classList.remove('dark')
    saveTheme(theme)
  }, [theme])

  const toggle = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))

  return { theme, toggle }
}
