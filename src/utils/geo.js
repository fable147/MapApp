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
