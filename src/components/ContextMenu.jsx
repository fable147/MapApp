import React, { useEffect, useRef } from 'react'
import styles from './ContextMenu.module.css'

export default function ContextMenu({ x, y, lat, lng, onClose, onCopyCoords, onAddPin, onWeather }) {
  const menuRef = useRef(null)

  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) onClose()
    }
    function handleKey(e) { if (e.key === 'Escape') onClose() }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [onClose])

  // Ekran kenarına taşmasın
  const style = {
    left: Math.min(x, window.innerWidth - 200),
    top:  Math.min(y, window.innerHeight - 160),
  }

  const items = [
    {
      icon: 'ti-copy',
      label: 'Koordinatı kopyala',
      sub: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
      action: () => { onCopyCoords(lat, lng); onClose() },
    },
    {
      icon: 'ti-map-pin',
      label: 'Pin ekle',
      action: () => { onAddPin(lng, lat); onClose() },
    },
    {
      icon: 'ti-cloud',
      label: 'Hava durumu',
      action: () => { onWeather(lat, lng); onClose() },
    },
  ]

  return (
    <div className={styles.menu} style={style} ref={menuRef} role="menu">
      <div className={styles.header}>
        <i className="ti ti-map-pin" aria-hidden="true" />
        {lat.toFixed(4)}, {lng.toFixed(4)}
      </div>
      {items.map((item, i) => (
        <button key={i} className={styles.item} onClick={item.action} role="menuitem">
          <i className={`ti ${item.icon}`} aria-hidden="true" />
          <div>
            <span className={styles.label}>{item.label}</span>
            {item.sub && <span className={styles.sub}>{item.sub}</span>}
          </div>
        </button>
      ))}
    </div>
  )
}
