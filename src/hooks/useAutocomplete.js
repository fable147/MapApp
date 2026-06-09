import { useState, useEffect, useRef, useCallback } from 'react'

// Photon (komoot) — OSM verisi, CORS açık, rate-limit yok, autocomplete için tasarlandı
// Tek seferde TOTAL_FETCH sonuç çekilir; "daha fazla" client-side gösterilir (ekstra istek yok)
const TOTAL_FETCH  = 20
const PAGE_SIZE    =  8
const cache        = {}

// ── Yardımcılar ──────────────────────────────────────────────────────────────
function buildShortName(p) {
  return p.name || p.street || p.city || p.town || p.village || p.county || p.state || p.country || ''
}

function buildDisplayName(p) {
  const parts = [
    p.name,
    p.street,
    p.district || p.suburb,
    p.city || p.town || p.village,
    p.county,
    p.state,
    p.country,
  ].filter(Boolean)
  return [...new Set(parts)].join(', ')
}

function resolveIcon(p) {
  const k = p.osm_key   || ''
  const v = p.osm_value || ''
  if (k === 'boundary' || v === 'administrative') return 'ti-building-community'
  if (v === 'city' || v === 'town' || v === 'village') return 'ti-building-community'
  if (k === 'highway') return 'ti-road'
  if (k === 'amenity') return 'ti-building-store'
  if (k === 'tourism') return 'ti-camera'
  if (k === 'natural') return 'ti-trees'
  if (k === 'waterway' || v === 'river' || v === 'lake') return 'ti-droplet'
  return 'ti-map-pin'
}

function sortAlpha(items) {
  return [...items].sort((a, b) =>
    a.displayName.localeCompare(b.displayName, 'tr', { sensitivity: 'base' })
  )
}

async function fetchAll(q, signal) {
  const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=${TOTAL_FETCH}`
  const res  = await fetch(url, { signal })
  const data = await res.json()

  const items = (data.features || []).map((f) => {
    const p = f.properties || {}
    return {
      displayName: buildDisplayName(p),
      shortName:   buildShortName(p),
      lat: f.geometry.coordinates[1],
      lon: f.geometry.coordinates[0],
      icon: resolveIcon(p),
    }
  }).filter(item => item.shortName)

  return sortAlpha(items)
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useAutocomplete(delay = 300) {
  const [query,        setQuery]       = useState('')
  const [allResults,   setAllResults]  = useState([])
  const [showCount,    setShowCount]   = useState(PAGE_SIZE)
  const [loading,      setLoading]     = useState(false)
  const [open,         setOpen]        = useState(false)
  const [highlightIdx, setHighlightIdx] = useState(-1)

  const abortRef    = useRef(null)
  const timerRef    = useRef(null)
  const allRef      = useRef([])
  const showRef     = useRef(PAGE_SIZE)

  useEffect(() => { allRef.current  = allResults   }, [allResults])
  useEffect(() => { showRef.current = showCount     }, [showCount])

  const suggestions = allResults.slice(0, showCount)
  const hasMore     = showCount < allResults.length
  const loadingMore = false // tüm veriler çekilmiş, sadece gösterim artıyor

  // ── Debounced arama ──
  useEffect(() => {
    const q = query.trim()

    if (q.length < 2) {
      setAllResults([])
      setShowCount(PAGE_SIZE)
      setOpen(false)
      setLoading(false)
      setHighlightIdx(-1)
      return
    }

    if (abortRef.current) abortRef.current.abort()
    clearTimeout(timerRef.current)

    timerRef.current = setTimeout(async () => {
      const key = q.toLowerCase()
      if (cache[key]) {
        const cached = cache[key]
        setAllResults(cached)
        setShowCount(PAGE_SIZE)
        setOpen(cached.length > 0)
        setHighlightIdx(-1)
        return
      }

      setLoading(true)
      const controller = new AbortController()
      abortRef.current = controller

      try {
        const items = await fetchAll(q, controller.signal)
        cache[key] = items
        setAllResults(items)
        setShowCount(PAGE_SIZE)
        setOpen(items.length > 0)
        setHighlightIdx(-1)
      } catch (err) {
        if (err.name !== 'AbortError') setAllResults([])
      } finally {
        setLoading(false)
      }
    }, delay)

    return () => clearTimeout(timerRef.current)
  }, [query, delay])

  // Client-side daha fazla göster (ek API isteği yok)
  const loadMore = useCallback(() => {
    setShowCount(prev => Math.min(prev + PAGE_SIZE, allRef.current.length))
  }, [])

  const select = useCallback((suggestion) => {
    setQuery(suggestion.shortName)
    setAllResults([])
    setShowCount(PAGE_SIZE)
    setOpen(false)
    setHighlightIdx(-1)
    return { lon: suggestion.lon, lat: suggestion.lat, name: suggestion.shortName }
  }, [])

  const clear = useCallback(() => {
    setQuery('')
    setAllResults([])
    setShowCount(PAGE_SIZE)
    setOpen(false)
    setHighlightIdx(-1)
  }, [])

  const close = useCallback(() => {
    setOpen(false)
    setHighlightIdx(-1)
  }, [])

  const highlightNext = useCallback(() => {
    setHighlightIdx((prev) => {
      const max = allRef.current.slice(0, showRef.current).length - 1
      return prev >= max ? max : prev + 1
    })
  }, [])

  const highlightPrev = useCallback(() => {
    setHighlightIdx((prev) => (prev <= 0 ? 0 : prev - 1))
  }, [])

  return {
    query, setQuery,
    suggestions, loading, loadingMore, hasMore, open,
    highlightIdx,
    select, clear, close, loadMore,
    highlightNext, highlightPrev,
  }
}
