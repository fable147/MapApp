import { useState, useEffect, useCallback, useRef } from 'react'

const FLOW_SRC = 'tt-flow'
const FLOW_LYR = 'tt-flow-lyr'
const INC_SRC  = 'tt-incidents'
const INC_LYR  = 'tt-incidents-lyr'
const KEY      = import.meta.env.VITE_TOMTOM_KEY ?? ''

function applyLayers(map, flowOn, incOn) {
  // Flow layer
  if (flowOn) {
    if (!map.getSource(FLOW_SRC)) {
      map.addSource(FLOW_SRC, {
        type: 'raster',
        tiles: [`https://api.tomtom.com/traffic/map/4/tile/flow/relative0/{z}/{x}/{y}.png?key=${KEY}`],
        tileSize: 256,
        attribution: '© TomTom',
      })
    }
    if (!map.getLayer(FLOW_LYR)) {
      map.addLayer({ id: FLOW_LYR, type: 'raster', source: FLOW_SRC, paint: { 'raster-opacity': 0.85 } })
    }
  } else {
    try { if (map.getLayer(FLOW_LYR)) map.removeLayer(FLOW_LYR) } catch {}
    try { if (map.getSource(FLOW_SRC)) map.removeSource(FLOW_SRC) } catch {}
  }

  // Incidents layer
  if (incOn) {
    if (!map.getSource(INC_SRC)) {
      map.addSource(INC_SRC, {
        type: 'raster',
        tiles: [`https://api.tomtom.com/traffic/map/4/tile/incidents/s3/{z}/{x}/{y}.png?key=${KEY}`],
        tileSize: 256,
        attribution: '© TomTom',
      })
    }
    if (!map.getLayer(INC_LYR)) {
      map.addLayer({ id: INC_LYR, type: 'raster', source: INC_SRC, paint: { 'raster-opacity': 0.9 } })
    }
  } else {
    try { if (map.getLayer(INC_LYR)) map.removeLayer(INC_LYR) } catch {}
    try { if (map.getSource(INC_SRC)) map.removeSource(INC_SRC) } catch {}
  }
}

export function useTraffic(mapRef) {
  const [flowOn, setFlowOn] = useState(false)
  const [incOn,  setIncOn]  = useState(false)
  // Keep latest state accessible inside the style.load closure
  const stateRef = useRef({ flowOn: false, incOn: false })

  // Re-add layers after map style changes (style.load wipes all custom sources/layers)
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    function onStyleLoad() {
      const { flowOn: f, incOn: i } = stateRef.current
      if (f || i) applyLayers(map, f, i)
    }
    map.on('style.load', onStyleLoad)
    return () => map.off('style.load', onStyleLoad)
  }, [mapRef])

  const toggleFlow = useCallback(() => {
    const map = mapRef.current
    if (!map) return
    setFlowOn((prev) => {
      const next = !prev
      stateRef.current.flowOn = next
      applyLayers(map, next, stateRef.current.incOn)
      return next
    })
  }, [mapRef])

  const toggleIncidents = useCallback(() => {
    const map = mapRef.current
    if (!map) return
    setIncOn((prev) => {
      const next = !prev
      stateRef.current.incOn = next
      applyLayers(map, stateRef.current.flowOn, next)
      return next
    })
  }, [mapRef])

  return { flowOn, incOn, toggleFlow, toggleIncidents }
}
