import { useState, useCallback, useRef } from 'react'
import maplibregl from 'maplibre-gl'

export const POI_CATEGORIES = [
  { id: 'hospital',    label: 'Hastane',    icon: 'ti-building-hospital', color: '#f55f5f', tag: '"amenity"="hospital"' },
  { id: 'pharmacy',   label: 'Eczane',     icon: 'ti-pill',              color: '#34d9a0', tag: '"amenity"="pharmacy"' },
  { id: 'cafe',       label: 'Kafe',        icon: 'ti-coffee',            color: '#f5834d', tag: '"amenity"="cafe"' },
  { id: 'restaurant', label: 'Restoran',    icon: 'ti-tools-kitchen-2',   color: '#f5d94d', tag: '"amenity"="restaurant"' },
  { id: 'atm',        label: 'ATM',         icon: 'ti-building-bank',     color: '#4d8ef5', tag: '"amenity"="atm"' },
  { id: 'fuel',       label: 'Benzin',      icon: 'ti-gas-station',       color: '#c97cf5', tag: '"amenity"="fuel"' },
  { id: 'supermarket',label: 'Market',      icon: 'ti-shopping-cart',     color: '#5ff5c4', tag: '"shop"="supermarket"' },
  { id: 'hotel',      label: 'Otel',        icon: 'ti-bed',               color: '#f55f9a', tag: '"tourism"="hotel"' },
  { id: 'park',       label: 'Park',        icon: 'ti-trees',             color: '#80ed99', tag: '"leisure"="park"' },
  { id: 'school',     label: 'Okul',        icon: 'ti-school',            color: '#a0c4ff', tag: '"amenity"="school"' },
]

const RADIUS = 1500
const OVERPASS_MIRRORS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
]

async function overpassGet(query) {
  const encoded = encodeURIComponent(query)
  for (const base of OVERPASS_MIRRORS) {
    try {
      const res = await fetch(`${base}?data=${encoded}`, {
        signal: AbortSignal.timeout(12000),
      })
      if (res.ok) return res.json()
    } catch { /* try next mirror */ }
  }
  throw new Error('Overpass API ulaşılamıyor')
}

export function usePoi(mapRef) {
  const [poiList,       setPoiList]       = useState([])
  const [loading,       setLoading]       = useState(false)
  const [error,         setError]         = useState(null)
  const [activeCategory, setActiveCategory] = useState(null)
  const markersRef = useRef({}) // id → marker

  function clearMarkers() {
    Object.values(markersRef.current).forEach((m) => m.remove())
    markersRef.current = {}
  }

  const searchPoi = useCallback(async (category, lat, lng) => {
    setLoading(true)
    setError(null)
    setActiveCategory(category.id)
    clearMarkers()
    setPoiList([])

    try {
      const query = `[out:json][timeout:20];(node[${category.tag}](around:${RADIUS},${lat},${lng});way[${category.tag}](around:${RADIUS},${lat},${lng}););out center;`
      const data = await overpassGet(query)

      const items = data.elements
        .map((el) => ({
          id:      el.id,
          lat:     el.lat  ?? el.center?.lat,
          lng:     el.lon  ?? el.center?.lon,
          name:    el.tags?.name || el.tags?.['name:tr'] || category.label,
          address: [el.tags?.['addr:street'], el.tags?.['addr:housenumber']]
            .filter(Boolean).join(' '),
        }))
        .filter((el) => el.lat && el.lng)
        .slice(0, 50)

      const map = mapRef.current
      if (map) {
        items.forEach((item) => {
          const el = document.createElement('div')
          el.style.cssText = [
            `width:28px;height:28px`,
            `background:${category.color}`,
            `border:2.5px solid rgba(255,255,255,0.85)`,
            `border-radius:50%`,
            `display:flex;align-items:center;justify-content:center`,
            `color:#0e1117;font-size:13px`,
            `box-shadow:0 2px 8px rgba(0,0,0,0.45)`,
            `cursor:pointer`,
          ].join(';')
          el.innerHTML = `<i class="ti ${category.icon}"></i>`

          const popup = new maplibregl.Popup({ offset: 15, closeButton: false })
            .setHTML(
              `<strong style="font-size:13px">${item.name}</strong>` +
              (item.address ? `<div style="font-size:11px;color:var(--t2);margin-top:3px">${item.address}</div>` : '')
            )

          const marker = new maplibregl.Marker({ element: el })
            .setLngLat([item.lng, item.lat])
            .setPopup(popup)
            .addTo(map)

          markersRef.current[item.id] = marker
        })
      }

      setPoiList(items)
      if (items.length === 0) setError('Bu alanda sonuç bulunamadı')
    } catch {
      setError('Veri alınamadı — bağlantıyı kontrol edin')
    } finally {
      setLoading(false)
    }
  }, [mapRef])

  const focusPoi = useCallback((item) => {
    const marker = markersRef.current[item.id]
    if (!marker) return
    mapRef.current?.flyTo({ center: [item.lng, item.lat], zoom: 17, duration: 900 })
    setTimeout(() => {
      if (!marker.getPopup().isOpen()) marker.togglePopup()
    }, 950)
  }, [mapRef])

  const clearPoi = useCallback(() => {
    clearMarkers()
    setPoiList([])
    setActiveCategory(null)
    setError(null)
  }, [])

  return { poiList, loading, error, activeCategory, searchPoi, focusPoi, clearPoi }
}
