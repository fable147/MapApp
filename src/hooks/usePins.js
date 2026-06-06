import { useState, useCallback, useRef } from 'react'
import { PIN_COLORS, PIN_NAMES } from '../utils/constants'

const maplibregl = window.maplibregl

function makePinSvg(color) {
  return `<svg width="28" height="34" viewBox="0 0 28 34" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 0C6.27 0 0 6.27 0 14c0 10.5 14 22 14 22S28 24.5 28 14C28 6.27 21.73 0 14 0z" fill="${color}"/>
    <circle cx="14" cy="13" r="5" fill="white" opacity="0.9"/>
  </svg>`
}

export function usePins(mapRef) {
  const [pins, setPins] = useState([])
  const counterRef = useRef(0)

  const addPin = useCallback((lng, lat, overrideName = null) => {
    counterRef.current += 1
    const count = counterRef.current
    const color = PIN_COLORS[(count - 1) % PIN_COLORS.length]
    const name = overrideName ?? (PIN_NAMES[(count - 1) % PIN_NAMES.length] + (count > PIN_NAMES.length ? ` ${Math.ceil(count / PIN_NAMES.length)}` : ''))

    const el = document.createElement('div')
    el.style.cssText = 'width:28px;height:34px;cursor:pointer'
    el.innerHTML = makePinSvg(color)

    const popup = new maplibregl.Popup({ offset: [0, -28], closeButton: true })
      .setHTML(`
        <div style="font-weight:600;color:${color};margin-bottom:4px">${name}</div>
        <div style="color:#6b7499;font-size:11px;font-family:'Space Mono',monospace">
          ${lat.toFixed(5)}<br>${lng.toFixed(5)}
        </div>
      `)

    const marker = new maplibregl.Marker({ element: el })
      .setLngLat([lng, lat])
      .setPopup(popup)
      .addTo(mapRef.current)

    const id = Date.now() + Math.random()
    const pin = { id, name, lat, lng, color, marker }
    setPins((prev) => [...prev, pin])
    return pin
  }, [mapRef])

  const removePin = useCallback((id) => {
    setPins((prev) => {
      const pin = prev.find((p) => p.id === id)
      if (pin) pin.marker.remove()
      return prev.filter((p) => p.id !== id)
    })
  }, [])

  const clearPins = useCallback(() => {
    setPins((prev) => {
      prev.forEach((p) => p.marker.remove())
      return []
    })
    counterRef.current = 0
  }, [])

  return { pins, addPin, removePin, clearPins }
}
