import React, { useRef, useEffect, useState } from 'react'
import maplibregl from 'maplibre-gl'
import styles from './MiniMap.module.css'

const STYLES = {
  liberty:   'https://tiles.openfreemap.org/styles/liberty',
  bright:    'https://tiles.openfreemap.org/styles/bright',
  topo:      'https://tiles.openfreemap.org/styles/positron',
  dark:      'https://tiles.openfreemap.org/styles/dark',
  satellite: 'https://tiles.openfreemap.org/styles/liberty',
  voyager:   'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
  esritopo:  'https://tiles.openfreemap.org/styles/positron',
  cartodark: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
  threed:    'https://tiles.openfreemap.org/styles/liberty',
}

function getViewportGeoJson(map) {
  const b = map.getBounds()
  const ne = b.getNorthEast()
  const sw = b.getSouthWest()
  return {
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [sw.lng, sw.lat],
        [ne.lng, sw.lat],
        [ne.lng, ne.lat],
        [sw.lng, ne.lat],
        [sw.lng, sw.lat],
      ]],
    },
  }
}

function addViewportLayers(map) {
  if (map.getSource('vp')) return
  map.addSource('vp', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } })
  map.addLayer({ id: 'vp-fill', type: 'fill',   source: 'vp', paint: { 'fill-color': '#4d8ef5', 'fill-opacity': 0.12 } })
  map.addLayer({ id: 'vp-line', type: 'line',   source: 'vp', paint: { 'line-color': '#4d8ef5', 'line-width': 1.5, 'line-dasharray': [3, 1.5] } })
}

export default function MiniMap({ mainMapRef, currentStyle }) {
  const containerRef = useRef(null)
  const miniMapRef   = useRef(null)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    if (!visible || !containerRef.current) return

    const mini = new maplibregl.Map({
      container: containerRef.current,
      style: STYLES[currentStyle] || STYLES.liberty,
      center: [35, 39],
      zoom: 2,
      interactive: false,
      attributionControl: false,
    })
    miniMapRef.current = mini

    function sync() {
      const main = mainMapRef.current
      if (!main || !miniMapRef.current) return
      miniMapRef.current.setCenter(main.getCenter())
      miniMapRef.current.setZoom(Math.max(0, main.getZoom() - 4))
      if (miniMapRef.current.getSource('vp')) {
        miniMapRef.current.getSource('vp').setData(getViewportGeoJson(main))
      }
    }

    const main = mainMapRef.current
    if (main) {
      mini.once('load', () => { addViewportLayers(mini); sync() })
      main.on('move', sync)
    }

    return () => {
      main?.off('move', sync)
      mini.remove()
      miniMapRef.current = null
    }
  }, [visible])

  useEffect(() => {
    const mini = miniMapRef.current
    if (!mini) return
    mini.setStyle(STYLES[currentStyle] || STYLES.liberty)
    mini.once('styledata', () => {
      addViewportLayers(mini)
      const main = mainMapRef.current
      if (main && mini.getSource('vp')) mini.getSource('vp').setData(getViewportGeoJson(main))
    })
  }, [currentStyle])

  if (!visible) {
    return (
      <button
        className={styles.reopenBtn}
        onClick={() => setVisible(true)}
        title="Mini haritayı aç"
        aria-label="Mini haritayı aç"
      >
        <i className="ti ti-map-2" />
      </button>
    )
  }

  return (
    <div className={styles.wrap}>
      <button
        className={styles.closeBtn}
        onClick={() => setVisible(false)}
        title="Kapat"
        aria-label="Kapat"
      >
        <i className="ti ti-x" />
      </button>
      <div ref={containerRef} className={styles.map} />
      <div className={styles.crosshair} aria-hidden="true">+</div>
    </div>
  )
}
