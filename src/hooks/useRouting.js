import { useCallback, useRef } from 'react'

const OSRM_BASES = {
  car:     ['https://router.project-osrm.org/route/v1/driving',   'https://routing.openstreetmap.de/routed-car/route/v1/driving'],
  foot:    ['https://routing.openstreetmap.de/routed-foot/route/v1/foot'],
  bike:    ['https://routing.openstreetmap.de/routed-bike/route/v1/bike'],
}

export const ROUTE_COLORS = ['#4d8ef5', '#34d9a0', '#f5834d']
export const ROUTE_SOURCE  = (i) => `route-src-${i}`
export const ROUTE_LAYER   = (i) => `route-layer-${i}`

// OSRM maneuver type → Türkçe + ikon
const TURN_ICONS = {
  'turn-left':          { label: 'Sola dön',          icon: 'ti-arrow-bear-left' },
  'turn-right':         { label: 'Sağa dön',          icon: 'ti-arrow-bear-right' },
  'turn-sharp-left':    { label: 'Sert sola dön',     icon: 'ti-corner-up-left' },
  'turn-sharp-right':   { label: 'Sert sağa dön',     icon: 'ti-corner-up-right' },
  'turn-slight-left':   { label: 'Hafif sola',        icon: 'ti-arrow-bear-left' },
  'turn-slight-right':  { label: 'Hafif sağa',        icon: 'ti-arrow-bear-right' },
  'continue':           { label: 'Düz devam et',      icon: 'ti-arrow-up' },
  'roundabout':         { label: 'Dönel kavşak',      icon: 'ti-rotate-clockwise' },
  'depart':             { label: 'Başlangıç',         icon: 'ti-map-pin' },
  'arrive':             { label: 'Hedefe ulaşıldı',   icon: 'ti-flag' },
  'merge':              { label: 'Birleş',            icon: 'ti-arrow-merge' },
  'fork':               { label: 'Çatal yol',         icon: 'ti-git-fork' },
  'on ramp':            { label: 'Rampa çık',         icon: 'ti-arrow-up-right' },
  'off ramp':           { label: 'Rampadan in',       icon: 'ti-arrow-down-right' },
  'default':            { label: 'Devam et',          icon: 'ti-arrow-up' },
}

function parseTurnIcon(step) {
  const type = step.maneuver?.type || ''
  const mod  = step.maneuver?.modifier || ''
  const key  = mod ? `${type}-${mod}` : type
  return TURN_ICONS[key] || TURN_ICONS[type] || TURN_ICONS['default']
}

function formatDist(m) {
  if (m < 1000) return `${Math.round(m)} m`
  return `${(m / 1000).toFixed(1)} km`
}

