import { useState, useEffect, useRef, useCallback } from 'react'

const cache = {}

export function useAutocomplete(delay = 300) {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [highlightIdx, setHighlightIdx] = useState(-1)
  const abortRef = useRef(null)
  const timerRef = useRef(null)
  // suggestions'ın güncel halini ref'te tut — stale closure olmaz
  const suggestionsRef = useRef([])

  useEffect(() => {
    suggestionsRef.current = suggestions
  }, [suggestions])

  useEffect(() => {
    const q = query.trim()

    if (q.length < 2) {
      setSuggestions([])
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
        setSuggestions(cache[key])
        setOpen(cache[key].length > 0)
        setHighlightIdx(-1)
        return
      }

      setLoading(true)
      const controller = new AbortController()
      abortRef.current = controller

      try {
        const url =
          `https://nominatim.openstreetmap.org/search` +
          `?q=${encodeURIComponent(q)}&format=json&limit=6&addressdetails=1`
        const res = await fetch(url, {
          headers: { 'Accept-Language': 'tr' },
          signal: controller.signal,
        })
        const data = await res.json()

        const mapped = data.map((item) => ({
          displayName: item.display_name,
          shortName: buildShortName(item),
          lat: parseFloat(item.lat),
          lon: parseFloat(item.lon),
          icon: resolveIcon(item),
        }))

        cache[key] = mapped
        setSuggestions(mapped)
        setOpen(mapped.length > 0)
        setHighlightIdx(-1)
      } catch (err) {
        if (err.name !== 'AbortError') setSuggestions([])
      } finally {
        setLoading(false)
      }
    }, delay)

    return () => clearTimeout(timerRef.current)
  }, [query, delay])

  const select = useCallback((suggestion) => {
    setQuery(suggestion.shortName)
    setSuggestions([])
    setOpen(false)
    setHighlightIdx(-1)
    return { lon: suggestion.lon, lat: suggestion.lat, name: suggestion.shortName }
  }, [])

  const clear = useCallback(() => {
    setQuery('')
    setSuggestions([])
    setOpen(false)
    setHighlightIdx(-1)
  }, [])

  const close = useCallback(() => {
    setOpen(false)
    setHighlightIdx(-1)
  }, [])

  // setHighlightIdx içinde fonksiyonel form kullanılıyor —
  // suggestionsRef ile güncel length okunur, stale closure yok
  const highlightNext = useCallback(() => {
    setHighlightIdx((prev) => {
      const max = suggestionsRef.current.length - 1
      return prev >= max ? max : prev + 1
    })
  }, [])

  const highlightPrev = useCallback(() => {
    setHighlightIdx((prev) => (prev <= 0 ? 0 : prev - 1))
  }, [])

  return {
    query, setQuery,
    suggestions, loading, open,
    highlightIdx,
    select, clear, close,
    highlightNext, highlightPrev,
  }
}

function buildShortName(item) {
  const a = item.address || {}
  const name =
    a.city || a.town || a.village || a.municipality ||
    a.county || a.state || a.country || item.display_name.split(',')[0]
  const country = a.country && a.country !== name ? `, ${a.country}` : ''
  return name + country
}

function resolveIcon(item) {
  const t = item.type || ''
  const cls = item.class || ''
  if (cls === 'boundary' || t === 'administrative') return 'ti-building-community'
  if (t === 'city' || t === 'town' || t === 'village') return 'ti-building-community'
  if (cls === 'highway' || t === 'road' || t === 'street') return 'ti-road'
  if (cls === 'amenity') return 'ti-building-store'
  if (cls === 'tourism') return 'ti-camera'
  if (cls === 'natural') return 'ti-trees'
  if (cls === 'water' || t === 'river' || t === 'lake') return 'ti-droplet'
  return 'ti-map-pin'
}
