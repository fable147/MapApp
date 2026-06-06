import { useState, useRef, useCallback } from 'react'

const GEO_KEY = import.meta.env.VITE_GEOAPIFY_KEY ?? ''
const GEO_URL = 'https://api.geoapify.com/v2/places'
const RADIUS  = 5000

export const TOURIST_CATEGORIES = [
  { id: 'museum',     label: 'Müze',     icon: 'ti-building-museum', color: '#c97cf5', geo: 'entertainment.museum' },
  { id: 'attraction', label: 'Turistik', icon: 'ti-star',            color: '#f5d94d', geo: 'tourism.sights' },
  { id: 'viewpoint',  label: 'Manzara',  icon: 'ti-eye',             color: '#34d9a0', geo: 'tourism.attraction.viewpoint' },
  { id: 'castle',     label: 'Kale',     icon: 'ti-tower',           color: '#f5834d', geo: 'tourism.sights.castle' },
  { id: 'monument',   label: 'Anıt',     icon: 'ti-building',        color: '#4d8ef5', geo: 'tourism.sights.memorial' },
  { id: 'ruins',      label: 'Tarihi',   icon: 'ti-columns',         color: '#ff9f43', geo: 'tourism.sights.ruines' },
  { id: 'beach',      label: 'Plaj',     icon: 'ti-sun',             color: '#54a0ff', geo: 'beach' },
  { id: 'gallery',    label: 'Galeri',   icon: 'ti-photo',           color: '#f55f9a', geo: 'entertainment.culture.gallery' },
]

function distLabel(m) {
  return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`
}

async function fetchWikipedia(name) {
  const encoded = encodeURIComponent(name)
  for (const lang of ['tr', 'en']) {
    try {
      const res = await fetch(
        `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encoded}`,
        { signal: AbortSignal.timeout(6000) }
      )
      if (!res.ok) continue
      const data = await res.json()
      if (!data.extract || data.type === 'disambiguation') continue

      const extract = data.extract.length > 320
        ? data.extract.slice(0, 320) + '…'
        : data.extract

      const imgHtml = data.thumbnail?.source
        ? `<img src="${data.thumbnail.source}" alt="${name}"
             style="width:100%;border-radius:5px;margin-bottom:7px;display:block;max-height:140px;object-fit:cover">`
        : ''

      const pageUrl  = data.content_urls?.desktop?.page ?? ''
      const langNote = lang === 'en' ? ' (EN)' : ''

      return `
        ${imgHtml}
        <div style="font-size:11px;line-height:1.55;color:#bbb;margin-bottom:${pageUrl ? 6 : 0}px">${extract}</div>
        ${pageUrl
          ? `<a href="${pageUrl}" target="_blank" rel="noopener"
               style="font-size:11px;color:#4d8ef5;text-decoration:none">Wikipedia'da oku${langNote} →</a>`
          : ''}
      `
    } catch {
      continue
    }
  }
  return null
}

function parseFeature(f, category) {
  const p   = f.properties ?? {}
  const raw = p.datasource?.raw ?? {}
  if (!p.name) return null
  return {
    id:       p.place_id ?? `${p.lat}-${p.lon}`,
    name:     p.name,
    lat:      p.lat,
    lng:      p.lon,
    address:  p.formatted ?? '',
    distance: Math.round(p.distance ?? 0),
    website:  p.website  ?? raw.website  ?? raw['contact:website'] ?? null,
    opening:  raw.opening_hours ?? null,
    category,
  }
}

export function useTouristSpots(mapRef) {
  const [spots, setSpots]                   = useState([])
  const [loading, setLoading]               = useState(false)
  const [error, setError]                   = useState(null)
  const [activeCategory, setActiveCategory] = useState(null)
  const markersRef                          = useRef({})

  const clearSpots = useCallback(() => {
    Object.values(markersRef.current).forEach((mk) => mk.remove())
    markersRef.current = {}
    setSpots([])
    setError(null)
    setActiveCategory(null)
  }, [])

  const searchSpots = useCallback(async (category, lat, lng) => {
    setLoading(true)
    setError(null)
    setActiveCategory(category.id)
    Object.values(markersRef.current).forEach((mk) => mk.remove())
    markersRef.current = {}

    try {
      const params = new URLSearchParams({
        categories: category.geo,
        filter:     `circle:${lng},${lat},${RADIUS}`,
        bias:       `proximity:${lng},${lat}`,
        limit:      30,
        apiKey:     GEO_KEY,
      })
      const res = await fetch(`${GEO_URL}?${params}`)
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.message ?? `HTTP ${res.status}`)
      }
      const data    = await res.json()
      const results = (data.features ?? []).map((f) => parseFeature(f, category)).filter(Boolean)

      const map = mapRef.current
      const mgl = window.maplibregl
      if (map && mgl) {
        results.forEach((s) => {
          const el = document.createElement('div')
          el.style.cssText =
            `width:28px;height:28px;background:${category.color};border:2px solid #fff;` +
            `border-radius:50%;display:flex;align-items:center;justify-content:center;` +
            `cursor:pointer;box-shadow:0 2px 5px rgba(0,0,0,.35);`
          el.innerHTML = `<i class="ti ${category.icon}" style="color:#fff;font-size:13px"></i>`

          const openingHtml = s.opening ? `<div style="font-size:11px;color:#888;margin-top:2px">🕒 ${s.opening}</div>` : ''
          const websiteHtml = s.website ? `<a href="${s.website}" target="_blank" rel="noopener" style="font-size:11px;color:#4d8ef5;display:block;margin-top:4px">🌐 Web sitesi</a>` : ''

          const popup = new mgl.Popup({ offset: 16, maxWidth: '290px' })
          popup.setHTML(`
            <div style="font-family:sans-serif;padding:2px 0;line-height:1.6;width:260px">
              <strong style="font-size:13px;display:block;margin-bottom:2px">${s.name}</strong>
              <div style="font-size:11px;color:#888;margin-bottom:2px">${s.address}</div>
              <div style="font-size:11px;color:#aaa">${distLabel(s.distance)}</div>
              ${openingHtml}${websiteHtml}
              <div class="wiki-area" style="margin-top:8px;border-top:1px solid rgba(128,128,128,.25);padding-top:7px">
                <span style="font-size:10px;color:#666;font-style:italic">Wikipedia aranıyor…</span>
              </div>
            </div>
          `)

          let wikiLoaded = false
          popup.on('open', async () => {
            if (wikiLoaded) return
            wikiLoaded = true
            const wikiEl = popup.getElement()?.querySelector('.wiki-area')
            if (!wikiEl) return
            const html = await fetchWikipedia(s.name)
            wikiEl.innerHTML = html ?? ''
          })

          const mk = new mgl.Marker({ element: el })
            .setLngLat([s.lng, s.lat])
            .setPopup(popup)
            .addTo(map)
          markersRef.current[s.id] = mk
        })
      }

      setSpots(results)
      if (results.length === 0) setError('Bu kategoride yakında yer bulunamadı')
    } catch (err) {
      setError(`Arama hatası: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }, [mapRef])

  const focusSpot = useCallback((spot) => {
    markersRef.current[spot.id]?.togglePopup()
  }, [])

  return { spots, loading, error, activeCategory, searchSpots, clearSpots, focusSpot }
}
