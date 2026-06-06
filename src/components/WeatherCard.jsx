import React from 'react'
import styles from './WeatherCard.module.css'

export default function WeatherCard({ weather, loading, error, onClose }) {
  if (!weather && !loading && !error) return null

  return (
    <div className={styles.card}>
      <button className={styles.close} onClick={onClose} aria-label="Kapat">
        <i className="ti ti-x" aria-hidden="true" />
      </button>

      {loading && (
        <div className={styles.loading}>
          <span className={styles.spin} />
          <span>Hava durumu alınıyor...</span>
        </div>
      )}

      {error && (
        <div className={styles.error}>
          <i className="ti ti-alert-circle" aria-hidden="true" />
          {error}
        </div>
      )}

      {weather && !loading && (
        <>
          <div className={styles.top}>
            <i className={`ti ${weather.icon}`} aria-hidden="true" style={{ fontSize: 32, color: 'var(--accent)' }} />
            <div>
              <div className={styles.temp}>{weather.temp}°C</div>
              <div className={styles.label}>{weather.label}</div>
            </div>
          </div>

          {weather.locationName && (
            <div className={styles.location}>
              <i className="ti ti-map-pin" aria-hidden="true" />
              {weather.locationName}
            </div>
          )}

          <div className={styles.meta}>
            <div className={styles.metaItem}>
              <i className="ti ti-thermometer" aria-hidden="true" />
              <span>Hissedilen</span>
              <strong>{weather.feelsLike}°C</strong>
            </div>
            <div className={styles.metaItem}>
              <i className="ti ti-droplet" aria-hidden="true" />
              <span>Nem</span>
              <strong>%{weather.humidity}</strong>
            </div>
            <div className={styles.metaItem}>
              <i className="ti ti-wind" aria-hidden="true" />
              <span>Rüzgar</span>
              <strong>{weather.windSpeed} km/s</strong>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
