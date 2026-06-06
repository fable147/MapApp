import React, { useMemo } from 'react'
import styles from './ElevationChart.module.css'

const VW = 580
const VH = 130
const PAD = { top: 12, right: 12, bottom: 26, left: 42 }
const CW  = VW - PAD.left - PAD.right
const CH  = VH - PAD.top  - PAD.bottom

export default function ElevationChart({ profile, loading, error, onClose }) {
  const chart = useMemo(() => {
    if (!profile) return null
    const { points, minElev, maxElev, totalDist } = profile
    const elevRange = (maxElev - minElev) || 1

    const px = (d) => PAD.left + (d / totalDist) * CW
    const py = (e) => PAD.top + CH - ((e - minElev) / elevRange) * CH

    const pts   = points.map((p) => `${px(p.dist).toFixed(1)},${py(p.elev).toFixed(1)}`).join(' L ')
    const pathD = `M ${pts}`
    const fillD = `M ${px(0)},${PAD.top + CH} L ${pts} L ${px(totalDist)},${PAD.top + CH} Z`

    const xLabels = [0, 0.25, 0.5, 0.75, 1].map((t) => ({
      x: PAD.left + t * CW,
      label: (t * totalDist).toFixed(1) + ' km',
    }))
    const yLabels = [0, 0.5, 1].map((t) => ({
      y: PAD.top + (1 - t) * CH,
      label: Math.round(minElev + t * elevRange) + ' m',
    }))

    return { pathD, fillD, xLabels, yLabels }
  }, [profile])

  const visible = loading || error || profile

  if (!visible) return null

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <span className={styles.title}>
          <i className="ti ti-chart-area-line" />
          Yükseklik Profili
        </span>

        {profile && (
          <div className={styles.stats}>
            <span title="Toplam mesafe">
              <i className="ti ti-route" />
              {profile.totalDist.toFixed(2)} km
            </span>
            <span title="Yükseklik kazanımı">
              <i className="ti ti-trending-up" />
              +{profile.elevGain} m
            </span>
            <span title="Min / Maks rakım">
              <i className="ti ti-mountain" />
              {Math.round(profile.minElev)} – {Math.round(profile.maxElev)} m
            </span>
          </div>
        )}

        <button className={styles.closeBtn} onClick={onClose} aria-label="Kapat">
          <i className="ti ti-x" />
        </button>
      </div>

      <div className={styles.body}>
        {loading && (
          <div className={styles.msg}>
            <span className={styles.spinner} />
            Yükseklik verisi alınıyor…
          </div>
        )}

        {error && (
          <div className={styles.msg} style={{ color: 'var(--danger)' }}>
            <i className="ti ti-alert-circle" />
            {error}
          </div>
        )}

        {chart && (
          <svg viewBox={`0 0 ${VW} ${VH}`} className={styles.svg} preserveAspectRatio="none">
            <defs>
              <linearGradient id="eg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#4d8ef5" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#4d8ef5" stopOpacity="0.03" />
              </linearGradient>
            </defs>

            {/* grid */}
            {chart.yLabels.map((l, i) => (
              <line key={i} x1={PAD.left} x2={VW - PAD.right}
                y1={l.y} y2={l.y} stroke="var(--bd)" strokeWidth="1" />
            ))}

            {/* fill + line */}
            <path d={chart.fillD} fill="url(#eg)" />
            <path d={chart.pathD} fill="none" stroke="#4d8ef5"
              strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />

            {/* y labels */}
            {chart.yLabels.map((l, i) => (
              <text key={i} x={PAD.left - 5} y={l.y + 4}
                textAnchor="end" fontSize="9" fill="var(--t3)">{l.label}</text>
            ))}

            {/* x labels */}
            {chart.xLabels.map((l, i) => (
              <text key={i} x={l.x} y={VH - 5}
                textAnchor="middle" fontSize="9" fill="var(--t3)">{l.label}</text>
            ))}
          </svg>
        )}
      </div>
    </div>
  )
}
