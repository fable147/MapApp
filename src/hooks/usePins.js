import { useState, useCallback, useRef, useEffect } from 'react'
import Supercluster from 'supercluster'
import { PIN_COLORS, PIN_NAMES } from '../utils/constants'

// ── Görsel yardımcılar ─────────────────────────────────────────────────────

function pinSvg(color) {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="34" viewBox="0 0 26 34">` +
    `<path d="M13 0C5.8 0 0 5.8 0 13c0 9.1 13 21 13 21S26 22.1 26 13C26 5.8 20.2 0 13 0z"` +
    ` fill="${color}" stroke="white" stroke-width="1.8"/>` +
    `<circle cx="13" cy="13" r="5" fill="white" fill-opacity="0.75"/>` +
    `</svg>`
  )
}

function makePinEl(color) {
  const el = document.createElement('div')
  el.style.cssText = 'width:26px;height:34px;cursor:pointer;'
  el.innerHTML = pinSvg(color)
  return el
}

function makeClusterEl(count) {
  const size = count >= 20 ? 52 : count >= 5 ? 44 : 36
  const bg   = count >= 20 ? '#f55f5f' : count >= 5 ? '#f5834d' : '#4d8ef5'
  const fs   = count >= 20 ? 17 : 14

  // Dış kap: MapLibre bu elemanın transform'unu kontrol eder — asla değiştirme
  const outer = document.createElement('div')
  outer.style.cssText = `width:${size}px;height:${size}px;cursor:pointer;`

  // İç görsel: hover scale efekti burada güvenle yapılabilir
  const inner = document.createElement('div')
  inner.style.cssText =
    `width:100%;height:100%;box-sizing:border-box;` +
    `background:${bg};` +
    `border:3px solid #fff;border-radius:50%;` +
    `display:flex;align-items:center;justify-content:center;` +
    `color:#fff;font-size:${fs}px;font-weight:700;` +
    `font-family:inherit;` +
    `box-shadow:0 2px 10px rgba(0,0,0,.35);` +
    `transition:transform .12s;`
  inner.textContent = count > 999 ? '999+' : String(count)
  inner.addEventListener('mouseenter', () => { inner.style.transform = 'scale(1.12)' })
  inner.addEventListener('mouseleave', () => { inner.style.transform = '' })

  outer.appendChild(inner)
  return outer
}

function popupHtml(pin) {
  return (
    `<div style="font-weight:600;color:${pin.color};margin-bottom:4px">${pin.name}</div>` +
    `<div style="color:#6b7499;font-size:11px;font-family:monospace">` +
    `${Number(pin.lat).toFixed(5)}<br>${Number(pin.lng).toFixed(5)}</div>`
  )
}

function toFeature(p) {
  return {
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [p.lng, p.lat] },
    properties: { id: p.id, name: p.name, color: p.color, lat: p.lat, lng: p.lng },
  }
}

// ── Hook ───────────────────────────────────────────────────────────────────

