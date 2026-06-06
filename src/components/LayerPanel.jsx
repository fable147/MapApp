import React, { useState, useRef } from 'react'
import { LAYER_COLORS, readGeoJsonFile } from '../hooks/useLayerManager'
import styles from './LayerPanel.module.css'

export default function LayerPanel({ layers, onAdd, onRemove, onToggle, onChangeColor }) {
  const [dragging, setDragging] = useState(false)
  const [error,    setError]    = useState(null)
  const [loading,  setLoading]  = useState(false)
  const fileInputRef = useRef(null)

  async function handleFiles(files) {
    const file = files[0]
    if (!file) return
    if (!file.name.match(/\.(geojson|json)$/i)) {
      setError('Sadece .geojson veya .json dosyaları kabul edilir')
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
      {/* Drop zone */}
      <div
        className={`${styles.dropZone} ${dragging ? styles.over : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <i className="ti ti-file-upload" style={{ fontSize: 24, color: 'var(--t3)' }} />
        <span className={styles.dropText}>
          {loading ? 'Yükleniyor…' : 'GeoJSON sürükle veya tıkla'}
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

      {/* Layer list */}
      {layers.length === 0
        ? <div className={styles.empty}>Henüz katman eklenmedi</div>
        : (
          <ul className={styles.list}>
            {layers.map((layer) => (
              <li key={layer.id} className={styles.item}>
                <button
                  className={styles.visBtn}
                  onClick={() => onToggle(layer.id)}
                  title={layer.visible ? 'Gizle' : 'Göster'}
                >
                  <i className={`ti ${layer.visible ? 'ti-eye' : 'ti-eye-off'}`} />
                </button>

                <div
                  className={styles.colorDot}
                  style={{ background: layer.color }}
                />

                <span className={styles.layerName} title={layer.name}>
                  {layer.name}
                </span>

                {/* Color swatches */}
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
                  title="Katmanı sil"
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
