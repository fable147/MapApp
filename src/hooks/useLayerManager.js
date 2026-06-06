import { useState, useCallback, useRef, useEffect } from 'react'

const LAYER_COLORS = [
  '#4d8ef5', '#34d9a0', '#f5834d', '#c97cf5',
  '#f5d94d', '#f55f9a', '#5ff5c4', '#ff9f43',
]

const SUB_IDS = (id) => [`${id}-pt`, `${id}-ln`, `${id}-fill`, `${id}-ol`]

function getGeomTypes(geojson) {
  const types = new Set()
  const features = geojson.type === 'FeatureCollection' ? geojson.features : [geojson]
  features.forEach((f) => f?.geometry && types.add(f.geometry.type))
  return types
}

function applyToMap(map, layer) {
  if (!map.isStyleLoaded()) return

  if (!map.getSource(layer.id)) {
    map.addSource(layer.id, { type: 'geojson', data: layer.geojson })
  }

  const vis   = layer.visible ? 'visible' : 'none'
  const types = getGeomTypes(layer.geojson)

  if ((types.has('Point') || types.has('MultiPoint')) && !map.getLayer(`${layer.id}-pt`)) {
    map.addLayer({
      id: `${layer.id}-pt`, type: 'circle', source: layer.id,
      filter: ['match', ['geometry-type'], ['Point', 'MultiPoint'], true, false],
      paint: { 'circle-color': layer.color, 'circle-radius': 5,
               'circle-stroke-color': '#fff', 'circle-stroke-width': 1.5 },
      layout: { visibility: vis },
    })
  }

  if ((types.has('LineString') || types.has('MultiLineString')) && !map.getLayer(`${layer.id}-ln`)) {
    map.addLayer({
      id: `${layer.id}-ln`, type: 'line', source: layer.id,
      filter: ['match', ['geometry-type'], ['LineString', 'MultiLineString'], true, false],
      paint: { 'line-color': layer.color, 'line-width': 2.5 },
      layout: { visibility: vis },
    })
  }

  if ((types.has('Polygon') || types.has('MultiPolygon'))) {
    if (!map.getLayer(`${layer.id}-fill`)) {
      map.addLayer({
        id: `${layer.id}-fill`, type: 'fill', source: layer.id,
        filter: ['match', ['geometry-type'], ['Polygon', 'MultiPolygon'], true, false],
        paint: { 'fill-color': layer.color, 'fill-opacity': 0.25 },
        layout: { visibility: vis },
      })
    }
    if (!map.getLayer(`${layer.id}-ol`)) {
      map.addLayer({
        id: `${layer.id}-ol`, type: 'line', source: layer.id,
        filter: ['match', ['geometry-type'], ['Polygon', 'MultiPolygon'], true, false],
        paint: { 'line-color': layer.color, 'line-width': 1.5 },
        layout: { visibility: vis },
      })
    }
  }
}

export function useLayerManager(mapRef) {
  const [layers, setLayers] = useState([])
  const layersRef = useRef([])
  useEffect(() => { layersRef.current = layers }, [layers])

  const addLayer = useCallback((name, geojson) => {
    const id    = `cl-${Date.now()}`
    const color = LAYER_COLORS[layersRef.current.length % LAYER_COLORS.length]
    const layer = { id, name, geojson, color, visible: true }
    const map   = mapRef.current
    if (map) applyToMap(map, layer)
    setLayers((prev) => [...prev, layer])
  }, [mapRef])

  const removeLayer = useCallback((id) => {
    const map = mapRef.current
    if (map) {
      SUB_IDS(id).forEach((lid) => { if (map.getLayer(lid)) map.removeLayer(lid) })
      if (map.getSource(id)) map.removeSource(id)
    }
    setLayers((prev) => prev.filter((l) => l.id !== id))
  }, [mapRef])

  const toggleLayer = useCallback((id) => {
    setLayers((prev) => prev.map((l) => {
      if (l.id !== id) return l
      const vis = !l.visible ? 'visible' : 'none'
      const map = mapRef.current
      if (map) SUB_IDS(id).forEach((lid) => { if (map.getLayer(lid)) map.setLayoutProperty(lid, 'visibility', vis) })
      return { ...l, visible: !l.visible }
    }))
  }, [mapRef])

  const changeColor = useCallback((id, color) => {
    setLayers((prev) => prev.map((l) => {
      if (l.id !== id) return l
      const map = mapRef.current
      if (map) {
        if (map.getLayer(`${id}-pt`))   map.setPaintProperty(`${id}-pt`,   'circle-color', color)
        if (map.getLayer(`${id}-ln`))   map.setPaintProperty(`${id}-ln`,   'line-color',   color)
        if (map.getLayer(`${id}-fill`)) map.setPaintProperty(`${id}-fill`, 'fill-color',   color)
        if (map.getLayer(`${id}-ol`))   map.setPaintProperty(`${id}-ol`,   'line-color',   color)
      }
      return { ...l, color }
    }))
  }, [mapRef])

  const reinitLayers = useCallback(() => {
    const map = mapRef.current
    if (!map) return
    layersRef.current.forEach((l) => applyToMap(map, l))
  }, [mapRef])

  return { layers, addLayer, removeLayer, toggleLayer, changeColor, reinitLayers }
}

export { LAYER_COLORS }

export function readGeoJsonFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Dosya okunamadı'))
    reader.onload  = (e) => {
      try {
        const data = JSON.parse(e.target.result)
        if (data.type === 'FeatureCollection') {
          if (!data.features?.length) throw new Error('Dosyada hiç özellik yok')
          resolve(data)
        } else if (data.type === 'Feature') {
          resolve({ type: 'FeatureCollection', features: [data] })
        } else if (data.type) {
          resolve({ type: 'FeatureCollection', features: [{ type: 'Feature', geometry: data, properties: {} }] })
        } else {
          throw new Error('Geçerli bir GeoJSON değil')
        }
      } catch (err) {
        reject(err)
      }
    }
    reader.readAsText(file)
  })
}
