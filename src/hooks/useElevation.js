import { useState, useCallback } from 'react'
import { haversine } from '../utils/geo'

const SAMPLES = 60

function samplePolyline(coords, n) {
  if (coords.length < 2) return coords
  const cumDist = [0]
  for (let i = 1; i < coords.length; i++) {
    cumDist.push(cumDist[i - 1] + haversine(coords[i - 1], coords[i]))
  }
  const total = cumDist[cumDist.length - 1]
  if (total === 0) return coords

  const result = [coords[0]]
  for (let i = 1; i < n - 1; i++) {
    const target = (i / (n - 1)) * total
    let seg = cumDist.findIndex((d) => d >= target)
    if (seg <= 0) seg = 1
    const t = (target - cumDist[seg - 1]) / (cumDist[seg] - cumDist[seg - 1])
    const p0 = coords[seg - 1]
    const p1 = coords[seg]
    result.push([p0[0] + (p1[0] - p0[0]) * t, p0[1] + (p1[1] - p0[1]) * t])
  }
  result.push(coords[coords.length - 1])
  return result
}

export function useElevation() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)

  const fetchProfile = useCallback(async (coords) => {
    if (!coords || coords.length < 2) return
    setLoading(true)
    setProfile(null)
    setError(null)

    try {
      const pts = samplePolyline(coords, SAMPLES)
      const lats = pts.map((c) => c[1].toFixed(6)).join(',')
      const lngs = pts.map((c) => c[0].toFixed(6)).join(',')

      const res = await fetch(
        `https://api.open-meteo.com/v1/elevation?latitude=${lats}&longitude=${lngs}`
      )
      const data = await res.json()
      if (!data.elevation) throw new Error('Boş yanıt')

      let cumDist = 0
      const points = pts.map((p, i) => {
        if (i > 0) cumDist += haversine(pts[i - 1], p)
        return { dist: cumDist, elev: data.elevation[i] }
      })

      const elevs = points.map((p) => p.elev)
      const gain  = points.reduce((acc, p, i) => {
        if (i === 0) return acc
        const d = p.elev - points[i - 1].elev
        return acc + (d > 0 ? d : 0)
      }, 0)

      setProfile({
        points,
        minElev:   Math.min(...elevs),
        maxElev:   Math.max(...elevs),
        totalDist: cumDist,
        elevGain:  Math.round(gain),
      })
    } catch {
      setError('Yükseklik verisi alınamadı')
    } finally {
      setLoading(false)
    }
  }, [])

  const clearProfile = useCallback(() => {
    setProfile(null)
    setError(null)
    setLoading(false)
  }, [])

  return { profile, loading, error, fetchProfile, clearProfile }
}
