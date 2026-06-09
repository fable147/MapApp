import { useState, useEffect, useCallback, useRef } from 'react'
import { haversine } from '../utils/geo'

const ACC_SRC   = 'live-accuracy'
const ACC_FILL  = 'live-accuracy-fill'
const ACC_LINE  = 'live-accuracy-line'
const PATH_SRC  = 'live-path'
const PATH_LYR  = 'live-path-lyr'

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
  map.addLayer({ id: ACC_FILL, type: 'fill', source: ACC_SRC, paint: { 'fill-color': '#4d8ef5', 'fill-opacity': 0.12 } })
  map.addLayer({ id: ACC_LINE, type: 'line', source: ACC_SRC, paint: { 'line-color': '#4d8ef5', 'line-width': 1.5, 'line-opacity': 0.4 } })
}

function addPathLayers(map) {
  if (map.getSource(PATH_SRC)) return
  map.addSource(PATH_SRC, {
    type: 'geojson',
    data: { type: 'Feature', geometry: { type: 'LineString', coordinates: [] } },
  })
  map.addLayer({
    id: PATH_LYR,
    type: 'line',
    source: PATH_SRC,
    paint: {
      'line-color': '#4d8ef5',
      'line-width': 3,
      'line-opacity': 0.75,
      'line-dasharray': [0, 0],
    },
    layout: { 'line-cap': 'round', 'line-join': 'round' },
  })
}

function removeAccuracyLayers(map) {
  try { if (map.getLayer(ACC_FILL)) map.removeLayer(ACC_FILL) } catch {}
  try { if (map.getLayer(ACC_LINE)) map.removeLayer(ACC_LINE) } catch {}
  try { if (map.getSource(ACC_SRC)) map.removeSource(ACC_SRC) } catch {}
}

function removePathLayers(map) {
  try { if (map.getLayer(PATH_LYR)) map.removeLayer(PATH_LYR) } catch {}
  try { if (map.getSource(PATH_SRC)) map.removeSource(PATH_SRC) } catch {}
}

