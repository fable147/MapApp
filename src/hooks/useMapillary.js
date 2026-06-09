import { useState, useCallback, useRef, useEffect } from 'react'

// Mapillary API v4 — move to .env (VITE_MAPILLARY_TOKEN) in production
const TOKEN     = 'MLY|27371976319122918|ef4fede7812ad18b15f3ead83bf44f51'
const SOURCE_ID = 'mapillary-src'
const LAYER_LINE = 'mapillary-lines'
const LAYER_DOT  = 'mapillary-dots'

export function useMapillary(mapRef) {
  const [on,      setOn]      = useState(false)
  const [image,   setImage]   = useState(null)
  const [loading, setLoading] = useState(false)
  const onRef = useRef(false)
  useEffect(() => { onRef.current = on }, [on])

  // ── Layer yönetimi ──────────────────────────────────────────────────────────
  const addLayers = useCallback((map) => {
    if (map.getSource(SOURCE_ID)) return

    map.addSource(SOURCE_ID, {
      type: 'vector',
      tiles: [
        `https://tiles.mapillary.com/maps/vtp/mly1_public/2/{z}/{x}/{y}?access_token=${TOKEN}`,
      ],
      minzoom: 6,
      maxzoom: 14,
    })

    map.addLayer({
      id: LAYER_LINE,
      type: 'line',
      source: SOURCE_ID,
      'source-layer': 'sequence',
      paint: {
        'line-color': '#05cbff',
        'line-width': ['interpolate', ['linear'], ['zoom'], 6, 1, 14, 3],
        'line-opacity': 0.75,
      },
    })

    map.addLayer({
      id: LAYER_DOT,
      type: 'circle',
      source: SOURCE_ID,
      'source-layer': 'image',
      minzoom: 14,
      paint: {
        'circle-color': '#05cbff',
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 14, 3, 18, 7],
        'circle-stroke-color': '#fff',
        'circle-stroke-width': 1,
        'circle-opacity': 0.9,
      },
    })
  }, [])

  const removeLayers = useCallback((map) => {
    if (map.getLayer(LAYER_DOT))  map.removeLayer(LAYER_DOT)
    if (map.getLayer(LAYER_LINE)) map.removeLayer(LAYER_LINE)
    if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID)
  }, [])

  // ── Fotoğraf çekme ──────────────────────────────────────────────────────────
  const fetchImage = useCallback(async (lng, lat) => {
    setLoading(true)
    setImage(null)
    try {
      const d   = 0.001 // ~110 m yarıçap
      const bbox = `${lng - d},${lat - d},${lng + d},${lat + d}`
      const res  = await fetch(
        `https://graph.mapillary.com/images` +
        `?fields=id,thumb_1024_url,thumb_256_url,captured_at,geometry,compass_angle` +
        `&bbox=${bbox}&limit=10&access_token=${TOKEN}`
      )
      const data = await res.json()
      const features = data.data || []
      if (!features.length) return

      // Tıklanan noktaya en yakın fotoğrafı seç
      let best = null, minD = Infinity
      for (const f of features) {
        const [fLng, fLat] = f.geometry.coordinates
        const dist = Math.hypot(fLng - lng, fLat - lat)
        if (dist < minD) { minD = dist; best = f }
      }
      if (!best) return

      setImage({
        id:           best.id,
        url:          best.thumb_1024_url || best.thumb_256_url,
        capturedAt:   best.captured_at,
        compassAngle: best.compass_angle,
        lng: best.geometry.coordinates[0],
        lat: best.geometry.coordinates[1],
      })
    } catch (err) {
      console.error('Mapillary fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // ── Tıklama handler'ı ──────────────────────────────────────────────────────
  const handleClick = useCallback((e) => {
    fetchImage(e.lngLat.lng, e.lngLat.lat)
  }, [fetchImage])

  // ── Toggle ─────────────────────────────────────────────────────────────────
  const toggleMapillary = useCallback(() => {
    const map = mapRef.current
    if (!map) return
    const next = !onRef.current
    setOn(next)

    if (next) {
      const attach = () => {
        addLayers(map)
        map.on('click',      LAYER_LINE, handleClick)
        map.on('click',      LAYER_DOT,  handleClick)
        map.on('mouseenter', LAYER_LINE, () => { map.getCanvas().style.cursor = 'pointer' })
        map.on('mouseleave', LAYER_LINE, () => { map.getCanvas().style.cursor = '' })
        map.on('mouseenter', LAYER_DOT,  () => { map.getCanvas().style.cursor = 'pointer' })
        map.on('mouseleave', LAYER_DOT,  () => { map.getCanvas().style.cursor = '' })
      }
      map.isStyleLoaded() ? attach() : map.once('load', attach)
    } else {
      map.off('click', LAYER_LINE, handleClick)
      map.off('click', LAYER_DOT,  handleClick)
      removeLayers(map)
      setImage(null)
    }
  }, [mapRef, addLayers, removeLayers, handleClick])

  // Stil değişince layer'ları yeniden ekle
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const onStyleData = () => { if (onRef.current) addLayers(map) }
    map.on('styledata', onStyleData)
    return () => map.off('styledata', onStyleData)
  }, [mapRef, addLayers])

  return {
    mapillaryOn: on,
    toggleMapillary,
    mapillaryImage:   image,
    mapillaryLoading: loading,
    closeMapillary:   () => setImage(null),
  }
}
