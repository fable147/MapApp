import { useState, useEffect, useCallback, useRef } from 'react'

const ACC_SRC  = 'live-accuracy'
const ACC_FILL = 'live-accuracy-fill'
const ACC_LINE = 'live-accuracy-line'

// Haversine ile doğruluk çemberi oluştur (turf gerektirmez)
function makeCircle(lat, lng, radiusM, steps = 64) {
  const R = 6371000
  const d = radiusM / R
  const lat1 = lat * (Math.PI / 180)
  const lng1 = lng * (Math.PI / 180)
  const coords = []

  for (let i = 0; i <= steps; i++) {
    const bearing = (i * 360 / steps) * (Math.PI / 180)
    const lat2 = Math.asin(
      Math.sin(lat1) * Math.cos(d) +
      Math.cos(lat1) * Math.sin(d) * Math.cos(bearing)
    )
    const lng2 = lng1 + Math.atan2(
      Math.sin(bearing) * Math.sin(d) * Math.cos(lat1),
      Math.cos(d) - Math.sin(lat1) * Math.sin(lat2)
    )
    coords.push([lng2 * (180 / Math.PI), lat2 * (180 / Math.PI)])
  }

  return { type: 'Feature', geometry: { type: 'Polygon', coordinates: [coords] } }
}

function addAccuracyLayers(map) {
  if (map.getSource(ACC_SRC)) return
  map.addSource(ACC_SRC, { type: 'geojson', data: { type: 'FeatureCollection', features: [] } })
  map.addLayer({ id: ACC_FILL, type: 'fill',   source: ACC_SRC, paint: { 'fill-color': '#4d8ef5', 'fill-opacity': 0.12 } })
  map.addLayer({ id: ACC_LINE, type: 'line',   source: ACC_SRC, paint: { 'line-color': '#4d8ef5', 'line-width': 1.5, 'line-opacity': 0.4 } })
}

function removeAccuracyLayers(map) {
  try { if (map.getLayer(ACC_FILL)) map.removeLayer(ACC_FILL) } catch {}
  try { if (map.getLayer(ACC_LINE)) map.removeLayer(ACC_LINE) } catch {}
  try { if (map.getSource(ACC_SRC)) map.removeSource(ACC_SRC) } catch {}
}

export function useLiveLocation(mapRef) {
  const [liveOn,   setLiveOn]   = useState(false)
  const [accuracy, setAccuracy] = useState(null)
  const [error,    setError]    = useState(null)

  const watchIdRef = useRef(null)
  const markerRef  = useRef(null)
  const liveOnRef  = useRef(false)
  const firstFixRef = useRef(true)

  // Stil değişince doğruluk katmanlarını yeniden ekle
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    function onStyleLoad() {
      if (!liveOnRef.current) return
      addAccuracyLayers(map)
    }
    map.on('style.load', onStyleLoad)
    return () => map.off('style.load', onStyleLoad)
  }, [mapRef])

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
    markerRef.current?.remove()
    markerRef.current = null
    const map = mapRef.current
    if (map) removeAccuracyLayers(map)
    liveOnRef.current = false
    firstFixRef.current = true
    setLiveOn(false)
    setAccuracy(null)
    setError(null)
  }, [mapRef])

  const startTracking = useCallback(() => {
    const map = mapRef.current
    const mgl = window.maplibregl
    if (!map || !mgl) return

    if (!navigator.geolocation) {
      setError('Konum servisi desteklenmiyor')
      return
    }

    // Pulsing mavi nokta marker'ı oluştur
    const el = document.createElement('div')
    el.className = 'live-loc-wrap'
    el.innerHTML = '<div class="live-loc-ring"></div><div class="live-loc-core"></div>'

    markerRef.current = new mgl.Marker({ element: el, anchor: 'center' })

    // Doğruluk çemberi katmanlarını ekle
    addAccuracyLayers(map)

    liveOnRef.current = true
    firstFixRef.current = true
    setLiveOn(true)
    setError(null)

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { longitude: lng, latitude: lat, accuracy: acc } = pos.coords
        const currentMap = mapRef.current
        if (!currentMap || !liveOnRef.current) return

        // Marker konumunu güncelle
        markerRef.current.setLngLat([lng, lat]).addTo(currentMap)

        // Doğruluk çemberi güncelle
        const src = currentMap.getSource(ACC_SRC)
        if (src) src.setData(makeCircle(lat, lng, acc))

        setAccuracy(Math.round(acc))

        // İlk fix'te haritayı ortalayıp yaklaştır
        if (firstFixRef.current) {
          currentMap.flyTo({ center: [lng, lat], zoom: Math.max(currentMap.getZoom(), 16), duration: 1200 })
          firstFixRef.current = false
        }
      },
      (err) => {
        const msg = err.code === 1 ? 'Konum izni reddedildi' : 'Konum alınamadı'
        setError(msg)
        stopTracking()
      },
      { enableHighAccuracy: true, maximumAge: 4000, timeout: 12000 }
    )
  }, [mapRef, stopTracking])

  const toggleLive = useCallback(() => {
    if (liveOnRef.current) stopTracking()
    else startTracking()
  }, [startTracking, stopTracking])

  // Unmount'ta temizle
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current)
      markerRef.current?.remove()
    }
  }, [])

  return { liveOn, toggleLive, accuracy, liveError: error }
}
