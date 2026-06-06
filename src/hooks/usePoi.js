import { useState, useCallback, useRef } from 'react'
import maplibregl from 'maplibre-gl'

const GEO_KEY = import.meta.env.VITE_GEOAPIFY_KEY ?? ''
const GEO_URL = 'https://api.geoapify.com/v2/places'
const RADIUS  = 2000

export const POI_CATEGORIES = [
  { id: 'hospital',    label: 'Hastane',  icon: 'ti-building-hospital', color: '#f55f5f', geo: 'healthcare.hospital' },
  { id: 'pharmacy',    label: 'Eczane',   icon: 'ti-pill',              color: '#34d9a0', geo: 'healthcare.pharmacy' },
  { id: 'cafe',        label: 'Kafe',     icon: 'ti-coffee',            color: '#f5834d', geo: 'catering.cafe' },
  { id: 'restaurant',  label: 'Restoran', icon: 'ti-tools-kitchen-2',   color: '#f5d94d', geo: 'catering.restaurant' },
  { id: 'atm',         label: 'ATM',      icon: 'ti-building-bank',     color: '#4d8ef5', geo: 'service.financial.atm' },
  { id: 'fuel',        label: 'Benzin',   icon: 'ti-gas-station',       color: '#c97cf5', geo: 'service.vehicle.fuel' },
  { id: 'supermarket', label: 'Market',   icon: 'ti-shopping-cart',     color: '#5ff5c4', geo: 'commercial.supermarket' },
  { id: 'hotel',       label: 'Otel',     icon: 'ti-bed',               color: '#f55f9a', geo: 'accommodation.hotel' },
  { id: 'park',        label: 'Park',     icon: 'ti-trees',             color: '#80ed99', geo: 'leisure.park' },
  { id: 'school',      label: 'Okul',     icon: 'ti-school',            color: '#a0c4ff', geo: 'education.school' },
]

function parseFeature(f) {
  const p = f.properties ?? {}
  if (!p.name) return null
  return {
    id:       p.place_id ?? `${p.lat}-${p.lon}`,
    lat:      p.lat,
    lng:      p.lon,
    name:     p.name,
    address:  p.formatted ?? '',
    distance: Math.round(p.distance ?? 0),
  }
}

export function usePoi(mapRef) {
  const [poiList,        setPoiList]        = useState([])
  const [loading,        setLoading]        = useState(false)
  const [error,          setError]          = useState(null)
  const [activeCategory, setActiveCategory] = useState(null)
  const markersRef = useRef({})

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
      const params = new URLSearchParams({
        categories: category.geo,
        filter:     `circle:${lng},${lat},${RADIUS}`,
        bias:       `proximity:${lng},${lat}`,
        limit:      25,
        apiKey:     GEO_KEY,
      })
      const res = await fetch(`${GEO_URL}?${params}`)
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.message ?? `HTTP ${res.status}`)
      }
      const data  = await res.json()
      const items = (data.features ?? []).map(parseFeature).filter(Boolean)

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
              (item.address
                ? `<div style="font-size:11px;color:var(--t2);margin-top:3px">${item.address}</div>`
                : '')
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
    } catch (err) {
      setError(`Veri alınamadı: ${err.message}`)
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
