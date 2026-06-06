import React, { useState, useRef } from 'react'
import { LAYER_COLORS, readGeoJsonFile } from '../hooks/useLayerManager'
import styles from './LayerPanel.module.css'
import { useLanguage } from '../contexts/LanguageContext'

export default function LayerPanel({
  layers, onAdd, onRemove, onToggle, onChangeColor,
  flowOn, onTrafficFlow, incOn, onTrafficIncidents,
}) {
  const { t } = useLanguage()
  const [dragging, setDragging] = useState(false)
  const [error,    setError]    = useState(null)
  const [loading,  setLoading]  = useState(false)
  const fileInputRef = useRef(null)

  async function handleFiles(files) {
    const file = files[0]
    if (!file) return
    if (!file.name.match(/\.(geojson|json)$/i)) {
      setError(t('layer.onlyGeo'))
      return
    }
    setLoading(true)
    setError(null)
    try {
      const geojson = await readGeoJsonFile(file)
      const name    = file.name.replace(/\.(geojson|json)$/i, '')
      onAdd(name, geojson)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function onDrop(e) {
    e.preventDefault()
    setDragging(false)
    handleFiles(e.dataTransfer.files)
  }

  return (
    <div className={styles.wrap}>
      {/* ── Traffic overlays ── */}
      <div className={styles.trafficSection}>
        <div className={styles.trafficTitle}>
          <i className="ti ti-traffic-lights" />
          {t('traffic.section')}
        </div>

        <button
          className={`${styles.trafficBtn} ${flowOn ? styles.trafficOn : ''}`}
          onClick={onTrafficFlow}
        >
          <span className={styles.trafficDot} style={{ background: '#f55f5f' }} />
          <div className={styles.trafficInfo}>
            <span className={styles.trafficLabel}>{t('traffic.flow')}</span>
            <span className={styles.trafficSub}>{t('traffic.flowHint')}</span>
          </div>
          <div className={`${styles.toggle} ${flowOn ? styles.toggleOn : ''}`}>
            <div className={styles.toggleThumb} />
          </div>
        </button>

        <button
          className={`${styles.trafficBtn} ${incOn ? styles.trafficOn : ''}`}
          onClick={onTrafficIncidents}
        >
          <span className={styles.trafficDot} style={{ background: '#f5834d' }} />
          <div className={styles.trafficInfo}>
            <span className={styles.trafficLabel}>{t('traffic.incidents')}</span>
            <span className={styles.trafficSub}>{t('traffic.incHint')}</span>
          </div>
          <div className={`${styles.toggle} ${incOn ? styles.toggleOn : ''}`}>
            <div className={styles.toggleThumb} />
          </div>
        </button>
      </div>

      {/* ── GeoJSON drop zone ── */}
      <div
        className={`${styles.dropZone} ${dragging ? styles.over : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <i className="ti ti-file-upload" style={{ fontSize: 24, color: 'var(--t3)' }} />
        <span className={styles.dropText}>
          {loading ? t('layer.loading') : t('layer.drop')}
        </span>
        <span className={styles.dropSub}>.geojson / .json</span>
        <input
          ref={fileInputRef}
          type="file"
          accept=".geojson,.json"
          style={{ display: 'none' }}
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {error && (
        <div className={styles.error}>
          <i className="ti ti-alert-circle" /> {error}
        </div>
      )}

      {/* ── Custom layer list ── */}
      {layers.length === 0
        ? <div className={styles.empty}>{t('layer.empty')}</div>
        : (
          <ul className={styles.list}>
            {layers.map((layer) => (
              <li key={layer.id} className={styles.item}>
                <button
                  className={styles.visBtn}
                  onClick={() => onToggle(layer.id)}
                  title={layer.visible ? t('layer.hide') : t('layer.show')}
                >
                  <i className={`ti ${layer.visible ? 'ti-eye' : 'ti-eye-off'}`} />
                </button>

                <div className={styles.colorDot} style={{ background: layer.color }} />

                <span className={styles.layerName} title={layer.name}>
                  {layer.name}
                </span>

                <div className={styles.swatches}>
                  {LAYER_COLORS.map((c) => (
                    <button
                      key={c}
                      className={`${styles.swatch} ${layer.color === c ? styles.swatchActive : ''}`}
                      style={{ background: c }}
                      onClick={() => onChangeColor(layer.id, c)}
                      title={c}
                    />
                  ))}
                </div>

                <button
                  className={styles.delBtn}
                  onClick={() => onRemove(layer.id)}
                  title={t('layer.delete')}
                >
                  <i className="ti ti-trash" />
                </button>
              </li>
            ))}
          </ul>
        )
      }
    </div>
  )
}
