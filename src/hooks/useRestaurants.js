import { useState, useRef, useCallback } from 'react'

const GEO_KEY = import.meta.env.VITE_GEOAPIFY_KEY ?? ''
const GEO_URL = 'https://api.geoapify.com/v2/places'
const RADIUS  = 2000

export const FOOD_CATEGORIES = [
  { id: 'restaurant', geo: 'catering.restaurant', label: 'Restoran',  icon: 'ti-tools-kitchen-2', color: '#f5834d' },
  { id: 'cafe',       geo: 'catering.cafe',       label: 'Kafe',      icon: 'ti-coffee',          color: '#ff9f43' },
  { id: 'fast_food',  geo: 'catering.fast_food',  label: 'Fast Food', icon: 'ti-pizza',           color: '#f5d94d' },
  { id: 'pub',        geo: 'catering.pub',         label: 'Bar / Pub', icon: 'ti-glass-full',      color: '#c97cf5' },
  { id: 'dessert',    geo: 'catering.ice_cream',   label: 'Tatlı',    icon: 'ti-ice-cream',       color: '#f55f9a' },
]

function distLabel(m) {
  return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`
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
    website:  p.website  ?? raw.website  ?? null,
    phone:    p.phone    ?? raw.phone    ?? null,
    cuisine:  raw.cuisine ?? null,
    opening:  raw.opening_hours ?? null,
    category,
  }
}

export function useRestaurants(mapRef) {
  const [places, setPlaces]                 = useState([])
  const [loading, setLoading]               = useState(false)
  const [error, setError]                   = useState(null)
  const [activeCategory, setActiveCategory] = useState(null)
  const markersRef                          = useRef({})

  const clearRestaurants = useCallback(() => {
    Object.values(markersRef.current).forEach((mk) => mk.remove())
    markersRef.current = {}
    setPlaces([])
    setError(null)
    setActiveCategory(null)
  }, [])

  const searchRestaurants = useCallback(async (category, lat, lng) => {
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
        limit:      25,
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
        results.forEach((p) => {
          const el = document.createElement('div')
          el.style.cssText =
            `width:28px;height:28px;background:${category.color};border:2px solid #fff;` +
            `border-radius:50%;display:flex;align-items:center;justify-content:center;` +
            `cursor:pointer;box-shadow:0 2px 5px rgba(0,0,0,.35);`
          el.innerHTML = `<i class="ti ${category.icon}" style="color:#fff;font-size:13px"></i>`

          const cuisineHtml = p.cuisine ? `<span style="font-size:10px;color:#aaa"> · ${p.cuisine}</span>` : ''
          const openingHtml = p.opening ? `<div style="font-size:11px;color:#888;margin-top:2px">🕒 ${p.opening}</div>` : ''
          const websiteHtml = p.website ? `<a href="${p.website}" target="_blank" rel="noopener" style="font-size:11px;color:#4d8ef5;display:block;margin-top:4px">🌐 Web sitesi</a>` : ''
          const phoneHtml   = p.phone   ? `<div style="font-size:11px;margin-top:2px">📞 ${p.phone}</div>` : ''

          const popup = new mgl.Popup({ offset: 16, maxWidth: '260px' }).setHTML(`
            <div style="font-family:sans-serif;padding:2px 0;line-height:1.6">
              <strong style="font-size:13px">${p.name}</strong>${cuisineHtml}
              <div style="font-size:11px;color:#888;margin:2px 0">${p.address}</div>
              <div style="font-size:11px;color:#aaa">${distLabel(p.distance)}</div>
              ${openingHtml}${websiteHtml}${phoneHtml}
            </div>
          `)

          const mk = new mgl.Marker({ element: el })
            .setLngLat([p.lng, p.lat])
            .setPopup(popup)
            .addTo(map)
          markersRef.current[p.id] = mk
        })
      }

      setPlaces(results)
      if (results.length === 0) setError('Bu kategoride yakında yer bulunamadı')
    } catch (err) {
      setError(`Arama hatası: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }, [mapRef])

  const focusRestaurant = useCallback((place) => {
    markersRef.current[place.id]?.togglePopup()
  }, [])

  return { places, loading, error, activeCategory, searchRestaurants, clearRestaurants, focusRestaurant }
}
