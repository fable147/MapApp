import { useState, useCallback } from 'react'

const KEY = 'map_search_history'
const MAX = 10

function load() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]') }
  catch { return [] }
}

export function useSearchHistory() {
  const [history, setHistory] = useState(load)

  const addEntry = useCallback((entry) => {
    setHistory(prev => {
      // Aynı koordinat varsa üste taşı, duplicate oluşturma
      const filtered = prev.filter(h =>
        !(Math.abs(h.lat - entry.lat) < 0.0001 && Math.abs(h.lon - entry.lon) < 0.0001)
      )
      const next = [{ ...entry, ts: Date.now() }, ...filtered].slice(0, MAX)
      localStorage.setItem(KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const removeEntry = useCallback((idx) => {
    setHistory(prev => {
      const next = prev.filter((_, i) => i !== idx)
      localStorage.setItem(KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const clearHistory = useCallback(() => {
    localStorage.removeItem(KEY)
    setHistory([])
  }, [])

  return { history, addEntry, removeEntry, clearHistory }
}
