import React, { useState } from 'react'
import styles from './MapillaryViewer.module.css'

export default function MapillaryViewer({ image, loading, onClose }) {
  const [fullscreen, setFullscreen] = useState(false)
  if (!loading && !image) return null

  const dateStr = image?.capturedAt
    ? new Date(image.capturedAt).toLocaleDateString('tr-TR', {
        year: 'numeric', month: 'long', day: 'numeric',
      })
    : null

  return (
    <div className={`${styles.panel} ${fullscreen ? styles.fullscreen : ''}`}>
      <div className={styles.header}>
        <i className="ti ti-camera" aria-hidden="true" />
        <span className={styles.title}>Sokak Görünümü</span>
        {image && (
          <a
            href={`https://www.mapillary.com/app/?pKey=${image.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.extBtn}
            title="Mapillary'de aç"
            aria-label="Mapillary'de aç"
          >
            <i className="ti ti-external-link" aria-hidden="true" />
          </a>
        )}
        <button className={styles.closeBtn} onClick={onClose} aria-label="Kapat">
          <i className="ti ti-x" aria-hidden="true" />
        </button>
      </div>

      <div className={styles.imgWrap}>
        {loading && (
          <div className={styles.loaderWrap}>
            <span className={styles.spinner} aria-hidden="true" />
            <span className={styles.loaderText}>Fotoğraf aranıyor…</span>
          </div>
        )}
        {image && !loading && (
          <>
            <img
              src={image.url}
              alt="Sokak görünümü"
              className={styles.img}
              loading="lazy"
            />
            <button
              className={styles.fsBtn}
              onClick={() => setFullscreen(f => !f)}
              title={fullscreen ? 'Küçült' : 'Tam ekran'}
              aria-label={fullscreen ? 'Küçült' : 'Tam ekran'}
            >
              <i className={`ti ${fullscreen ? 'ti-minimize' : 'ti-maximize'}`} aria-hidden="true" />
            </button>
          </>
        )}
      </div>

      {image && !loading && (
        <div className={styles.footer}>
          {dateStr && (
            <span className={styles.meta}>
              <i className="ti ti-calendar" aria-hidden="true" />
              {dateStr}
            </span>
          )}
          {image.compassAngle != null && (
            <span className={styles.meta}>
              <i
                className="ti ti-navigation"
                aria-hidden="true"
                style={{ transform: `rotate(${image.compassAngle}deg)`, display: 'inline-block' }}
              />
              {Math.round(image.compassAngle)}°
            </span>
          )}
          <span className={styles.brand}>
            <i className="ti ti-camera" aria-hidden="true" />
            Mapillary
          </span>
        </div>
      )}
    </div>
  )
}
