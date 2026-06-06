import React, { useState, useRef } from 'react'
import AutocompleteInput from './AutocompleteInput'
import styles from './RoutingPanel.module.css'

function formatDuration(min) {
  if (min < 60) return `${min} dk`
  const h = Math.floor(min / 60), m = min % 60
  return m > 0 ? `${h} sa ${m} dk` : `${h} sa`
}

const ROUTE_COLORS = ['#4d8ef5', '#34d9a0', '#f5834d']
const ROUTE_LABELS = ['En hızlı', 'Alternatif', 'Alternatif 2']

const TRAVEL_MODES = [
  { id: 'car',  icon: 'ti-car',  label: 'Araç' },
  { id: 'foot', icon: 'ti-walk', label: 'Yürüyüş' },
  { id: 'bike', icon: 'ti-bike', label: 'Bisiklet' },
]

let _id = 0
const mkId = () => `s${_id++}`

export default function RoutingPanel({ onGetRoute, onClearRoute, onSelectRoute }) {
  const stopCountRef = useRef(2)
  const [stops, setStops] = useState([
    { id: mkId(), name: '', coord: null },
    { id: mkId(), name: '', coord: null },
  ])
  const [travelMode, setTravelMode] = useState('car')
  const [routes, setRoutes]         = useState([])
  const [selected, setSelected]     = useState(0)
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')
  const [showSteps, setShowSteps]   = useState(false)

  function makeStop() {
    return { id: `s${stopCountRef.current++}`, name: '', coord: null }
  }

  function addStop() {
    setStops((prev) => [...prev.slice(0, -1), makeStop(), prev[prev.length - 1]])
  }

  function removeStop(id) {
    setStops((prev) => prev.filter((s) => s.id !== id))
  }

  function updateStop(id, name, coord) {
    setStops((prev) => prev.map((s) => (s.id === id ? { ...s, name, coord } : s)))
  }

  function handleUseLocation(id) {
    if (!navigator.geolocation) { setError('Konum servisi desteklenmiyor'); return }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const { longitude: lon, latitude: lat } = coords
        updateStop(id, 'Konumunuz', { lon, lat, name: 'Konumunuz' })
        setError('')
      },
      () => setError('Konum alınamadı — izin vermeniz gerekiyor')
    )
  }

  function handleReverse() {
    setStops((prev) => [...prev].reverse().map((s) => ({ ...s })))
  }

  async function handleRoute() {
    const unresolved = stops.filter((s) => s.name.trim() && !s.coord)
    if (unresolved.length > 0) { setError('Lütfen tüm durakları listeden seçin'); return }
    const ready = stops.filter((s) => s.coord)
    if (ready.length < 2) { setError('En az başlangıç ve bitiş noktası girin'); return }
    setError(''); setLoading(true); setRoutes([]); setShowSteps(false)
    try {
      const waypoints = ready.map((s) => [s.coord.lon, s.coord.lat])
      const result = await onGetRoute(waypoints, travelMode)
      if (!result) { setError('Rota bulunamadı.'); return }
      setRoutes(result); setSelected(0)
    } catch {
      setError('Sunucuya ulaşılamadı. Tekrar deneyin.')
    } finally {
      setLoading(false)
    }
  }

  function handleSelect(idx) { setSelected(idx); onSelectRoute(idx); setShowSteps(false) }

  function handleClear() {
    setStops([makeStop(), makeStop()])
    setRoutes([]); setSelected(0); setError(''); setShowSteps(false)
    onClearRoute()
  }

  const currentRoute = routes[selected]

  return (
    <div className={styles.panel}>
      {/* Taşıt modu */}
      <div className={styles.modes}>
        {TRAVEL_MODES.map((m) => (
          <button
            key={m.id}
            className={`${styles.modeBtn} ${travelMode === m.id ? styles.modeActive : ''}`}
            onClick={() => setTravelMode(m.id)}
          >
            <i className={`ti ${m.icon}`} />
            {m.label}
          </button>
        ))}
      </div>

      {/* Duraklar */}
      <div className={styles.inputs}>
        {stops.map((stop, idx) => {
          const isFirst  = idx === 0
          const isLast   = idx === stops.length - 1
          const label    = isFirst ? 'A' : isLast ? 'B' : String(idx + 1)
          const color    = isFirst ? '#4d8ef5' : isLast ? '#f55f5f' : '#f5834d'
          const canDel   = stops.length > 2 && !isFirst && !isLast

          return (
            <React.Fragment key={stop.id}>
              {idx > 0 && <div className={styles.connector} />}
              <div className={styles.inputRow}>
                <div className={styles.dot} style={{ background: color }}>{label}</div>
                <div className={styles.inputWrap}>
                  <AutocompleteInput
                    placeholder={isFirst ? 'Başlangıç noktası...' : isLast ? 'Bitiş noktası...' : `Durak ${idx + 1}...`}
                    value={stop.name}
                    onChange={(v) => updateStop(stop.id, v, null)}
                    onSelect={(r) => updateStop(stop.id, r.name, r)}
                    onEnter={isLast ? handleRoute : undefined}
                  />
                </div>
                {isFirst && (
                  <button
                    className={styles.locBtn}
                    onClick={() => handleUseLocation(stop.id)}
                    title="Konumumu kullan"
                  >
                    <i className="ti ti-current-location" />
                  </button>
                )}
                {canDel && (
                  <button
                    className={styles.removeBtn}
                    onClick={() => removeStop(stop.id)}
                    title="Durağı kaldır"
                  >
                    <i className="ti ti-x" />
                  </button>
                )}
              </div>
            </React.Fragment>
          )
        })}
      </div>

      {/* Ek durak + ters çevir */}
      <div className={styles.stopActions}>
        <button className={styles.addStopBtn} onClick={addStop} disabled={stops.length >= 8}>
          <i className="ti ti-plus" /> Ara Durak Ekle
        </button>
        <button className={styles.swapBtn} onClick={handleReverse} title="Ters çevir">
          <i className="ti ti-arrows-exchange" />
        </button>
      </div>

      {/* Ana butonlar */}
      <div className={styles.actions}>
        <button className={styles.routeBtn} onClick={handleRoute} disabled={loading}>
          {loading
            ? <><span className={styles.spin} /> Hesaplanıyor...</>
            : <><i className="ti ti-route" style={{ marginRight: 6 }} />Rota Bul</>
          }
        </button>
        {routes.length > 0 && (
          <button className={styles.clearBtn} onClick={handleClear} aria-label="Temizle">
            <i className="ti ti-x" />
          </button>
        )}
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {/* Rota kartları */}
      {routes.length > 0 && (
        <div className={styles.routes}>
          {routes.map((r, i) => (
            <button
              key={i}
              className={`${styles.routeCard} ${i === selected ? styles.routeSelected : ''}`}
              onClick={() => handleSelect(i)}
            >
              <div className={styles.routeBar} style={{ background: ROUTE_COLORS[i] }} />
              <div className={styles.routeInfo}>
                <span className={styles.routeLabel}>{ROUTE_LABELS[i] || `Rota ${i + 1}`}</span>
                <span className={styles.routeMeta}>
                  <i className="ti ti-clock" /> {formatDuration(r.durationMin)}
                  &nbsp;&nbsp;
                  <i className="ti ti-road" /> {r.distanceKm} km
                </span>
              </div>
              {i === selected && <i className="ti ti-check" style={{ color: ROUTE_COLORS[i], fontSize: 16 }} />}
            </button>
          ))}
        </div>
      )}

      {/* Adım adım talimatlar */}
      {currentRoute?.steps?.length > 0 && (
        <div className={styles.stepsSection}>
          <button className={styles.stepsToggle} onClick={() => setShowSteps((v) => !v)}>
            <i className={`ti ${showSteps ? 'ti-chevron-up' : 'ti-chevron-down'}`} />
            Adım adım talimatlar ({currentRoute.steps.length})
          </button>
          {showSteps && (
            <div className={styles.stepsList}>
              {currentRoute.steps.map((step, i) => (
                <div key={i} className={styles.stepItem}>
                  <div className={styles.stepIcon}><i className={`ti ${step.icon}`} /></div>
                  <div className={styles.stepText}>
                    <span className={styles.stepLabel}>{step.label}</span>
                    {step.distM > 0 && <span className={styles.stepDist}>{step.dist}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