export function usePins(mapRef) {
  const [pins, setPins]   = useState([])
  const pinsRef           = useRef([])
  const counterRef        = useRef(0)
  const renderedRef       = useRef([])   // haritadaki aktif marker'lar
  const scRef             = useRef(
    new Supercluster({ radius: 60, maxZoom: 14, minZoom: 0 })
  )

  // ── Tüm marker'ları kaldır + mevcut bbox/zoom'a göre yeniden çiz ──────
  const renderClusters = useCallback(() => {
    const map = mapRef.current
    const mgl = window.maplibregl
    if (!map || !mgl) return

    // Önce eskilerini temizle
    renderedRef.current.forEach((m) => m.remove())
    renderedRef.current = []

    if (pinsRef.current.length === 0) return

    const zoom   = Math.round(map.getZoom())
    const b      = map.getBounds()
    const bbox   = [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()]
    const items  = scRef.current.getClusters(bbox, zoom)

    items.forEach((f) => {
      if (f.properties.cluster) {
        // ── Küme dairesi ───────────────────────────────────────
        const { point_count, cluster_id } = f.properties
        const el = makeClusterEl(point_count)

        el.addEventListener('click', () => {
          const expZoom = Math.min(
            scRef.current.getClusterExpansionZoom(cluster_id),
            20
          )
          map.flyTo({ center: f.geometry.coordinates, zoom: expZoom, duration: 500 })
        })

        const m = new mgl.Marker({ element: el, anchor: 'center' })
          .setLngLat(f.geometry.coordinates)
          .addTo(map)
        renderedRef.current.push(m)

      } else {
        // ── Tekil pin ──────────────────────────────────────────
        const p  = f.properties
        const el = makePinEl(p.color)

        el.addEventListener('click', () => {
          new mgl.Popup({ offset: [0, -32], closeButton: true })
            .setLngLat([Number(p.lng), Number(p.lat)])
            .setHTML(popupHtml(p))
            .addTo(map)
        })

        const m = new mgl.Marker({ element: el, anchor: 'bottom' })
          .setLngLat([Number(p.lng), Number(p.lat)])
          .addTo(map)
        renderedRef.current.push(m)
      }
    })
  }, [mapRef])

  // ── Harita hareket/zoom bitince güncelle ──────────────────────────────
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    map.on('moveend', renderClusters)
    return () => map.off('moveend', renderClusters)
  }, [mapRef, renderClusters])

  // ── Unmount temizliği ─────────────────────────────────────────────────
  useEffect(() => {
    return () => { renderedRef.current.forEach((m) => m.remove()) }
  }, [])

  // ── Supercluster'ı güncelle + yeniden çiz ─────────────────────────────
  function reloadAndRender(next) {
    scRef.current.load(next.map(toFeature))
    renderClusters()
  }

  // ── addPin ────────────────────────────────────────────────────────────
  const addPin = useCallback((lng, lat, overrideName = null) => {
    counterRef.current += 1
    const n     = counterRef.current
    const color = PIN_COLORS[(n - 1) % PIN_COLORS.length]
    const name  = overrideName ?? (
      PIN_NAMES[(n - 1) % PIN_NAMES.length] +
      (n > PIN_NAMES.length ? ` ${Math.ceil(n / PIN_NAMES.length)}` : '')
    )
    const pin  = { id: `pin-${n}-${Date.now()}`, name, lat, lng, color }
    const next = [...pinsRef.current, pin]
    pinsRef.current = next
    setPins(next)
    reloadAndRender(next)
    return pin
  }, [mapRef, renderClusters])

  // ── removePin ─────────────────────────────────────────────────────────
  const removePin = useCallback((id) => {
    const next = pinsRef.current.filter((p) => p.id !== id)
    pinsRef.current = next
    setPins(next)
    reloadAndRender(next)
  }, [mapRef, renderClusters])

  // ── clearPins ─────────────────────────────────────────────────────────
  const clearPins = useCallback(() => {
    pinsRef.current = []
    counterRef.current = 0
    setPins([])
    scRef.current.load([])
    renderedRef.current.forEach((m) => m.remove())
    renderedRef.current = []
  }, [])

  // ── focusPin (sidebar'dan tıklanınca) ─────────────────────────────────
  const focusPin = useCallback((pin) => {
    const map = mapRef.current
    const mgl = window.maplibregl
    if (!map || !mgl) return
    map.flyTo({ center: [pin.lng, pin.lat], zoom: Math.max(map.getZoom(), 15), duration: 800 })
    setTimeout(() => {
      new mgl.Popup({ offset: [0, -32], closeButton: true })
        .setLngLat([pin.lng, pin.lat])
        .setHTML(popupHtml(pin))
        .addTo(map)
    }, 850)
  }, [mapRef])

  return { pins, addPin, removePin, clearPins, focusPin }
}
