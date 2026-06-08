import React from 'react'
import styles from './NavOverlay.module.css'

function formatNavDist(m) {
  if (m == null) return ''
  if (m < 1000) return `${Math.round(m / 10) * 10} m`
  return `${(m / 1000).toFixed(1)} km`
}

export default function NavOverlay({ liveOn, navSteps, navStepIdx, distToNextM }) {
  if (!liveOn || !navSteps || navSteps.length === 0) return null

  const step   = navSteps[navStepIdx]
  const isLast = navStepIdx >= navSteps.length - 1

  if (!step) return null

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
      </div>
    </div>
  )
}
