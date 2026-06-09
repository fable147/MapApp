import React, { useState, useEffect } from 'react'
import styles from './NavOverlay.module.css'

function formatNavDist(m) {
  if (m == null) return ''
  if (m < 1000) return `${Math.round(m / 10) * 10} m`
  return `${(m / 1000).toFixed(1)} km`
}

function formatDuration(min) {
  if (min == null || min < 0) return null
  if (min < 1) return '1 dk'
  if (min < 60) return `${Math.round(min)} dk`
  const h = Math.floor(min / 60)
  const m = Math.round(min % 60)
  return m > 0 ? `${h} sa ${m} dk` : `${h} sa`
}

function calcEta(remainingMin) {
  if (remainingMin == null || remainingMin < 0) return null
  const eta = new Date(Date.now() + remainingMin * 60000)
  return eta.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
}

export default function NavOverlay({
  liveOn, navSteps, navStepIdx, distToNextM,
  voiceOn, onToggleVoice,
  routeInfo, remainingKm,
}) {
  // ETA'yı dakikada bir yenile (varış saati kaymaması için)
  const [tick, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 60000)
    return () => clearInterval(id)
  }, [])

  if (!liveOn || !navSteps || navSteps.length === 0) return null

  const step   = navSteps[navStepIdx]
  const isLast = navStepIdx >= navSteps.length - 1
  if (!step) return null

  // Kalan süre: toplam durationMin * (kalan km / toplam km)
  let remainingMin = null
  if (routeInfo && remainingKm != null && routeInfo.distanceKm > 0) {
    const ratio = Math.min(remainingKm / routeInfo.distanceKm, 1)
    remainingMin = routeInfo.durationMin * ratio
  }

  const durationStr = formatDuration(remainingMin)
  const etaStr      = calcEta(remainingMin)

  return (
    <div className={styles.overlay}>
      <div className={`${styles.iconBox} ${isLast ? styles.arrive : ''}`}>
        <i className={`ti ${step.icon}`} />
      </div>

      <div className={styles.info}>
        <div className={styles.instruction}>{step.label}</div>
        {!isLast && distToNextM != null && (
          <div className={styles.dist}>{formatNavDist(distToNextM)}</div>
        )}
        {durationStr && etaStr && (
          <div className={styles.eta}>
            <i className="ti ti-clock" />
            <span>{durationStr}</span>
            <span className={styles.etaSep}>·</span>
            <span>{etaStr}</span>
          </div>
        )}
      </div>

      <button
        className={`${styles.muteBtn} ${!voiceOn ? styles.muteBtnOff : ''}`}
        onClick={onToggleVoice}
        title={voiceOn ? 'Sesi kapat' : 'Sesi aç'}
        aria-label={voiceOn ? 'Sesi kapat' : 'Sesi aç'}
      >
        <i className={`ti ${voiceOn ? 'ti-volume' : 'ti-volume-off'}`} />
      </button>
    </div>
  )
}
