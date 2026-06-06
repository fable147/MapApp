import { useEffect, useRef, useCallback, useState } from 'react'
import maplibregl from 'maplibre-gl'
import {
  MAP_STYLES,
  DRAW_SOURCE_ID, DRAW_LAYER_ID,
  MEASURE_SOURCE_ID, MEASURE_LAYER_ID,
  POLYGON_SOURCE_ID, POLYGON_FILL_ID, POLYGON_OUTLINE_ID,
  TURKEY_CENTER, TURKEY_ZOOM,
} from '../utils/constants'

const EMPTY_FC       = { type: 'FeatureCollection', features: [] }
const TERRAIN_SOURCE = 'terrain-dem'

const TERRAIN_DEF = {
  type:     'raster-dem',
  tiles:    ['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'],
  minzoom:  0,
  maxzoom:  15,
  tileSize: 256,
  encoding: 'terrarium',
}

function addTerrainToMap(map) {
  if (!map.getSource(TERRAIN_SOURCE)) map.addSource(TERRAIN_SOURCE, TERRAIN_DEF)
  map.setTerrain({ source: TERRAIN_SOURCE, exaggeration: 2.5 })
  try {
    if (!map.getLayer('sky')) {
      map.addLayer({
        id: 'sky', type: 'sky',
        paint: {
          'sky-type': 'atmosphere',
          'sky-atmosphere-sun': [0.0, 0.0],
          'sky-atmosphere-sun-intensity': 15,
        },
      })
    }
  } catch (_) {}
}

export function useMap(containerRef, onMapClick) {
  const mapRef       = useRef(null)
  const onClickRef   = useRef(onMapClick)
  onClickRef.current = onMapClick

  const terrainOnRef         = useRef(false)
  const [terrainOn, setTerrainOn] = useState(false)

  useEffect(() => {
    if (mapRef.current) return

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLES.liberty.url,
      center: TURKEY_CENTER,
      zoom: TURKEY_ZOOM,
      attributionControl: false,
      antialias: true,
    })

    map.addControl(new maplibregl.NavigationControl(), 'top-right')
    map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-left')

    map.on('load', () => {
      map.addSource(DRAW_SOURCE_ID, { type: 'geojson', data: EMPTY_FC })
      map.addLayer({
        id: DRAW_LAYER_ID, type: 'line', source: DRAW_SOURCE_ID,
        paint: { 'line-color': '#4d8ef5', 'line-width': 2.5, 'line-dasharray': [2, 1.5] },
      })
      map.addSource(MEASURE_SOURCE_ID, { type: 'geojson', data: EMPTY_FC })
      map.addLayer({
        id: MEASURE_LAYER_ID, type: 'line', source: MEASURE_SOURCE_ID,
        paint: { 'line-color': '#34d9a0', 'line-width': 2, 'line-dasharray': [3, 2] },
      })
      map.addSource(POLYGON_SOURCE_ID, { type: 'geojson', data: EMPTY_FC })
      map.addLayer({
        id: POLYGON_FILL_ID, type: 'fill', source: POLYGON_SOURCE_ID,
        paint: { 'fill-color': '#f5834d', 'fill-opacity': 0.2 },
      })
      map.addLayer({
        id: POLYGON_OUTLINE_ID, type: 'line', source: POLYGON_SOURCE_ID,
        paint: { 'line-color': '#f5834d', 'line-width': 2, 'line-dasharray': [3, 2] },
      })
    })

    map.on('click', (e) => onClickRef.current(e))
    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  const setGeoJsonLine = useCallback((sourceId, coords) => {
    const map = mapRef.current
    if (!map || !map.getSource(sourceId)) return
    map.getSource(sourceId).setData({
      type: 'Feature',
      geometry: { type: 'LineString', coordinates: coords },
    })
  }, [])

  const setGeoJsonPolygon = useCallback((sourceId, coords) => {
    const map = mapRef.current
    if (!map || !map.getSource(sourceId)) return
    map.getSource(sourceId).setData({
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: [coords] },
    })
  }, [])

  const clearGeoJson = useCallback((sourceId) => {
    const map = mapRef.current
    if (!map || !map.getSource(sourceId)) return
    map.getSource(sourceId).setData(EMPTY_FC)
  }, [])

  const flyTo = useCallback((center, zoom = 13, duration = 1000) => {
    mapRef.current?.flyTo({ center, zoom, duration, essential: true })
  }, [])

  const fitBounds = useCallback((coords, padding = 100) => {
    const lngs = coords.map((c) => c[0])
    const lats  = coords.map((c) => c[1])
    mapRef.current?.fitBounds(
      [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]],
      { padding, maxZoom: 12, duration: 1200 }
    )
  }, [])

  const changeStyle = useCallback((styleKey, onStyleLoaded) => {
    const map = mapRef.current
    if (!map) return
    const conf = MAP_STYLES[styleKey]
    map.setStyle(conf.url)
    map.once('styledata', () => {
      if (!map.getSource(DRAW_SOURCE_ID)) {
        map.addSource(DRAW_SOURCE_ID, { type: 'geojson', data: EMPTY_FC })
        map.addLayer({
          id: DRAW_LAYER_ID, type: 'line', source: DRAW_SOURCE_ID,
          paint: { 'line-color': '#4d8ef5', 'line-width': 2.5, 'line-dasharray': [2, 1.5] },
        })
      }
      if (!map.getSource(MEASURE_SOURCE_ID)) {
        map.addSource(MEASURE_SOURCE_ID, { type: 'geojson', data: EMPTY_FC })
        map.addLayer({
          id: MEASURE_LAYER_ID, type: 'line', source: MEASURE_SOURCE_ID,
          paint: { 'line-color': '#34d9a0', 'line-width': 2, 'line-dasharray': [3, 2] },
        })
      }
      if (!map.getSource(POLYGON_SOURCE_ID)) {
        map.addSource(POLYGON_SOURCE_ID, { type: 'geojson', data: EMPTY_FC })
        map.addLayer({
          id: POLYGON_FILL_ID, type: 'fill', source: POLYGON_SOURCE_ID,
          paint: { 'fill-color': '#f5834d', 'fill-opacity': 0.2 },
        })
        map.addLayer({
          id: POLYGON_OUTLINE_ID, type: 'line', source: POLYGON_SOURCE_ID,
          paint: { 'line-color': '#f5834d', 'line-width': 2, 'line-dasharray': [3, 2] },
        })
      }
      if (terrainOnRef.current) addTerrainToMap(map)
      map.easeTo({ pitch: conf.pitch ?? 0, duration: 800 })
      onStyleLoaded?.()
    })
  }, [])

  const toggleTerrain = useCallback(() => {
    const map = mapRef.current
    if (!map) return
    if (!terrainOnRef.current) {
      addTerrainToMap(map)
      map.easeTo({ pitch: 55, duration: 800 })
      terrainOnRef.current = true
      setTerrainOn(true)
    } else {
      map.setTerrain(null)
      try { if (map.getLayer('sky')) map.removeLayer('sky') } catch (_) {}
      setTimeout(() => {
        try { if (map.getSource(TERRAIN_SOURCE)) map.removeSource(TERRAIN_SOURCE) } catch (_) {}
      }, 100)
      terrainOnRef.current = false
      setTerrainOn(false)
    }
  }, [])

  const setCursor = useCallback((cursor) => {
    if (mapRef.current) mapRef.current.getCanvas().style.cursor = cursor
  }, [])

  return {
    mapRef, setGeoJsonLine, setGeoJsonPolygon, clearGeoJson,
    flyTo, fitBounds, changeStyle, setCursor,
    terrainOn, toggleTerrain,
  }
}
