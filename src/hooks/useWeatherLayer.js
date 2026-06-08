import { useState, useEffect, useCallback, useRef } from 'react'

const SRC = 'owm-weather'
const LYR = 'owm-weather-lyr'
const KEY = import.meta.env.VITE_OWM_KEY ?? ''

export const WEATHER_LAYERS = [
  { id: 'precipitation_new', icon: 'ti-cloud-rain',  color: '#4d8ef5' },
  { id: 'temp_new',          icon: 'ti-temperature',  color: '#f55f5f' },
  { id: 'wind_new',          icon: 'ti-wind',         color: '#34d9a0' },
  { id: 'clouds_new',        icon: 'ti-cloud',        color: '#a0a0b0' },
]

function applyLayer(map, layerId) {
  // Remove existing
  try { if (map.getLayer(LYR)) map.removeLayer(LYR) } catch {}
  try { if (map.getSource(SRC)) map.removeSource(SRC) } catch {}

  if (!layerId) return

  map.addSource(SRC, {
    type: 'raster',
    tiles: [`https://tile.openweathermap.org/map/${layerId}/{z}/{x}/{y}.png?appid=${KEY}`],
    tileSize: 256,
    attribution: '© OpenWeatherMap',
  })
  map.addLayer({
    id: LYR,
    type: 'raster',
    source: SRC,
    paint: { 'raster-opacity': 0.75 },
  })
}

export function useWeatherLayer(mapRef) {
  const [activeLayer, setActiveLayer] = useState(null)
  const activeRef = useRef(null)

  // Re-apply after style change
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    function onStyleLoad() {
      if (activeRef.current) applyLayer(map, activeRef.current)
    }
    map.on('style.load', onStyleLoad)
    return () => map.off('style.load', onStyleLoad)
  }, [mapRef])

  const selectWeatherLayer = useCallback((layerId) => {
    const map = mapRef.current
    if (!map) return
    // Toggle off if same layer clicked again
    const next = activeRef.current === layerId ? null : layerId
    activeRef.current = next
    setActiveLayer(next)
    applyLayer(map, next)
  }, [mapRef])

  return { activeWeatherLayer: activeLayer, selectWeatherLayer }
}
