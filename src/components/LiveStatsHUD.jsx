import React from 'react'
import styles from './LiveStatsHUD.module.css'

function formatTime(sec) {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function LiveStatsHUD({ liveOn, totalDistKm, elapsedSec, avgSpeedKmh, remainingKm }) {
  if (!liveOn) return null
  return (
    <div className={styles.hud}>
      <div className={styles.pulse} />
      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.val}>{totalDistKm.toFixed(2)}</span>
          <span className={styles.unit}>km</span>
        </div>
        <div className={styles.divider} />
        <div className={styles.stat}>
          <span className={styles.val}>{formatTime(elapsedSec)}</span>
          <span className={styles.unit}>süre</span>
        </div>
        <div className={styles.divider} />
        <div className={styles.stat}>
          <span className={styles.val}>{avgSpeedKmh > 0 ? avgSpeedKmh.toFixed(1) : '—'}</span>
          <span className={styles.unit}>km/sa</span>
        </div>
        {remainingKm != null && (
          <>
            <div className={styles.divider} />
            <div className={styles.stat}>
              <span className={`${styles.val} ${styles.remaining}`}>{remainingKm.toFixed(1)}</span>
              <span className={styles.unit}>kaldı</span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