export function useRouting(mapRef) {
  const routesRef   = useRef([])
  const markersRef  = useRef([])
  const selectedRef = useRef(0)

  function ensureLayers(map) {
    for (let i = 0; i < 3; i++) {
      const src = ROUTE_SOURCE(i)
      const lyr = ROUTE_LAYER(i)
      if (map.getSource(src)) continue
      map.addSource(src, { type: 'geojson', data: { type: 'FeatureCollection', features: [] } })
      map.addLayer({ id: lyr + '-bg', type: 'line', source: src,
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': '#000', 'line-width': 7, 'line-opacity': 0.12 } })
      map.addLayer({ id: lyr, type: 'line', source: src,
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': ROUTE_COLORS[i], 'line-width': 4, 'line-opacity': 0.5 } })
    }
  }

  function setRouteData(map, idx, coords) {
    const src = ROUTE_SOURCE(idx)
    if (!map.getSource(src)) return
    map.getSource(src).setData({ type: 'Feature', geometry: { type: 'LineString', coordinates: coords } })
  }

  function clearRouteData(map, idx) {
    const src = ROUTE_SOURCE(idx)
    if (!map.getSource(src)) return
    map.getSource(src).setData({ type: 'FeatureCollection', features: [] })
  }

  function paintSelected(map, idx, total) {
    for (let i = 0; i < total; i++) {
      const lyr = ROUTE_LAYER(i)
      if (!map.getLayer(lyr)) continue
      map.setPaintProperty(lyr, 'line-opacity', i === idx ? 0.95 : 0.3)
      map.setPaintProperty(lyr, 'line-width',   i === idx ? 5    : 3)
    }
  }

  function addEndpointMarkers(map, origin, dest) {
    markersRef.current.forEach((m) => m.remove())
    markersRef.current = []
    const mgl = window.maplibregl
    function makeEl(color, letter) {
      const el = document.createElement('div')
      el.style.cssText = `width:26px;height:26px;background:${color};border:2px solid white;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-size:12px;font-weight:700;`
      el.textContent = letter
      return el
    }
    markersRef.current = [
      new mgl.Marker({ element: makeEl('#4d8ef5', 'A') }).setLngLat(origin).addTo(map),
      new mgl.Marker({ element: makeEl('#f55f5f', 'B') }).setLngLat(dest).addTo(map),
    ]
  }

  async function fetchOSRM(origin, dest, travelMode = 'car') {
    const endpoints = OSRM_BASES[travelMode] || OSRM_BASES.car
    const coords    = `${origin[0]},${origin[1]};${dest[0]},${dest[1]}`
    const params    = `?alternatives=3&geometries=geojson&overview=full&steps=true`
    const errors    = []

    for (const base of endpoints) {
      try {
        const res = await fetch(`${base}/${coords}${params}`, {
          headers: { Accept: 'application/json' },
          signal: AbortSignal.timeout(8000),
        })
        if (!res.ok) { errors.push(`HTTP ${res.status}`); continue }
        const data = await res.json()
        if (data.code === 'Ok' && data.routes?.length) return data
        errors.push(`code=${data.code}`)
      } catch (e) {
        errors.push(e.message)
      }
    }
    throw new Error('OSRM: ' + errors.join(', '))
  }

  const getRoute = useCallback(async (origin, dest, travelMode = 'car') => {
    const map = mapRef.current
    if (!map) return null
    if (!map.isStyleLoaded()) await new Promise((r) => map.once('styledata', r))
    ensureLayers(map)

    const data = await fetchOSRM(origin, dest, travelMode)

    const routes = data.routes.map((r, i) => {
      // Adım adım talimatlar
      const steps = []
      r.legs?.forEach((leg) => {
        leg.steps?.forEach((step) => {
          if (!step.maneuver) return
          const turn = parseTurnIcon(step)
          steps.push({
            icon:  turn.icon,
            label: step.name ? `${turn.label} — ${step.name}` : turn.label,
            dist:  formatDist(step.distance),
            distM: step.distance,
          })
        })
      })

      return {
        idx:         i,
        distance:    r.distance,
        duration:    r.duration,
        coords:      r.geometry.coordinates,
        distanceKm:  (r.distance / 1000).toFixed(1),
        durationMin: Math.round(r.duration / 60),
        steps,
      }
    })

    for (let i = 0; i < 3; i++) clearRouteData(map, i)
    routes.forEach((r) => setRouteData(map, r.idx, r.coords))
    paintSelected(map, 0, routes.length)
    addEndpointMarkers(map, origin, dest)

    routesRef.current   = routes
    selectedRef.current = 0

    const allCoords = routes.flatMap((r) => r.coords)
    const lngs = allCoords.map((c) => c[0])
    const lats = allCoords.map((c) => c[1])
    map.fitBounds(
      [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]],
      { padding: 80, maxZoom: 14, duration: 1200 }
    )

    return routes
  }, [mapRef])

  const selectRoute = useCallback((idx) => {
    const map = mapRef.current
    if (!map) return
    selectedRef.current = idx
    paintSelected(map, idx, routesRef.current.length)
  }, [mapRef])

  const clearRoutes = useCallback(() => {
    const map = mapRef.current
    if (!map) return
    for (let i = 0; i < 3; i++) clearRouteData(map, i)
    markersRef.current.forEach((m) => m.remove())
    markersRef.current  = []
    routesRef.current   = []
    selectedRef.current = 0
  }, [mapRef])

  const reinitLayers = useCallback(() => {
    const map = mapRef.current
    if (!map) return
    ensureLayers(map)
    routesRef.current.forEach((r) => setRouteData(map, r.idx, r.coords))
    paintSelected(map, selectedRef.current, routesRef.current.length)
  }, [mapRef])

  return { getRoute, selectRoute, clearRoutes, reinitLayers }
}