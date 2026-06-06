import React, { useState, useEffect, useRef } from 'react'
import styles from './CoordInput.module.css'

function parseCoords(text) {
  const cleaned = text.trim().replace(/[;|]/g, ',')
  const parts = cleaned.split(/[\s,]+/).filter(Boolean)
  if (parts.length !== 2) return null
  const lat = parseFloat(parts[0])
  const lng = parseFloat(parts[1])
  if (isNaN(lat) || isNaN(lng)) return null
  if (lat < -90 || lat > 90) return null
  if (lng < -180 || lng > 180) return null
  return [lng, lat]
}

export default function CoordInput({ mapRef, onGo, onClose }) {
  const [value, setValue] = useState('')
  const [error, setError] = useState('')
  const [center, setCenter] = useState(null)
  const inputRef = useRef(null)

  useEffect(() => {
    const map = mapRef?.current
    if (!map) return
    const update = () => {
      const c = map.getCenter()
      setCenter([c.lat, c.lng])
    }
    update()
    map.on('moveend', update)
    return () => map.off('moveend', update)
  }, [mapRef])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  function handleSubmit() {
    const coords = parseCoords(value)
    if (!coords) {
      setError('Geçersiz format — örnek: 41.0082, 28.9784')
      return
    }
    setError('')
    onGo(coords[0], coords[1])
    onClose()
  }

  function handleKeyDown(e) {
    if (e.key === 'Escape') { onClose(); return }
    if (e.key === 'Enter') handleSubmit()
  }

  function fillCenter() {
    if (center) setValue(`${center[0].toFixed(6)}, ${center[1].toFixed(6)}`)
  }

  return (
    <div className={styles.panel}>
      <div className={styles.row}>
        <i className="ti ti-crosshair" style={{ color: 'var(--t3)', fontSize: 14, flexShrink: 0 }} />
        <input
          ref={inputRef}
          className={styles.input}
          type="text"
          placeholder="enlem, boylam  —  41.0082, 28.9784"
          value={value}
          onChange={e => { setValue(e.target.value); setError('') }}
          onKeyDown={handleKeyDown}
        />
        <button className={styles.goBtn} onClick={handleSubmit} title="Git">
          <i className="ti ti-arrow-right" />
        </button>
        <button className={styles.closeBtn} onClick={onClose} title="Kapat" aria-label="Kapat">
          <i className="ti ti-x" />
        </button>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {center && (
        <button className={styles.centerHint} onClick={fillCenter} title="Mevcut merkezi kullan">
          <i className="ti ti-focus-2" />
          Merkez: {center[0].toFixed(5)}, {center[1].toFixed(5)}
        </button>
      )}
    </div>
  )
}
