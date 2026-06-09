/**
 * Haversine formülü ile iki koordinat arası mesafeyi hesaplar (km)
 */
export function haversine([lon1, lat1], [lon2, lat2]) {
  const R = 6371
  const d2r = Math.PI / 180
  const dLat = (lat2 - lat1) * d2r
  const dLon = (lon2 - lon1) * d2r
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * d2r) * Math.cos(lat2 * d2r) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function polygonAreaM2(coords) {
  if (coords.length < 3) return 0
  const R   = 6371000
  const d2r = Math.PI / 180
  let total = 0
  for (let i = 0; i < coords.length; i++) {
    const j = (i + 1) % coords.length
    total +=
      (coords[j][0] - coords[i][0]) * d2r *
      (2 + Math.sin(coords[i][1] * d2r) + Math.sin(coords[j][1] * d2r))
  }
  return Math.abs(total * R * R / 2)
}

export function formatArea(m2) {
  if (m2 >= 1_000_000) return `${(m2 / 1_000_000).toFixed(2)} km²`
  if (m2 >= 10_000)    return `${(m2 / 10_000).toFixed(2)} ha`
  return `${Math.round(m2).toLocaleString('tr-TR')} m²`
}

export function polygonCentroid(coords) {
  return [
    coords.reduce((s, c) => s + c[0], 0) / coords.length,
    coords.reduce((s, c) => s + c[1], 0) / coords.length,
  ]
}

// Bir noktadan GeoJSON koordinat dizisine (polyline) minimum mesafeyi metre cinsinden döndürür
export function distToPolylineM([pLng, pLat], coords) {
  if (!coords || coords.length < 2) return Infinity
  const R = 6371000
  const d2r = Math.PI / 180
  const cos = Math.cos(pLat * d2r)
  let minDist2 = Infinity
  for (let i = 0; i < coords.length - 1; i++) {
    const ax = (coords[i][0]   - pLng) * cos * R * d2r
    const ay = (coords[i][1]   - pLat)       * R * d2r
    const bx = (coords[i+1][0] - pLng) * cos * R * d2r
    const by = (coords[i+1][1] - pLat)       * R * d2r
    const dx = bx - ax, dy = by - ay
    const len2 = dx * dx + dy * dy
    const t = len2 > 0 ? Math.max(0, Math.min(1, -(ax * dx + ay * dy) / len2)) : 0
    const cx = ax + t * dx, cy = ay + t * dy
    const d2 = cx * cx + cy * cy
    if (d2 < minDist2) minDist2 = d2
  }
  return Math.sqrt(minDist2)
}

const geoCache = {}

/**
 * Nominatim (OpenStreetMap) ile geocoding
 * @returns {Promise<[lon, lat, displayName] | null>}
 */
export async function geocode(query) {
  const key = query.toLowerCase().trim()
  if (geoCache[key]) return geoCache[key]

  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`
  const res = await fetch(url, { headers: { 'Accept-Language': 'tr' } })
  const data = await res.json()

  if (data[0]) {
    const result = [parseFloat(data[0].lon), parseFloat(data[0].lat), data[0].display_name]
    geoCache[key] = result
    return result
  }
  return null
}
