import React, { useState } from 'react'
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
  { id: 'car',  icon: 'ti-car',     label: 'Araç' },
  { id: 'foot', icon: 'ti-walk',    label: 'Yürüyüş' },
  { id: 'bike', icon: 'ti-bike',    label: 'Bisiklet' },
]

export default function RoutingPanel({ onGetRoute, onClearRoute, onSelectRoute }) {
  const [origin, setOrigin]           = useState('')
  const [dest, setDest]               = useState('')
  const [originCoord, setOriginCoord] = useState(null)
  const [destCoord, setDestCoord]     = useState(null)
  const [travelMode, setTravelMode]   = useState('car')
  const [routes, setRoutes]           = useState([])
  const [selected, setSelected]       = useState(0)
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState('')
  const [showSteps, setShowSteps]     = useState(false)

  async function handleRoute() {
    if (!originCoord || !destCoord) { setError('Lütfen başlangıç ve bitiş noktasını listeden seçin.'); return }
    setError(''); setLoading(true); setRoutes([]); setShowSteps(false)
    try {
      const result = await onGetRoute(
        [originCoord.lon, originCoord.lat],
        [destCoord.lon,   destCoord.lat],
        travelMode
      )
      if (!result) { setError('Rota bulunamadı.'); return }
      setRoutes(result); setSelected(0)
    } catch (e) {
      setError('Sunucuya ulaşılamadı. Tekrar deneyin.')
      console.error('[Routing]', e)
    } finally { setLoading(false) }
  }

  function handleSelect(idx) { setSelected(idx); onSelectRoute(idx); setShowSteps(false) }

  function handleUseLocation() {
    if (!navigator.geolocation) { setError('Konum servisi desteklenmiyor'); return }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const { longitude: lon, latitude: lat } = coords
        setOriginCoord({ lon, lat, name: 'Konumunuz' })
        setOrigin('Konumunuz')
        setError('')
      },
      () => setError('Konum alınamadı — izin vermeniz gerekiyor')
    )
  }

  function handleClear() {
    setOrigin(''); setDest('')
    setOriginCoord(null); setDestCoord(null)
    setRoutes([]); setSelected(0); setError(''); setShowSteps(false)
    onClearRoute()
  }

  function handleSwap() {
    setOrigin(dest); setDest(origin)
    setOriginCoord(destCoord); setDestCoord(originCoord)
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
            <i className={`ti ${m.icon}`} aria-hidden="true" />
            {m.label}
          </button>
        ))}
      </div>

      {/* Inputlar */}
      <div className={styles.inputs}>
        <div className={styles.inputRow}>
          <div className={styles.dot} style={{ background: '#4d8ef5' }}>A</div>
          <div className={styles.inputWrap}>
            <AutocompleteInput
              placeholder="Başlangıç noktası..."
              value={origin}
              onChange={setOrigin}
              onSelect={(r) => { setOriginCoord(r); setOrigin(r.name) }}
            />
          </div>
          <button
            className={styles.locBtn}
            onClick={handleUseLocation}
            title="Konumumu kullan"
            aria-label="Konumumu kullan"
          >
            <i className="ti ti-current-location" />
          </button>
        </div>

        <button className={styles.swapBtn} onClick={handleSwap} aria-label="Ters çevir">
          <i className="ti ti-arrows-exchange" aria-hidden="true" />
        </button>

        <div className={styles.inputRow}>
          <div className={styles.dot} style={{ background: '#f55f5f' }}>B</div>
          <div className={styles.inputWrap}>
            <AutocompleteInput
              placeholder="Bitiş noktası..."
              value={dest}
              onChange={setDest}
              onSelect={(r) => { setDestCoord(r); setDest(r.name) }}
              onEnter={handleRoute}
            />
          </div>
        </div>
      </div>

      {/* Butonlar */}
      <div className={styles.actions}>
        <button className={styles.routeBtn} onClick={handleRoute} disabled={loading}>
          {loading
            ? <><span className={styles.spin} /> Hesaplanıyor...</>
            : <><i className="ti ti-route" aria-hidden="true" style={{ marginRight: 6 }} />Rota Bul</>
          }
        </button>
        {routes.length > 0 && (
          <button className={styles.clearBtn} onClick={handleClear} aria-label="Temizle">
            <i className="ti ti-x" aria-hidden="true" />
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
                  <i className="ti ti-clock" aria-hidden="true" /> {formatDuration(r.durationMin)}
                  &nbsp;&nbsp;
                  <i className="ti ti-road" aria-hidden="true" /> {r.distanceKm} km
                </span>
              </div>
              {i === selected && <i className="ti ti-check" aria-hidden="true" style={{ color: ROUTE_COLORS[i], fontSize: 16 }} />}
            </button>
          ))}
        </div>
      )}

      {/* Adım adım talimatlar */}
      {currentRoute?.steps?.length > 0 && (
        <div className={styles.stepsSection}>
          <button
            className={styles.stepsToggle}
            onClick={() => setShowSteps((v) => !v)}
          >
            <i className={`ti ${showSteps ? 'ti-chevron-up' : 'ti-chevron-down'}`} aria-hidden="true" />
            Adım adım talimatlar ({currentRoute.steps.length})
          </button>

          {showSteps && (
            <div className={styles.stepsList}>
              {currentRoute.steps.map((step, i) => (
                <div key={i} className={styles.stepItem}>
                  <div className={styles.stepIcon}>
                    <i className={`ti ${step.icon}`} aria-hidden="true" />
                  </div>
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