export function useLiveLocation(mapRef) {
  const [liveOn,       setLiveOn]       = useState(false)
  const [accuracy,     setAccuracy]     = useState(null)
  const [error,        setError]        = useState(null)
  const [totalDistKm,  setTotalDistKm]  = useState(0)
  const [elapsedSec,   setElapsedSec]   = useState(0)
  const [currentPos,   setCurrentPos]   = useState(null)

  const watchIdRef      = useRef(null)
  const markerRef       = useRef(null)
  const liveOnRef       = useRef(false)
  const firstFixRef     = useRef(true)
  const pathCoordsRef   = useRef([])
  const lastPointRef    = useRef(null)
  const totalDistRef    = useRef(0)
  const startTimeRef    = useRef(null)
  const timerRef        = useRef(null)
  const restartWatchRef = useRef(null)
  const wakeLockRef     = useRef(null)

  const requestWakeLock = useCallback(async () => {
    if (!('wakeLock' in navigator)) return
    try {
      wakeLockRef.current?.release().catch(() => {})
      wakeLockRef.current = await navigator.wakeLock.request('screen')
      wakeLockRef.current.addEventListener('release', () => { wakeLockRef.current = null })
    } catch {}
  }, [])

  // Stil değişince tüm katmanları yeniden kur
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    function onStyleLoad() {
      if (!liveOnRef.current) return
      addAccuracyLayers(map)
      addPathLayers(map)
      if (pathCoordsRef.current.length >= 2) {
        map.getSource(PATH_SRC)?.setData({
          type: 'Feature',
          geometry: { type: 'LineString', coordinates: pathCoordsRef.current },
        })
      }
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
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    const map = mapRef.current
    if (map) { removeAccuracyLayers(map); removePathLayers(map) }
    wakeLockRef.current?.release().catch(() => {})
    wakeLockRef.current  = null
    restartWatchRef.current = null
    liveOnRef.current = false
    firstFixRef.current = true
    pathCoordsRef.current = []
    lastPointRef.current = null
    totalDistRef.current = 0
    startTimeRef.current = null
    setLiveOn(false)
    setAccuracy(null)
    setError(null)
    setTotalDistKm(0)
    setElapsedSec(0)
    setCurrentPos(null)
  }, [mapRef])

  const startTracking = useCallback(() => {
    const map = mapRef.current
    const mgl = window.maplibregl
    if (!map || !mgl) return
    if (!navigator.geolocation) { setError('Konum servisi desteklenmiyor'); return }

    const el = document.createElement('div')
    el.className = 'live-loc-wrap'
    el.innerHTML = '<div class="live-loc-ring"></div><div class="live-loc-core"></div>'
    markerRef.current = new mgl.Marker({ element: el, anchor: 'center' })

    addAccuracyLayers(map)
    addPathLayers(map)

    liveOnRef.current = true
    firstFixRef.current = true
    pathCoordsRef.current = []
    lastPointRef.current = null
    totalDistRef.current = 0
    startTimeRef.current = Date.now()
    setLiveOn(true)
    setError(null)
    setTotalDistKm(0)
    setElapsedSec(0)

    timerRef.current = setInterval(() => {
      if (startTimeRef.current) {
        setElapsedSec(Math.floor((Date.now() - startTimeRef.current) / 1000))
      }
    }, 1000)

    const geoOpts = { enableHighAccuracy: true, maximumAge: 4000, timeout: 12000 }

    const onGeoSuccess = (pos) => {
      const { longitude: lng, latitude: lat, accuracy: acc } = pos.coords
      const currentMap = mapRef.current
      if (!currentMap || !liveOnRef.current) return

      markerRef.current.setLngLat([lng, lat]).addTo(currentMap)
      currentMap.getSource(ACC_SRC)?.setData(makeCircle(lat, lng, acc))
      setAccuracy(Math.round(acc))
      setCurrentPos({ lng, lat })

      // Gürültü filtresi: doğruluk < 50m, hareket > 5m
      if (acc <= 50) {
        const cur = [lng, lat]
        if (lastPointRef.current) {
          const d = haversine(lastPointRef.current, cur)
          if (d >= 0.005) {
            totalDistRef.current += d
            setTotalDistKm(+(totalDistRef.current.toFixed(3)))
            lastPointRef.current = cur
            pathCoordsRef.current = [...pathCoordsRef.current, cur]
            if (pathCoordsRef.current.length >= 2) {
              currentMap.getSource(PATH_SRC)?.setData({
                type: 'Feature',
                geometry: { type: 'LineString', coordinates: pathCoordsRef.current },
              })
            }
          }
        } else {
          lastPointRef.current = cur
          pathCoordsRef.current = [cur]
        }
      }

      if (firstFixRef.current) {
        currentMap.flyTo({ center: [lng, lat], zoom: Math.max(currentMap.getZoom(), 16), duration: 1200 })
        firstFixRef.current = false
      }
    }

    const onGeoError = (err) => {
      const msg = err.code === 1 ? 'Konum izni reddedildi' : 'Konum alınamadı'
      setError(msg)
      stopTracking()
    }

    watchIdRef.current = navigator.geolocation.watchPosition(onGeoSuccess, onGeoError, geoOpts)

    restartWatchRef.current = () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
        watchIdRef.current = null
      }
      watchIdRef.current = navigator.geolocation.watchPosition(onGeoSuccess, onGeoError, geoOpts)
    }

    requestWakeLock()
  }, [mapRef, stopTracking])

  const toggleLive = useCallback(() => {
    if (liveOnRef.current) stopTracking()
    else startTracking()
  }, [startTracking, stopTracking])

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current)
      markerRef.current?.remove()
      if (timerRef.current) clearInterval(timerRef.current)
      wakeLockRef.current?.release().catch(() => {})
    }
  }, [])

  // Sekme/uygulama ön plana gelince wake lock yenile ve GPS izlemeyi yeniden başlat
  useEffect(() => {
    async function onVisibilityChange() {
      if (document.visibilityState !== 'visible' || !liveOnRef.current) return
      await requestWakeLock()
      // watchPosition iOS Safari'de arkaplanda durdurulabilir — yeniden başlat
      restartWatchRef.current?.()
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => document.removeEventListener('visibilitychange', onVisibilityChange)
  }, [requestWakeLock])

  const avgSpeedKmh = elapsedSec > 60
    ? +(( totalDistKm / (elapsedSec / 3600) ).toFixed(1))
    : 0

  return { liveOn, toggleLive, accuracy, liveError: error, totalDistKm, elapsedSec, avgSpeedKmh, currentPos }
}
