import React from 'react'
import styles from './PinList.module.css'

export default function PinList({ pins, onPinClick, onPinDelete }) {
  if (pins.length === 0) {
    return (
      <div className={styles.empty}>
        Henüz pin yok.<br />
        <span>Pin Koy modunda haritaya tıklayın.</span>
      </div>
    )
  }

  return (
    <div className={styles.list}>
      {[...pins].reverse().map((pin) => (
        <div
          key={pin.id}
          className={styles.item}
          onClick={() => onPinClick(pin)}
        >
          <div className={styles.dot} style={{ background: pin.color }} />
          <div className={styles.info}>
            <div className={styles.name}>{pin.name}</div>
            <div className={styles.coord}>
              {pin.lat.toFixed(4)}, {pin.lng.toFixed(4)}
            </div>
          </div>
          <button
            className={styles.del}
            onClick={(e) => { e.stopPropagation(); onPinDelete(pin.id) }}
            title="Sil"
            aria-label="Pini sil"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}
