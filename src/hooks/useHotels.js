import { useState, useRef, useCallback } from 'react'

const GEO_KEY = import.meta.env.VITE_GEOAPIFY_KEY ?? ''
const GEO_URL = 'https://api.geoapify.com/v2/places'
const RADIUS  = 5000

function distLabel(m) {
  return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`
}

function catLabel(categories) {
  if (!categories?.length) return 'Konaklama'
  const c = categories[0] ?? ''
  if (c.includes('hostel'))      return 'Hostel'
  if (c.includes('guest_house')) return 'Pansiyon'
  if (c.includes('motel'))       return 'Motel'
  return 'Otel'
}

function parseFeature(f) {
  const p   = f.properties ?? {}
  const raw = p.datasource?.raw ?? {}
  if (!p.name) return null

  const starsRaw = raw.stars ?? raw['hotel:stars'] ?? null
  const stars    = starsRaw ? Math.min(5, parseInt(starsRaw, 10)) : null

  return {
    id:       p.place_id ?? `${p.lat}-${p.lon}`,
    name:     p.name,
    lat:      p.lat,
    lng:      p.lon,
    address:  p.formatted ?? '',
    distance: Math.round(p.distance ?? 0),
    type:     catLabel(p.categories),
    stars,
    website:  p.website  ?? raw.website  ?? raw['contact:website'] ?? null,
    phone:    p.phone    ?? raw.phone    ?? raw['contact:phone']   ?? null,
  }
}

export function useHotels(mapRef) {
  const [hotels, setHotels]   = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)
  const markersRef            = useRef({})

  const clearHotels = useCallback(() => {
    Object.values(markersRef.current).forEach((mk) => mk.remove())
    markersRef.current = {}
    setHotels([])
    setError(null)
  }, [])

  const searchHotels = useCallback(async (lat, lng) => {
    setLoading(true)
    setError(null)
    Object.values(markersRef.current).forEach((mk) => mk.remove())
    markersRef.current = {}

    try {
      const params = new URLSearchParams({
        categories: 'accommodation',
        filter:     `circle:${lng},${lat},${RADIUS}`,
        bias:       `proximity:${lng},${lat}`,
        limit:      20,
        apiKey:     GEO_KEY,
      })
      const res = await fetch(`${GEO_URL}?${params}`)
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.message ?? `HTTP ${res.status}`)
      }
      const data    = await res.json()
      const results = (data.features ?? []).map(parseFeature).filter(Boolean)

      const map = mapRef.current
      const mgl = window.maplibregl
      if (map && mgl) {
        results.forEach((h) => {
          const el = document.createElement('div')
          el.style.cssText =
            'width:30px;height:30px;background:#4d8ef5;border:2px solid #fff;' +
            'border-radius:8px;display:flex;align-items:center;justify-content:center;' +
            'cursor:pointer;box-shadow:0 2px 6px rgba(0,0,0,.4);font-size:15px;'
          el.textContent = '🏨'

          const starsHtml   = h.stars   ? `<span>${'⭐'.repeat(h.stars)}</span>` : ''
          const websiteHtml = h.website
            ? `<a href="${h.website}" target="_blank" rel="noopener" style="font-size:11px;color:#4d8ef5;display:block;margin-top:5px">🌐 Web sitesi</a>`
            : ''
          const phoneHtml = h.phone
            ? `<div style="font-size:11px;margin-top:2px">📞 ${h.phone}</div>`
            : ''

          const popup = new mgl.Popup({ offset: 18, maxWidth: '260px' }).setHTML(`
            <div style="font-family:sans-serif;padding:2px 0;line-height:1.6">
              <strong style="font-size:13px;display:block;margin-bottom:2px">${h.name}</strong>
              <div style="font-size:11px;color:#888;margin-bottom:4px">${h.type}${h.address ? ' · ' + h.address : ''}</div>
              <div style="font-size:12px;display:flex;gap:8px;flex-wrap:wrap;align-items:center">
                ${starsHtml}
                <span style="color:#aaa;font-size:11px">${distLabel(h.distance)}</span>
              </div>
              ${websiteHtml}${phoneHtml}
            </div>
          `)

          const mk = new mgl.Marker({ element: el })
            .setLngLat([h.lng, h.lat])
            .setPopup(popup)
            .addTo(map)
          markersRef.current[h.id] = mk
        })
      }

      setHotels(results)
      if (results.length === 0) setError('Bu bölgede kayıtlı konaklama yeri bulunamadı')
    } catch (err) {
      setError(`Arama hatası: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }, [mapRef])

  const focusHotel = useCallback((hotel) => {
    markersRef.current[hotel.id]?.togglePopup()
  }, [])

  return { hotels, loading, error, searchHotels, clearHotels, focusHotel }
}
