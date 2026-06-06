import React, { useState, useCallback } from 'react'
import styles from './MapControls.module.css'
import MapSearchBox from './MapSearchBox'
import WeatherCard from './WeatherCard'
import MiniMap from './MiniMap'
import CoordInput from './CoordInput'

export default function MapControls({
  onLocate, onFlyToTurkey, onClearAll,
  status, tipText,
  onSearchSelect,
  mapRef, currentStyle,
  weather, weatherLoading, weatherError,
  onWeatherRequest, onWeatherClose,
  theme, onToggleTheme,
  onCoordGo,
  terrainOn, onToggleTerrain,
}) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showCoordInput, setShowCoordInput] = useState(false)

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen?.()
      setIsFullscreen(false)
    }
  }, [])

  return (
    <>
      {/* Sol üst butonlar */}
      <div className={styles.controls}>
        <button className={styles.btn} onClick={onLocate} title="Konumumu bul" aria-label="Konumumu bul">
          <i className="ti ti-current-location" aria-hidden="true" />
        </button>
        <button className={styles.btn} onClick={onFlyToTurkey} title="Türkiye" aria-label="Türkiye">
          <i className="ti ti-home" aria-hidden="true" />
        </button>
        <button className={styles.btn} onClick={onClearAll} title="Temizle" aria-label="Temizle">
          <i className="ti ti-trash" aria-hidden="true" />
        </button>
        <button
          className={`${styles.btn} ${showCoordInput ? styles.btnActive : ''}`}
          onClick={() => setShowCoordInput(v => !v)}
          title="Koordinata git"
          aria-label="Koordinata git"
        >
          <i className="ti ti-crosshair" aria-hidden="true" />
        </button>
        <button className={styles.btn} onClick={toggleFullscreen} title="Tam ekran" aria-label="Tam ekran">
          <i className={`ti ${isFullscreen ? 'ti-minimize' : 'ti-maximize'}`} aria-hidden="true" />
        </button>
        <button className={styles.btn} onClick={onToggleTheme} title="Tema değiştir" aria-label="Tema değiştir">
          <i className={`ti ${theme === 'dark' ? 'ti-sun' : 'ti-moon'}`} aria-hidden="true" />
        </button>
        <button
          className={`${styles.btn} ${terrainOn ? styles.btnActive : ''}`}
          onClick={onToggleTerrain}
          title="3D Arazi"
          aria-label="3D Arazi"
        >
          <i className="ti ti-mountain" aria-hidden="true" />
        </button>
        <button
          className={`${styles.btn} ${(weather || weatherLoading) ? styles.btnActive : ''}`}
          onClick={onWeatherRequest}
          title="Hava durumu"
          aria-label="Hava durumu"
        >
          <i className="ti ti-cloud" aria-hidden="true" />
        </button>
      </div>

      {/* Üst orta — arama kutusu */}
      <MapSearchBox onSelect={onSearchSelect} />

      {/* Sağ üst — aktif mod */}
      <div className={styles.tip}>{tipText}</div>

      {/* Alt orta — status bar */}
      <div className={styles.status}>{status}</div>

      {/* Hava durumu kartı */}
      <WeatherCard
        weather={weather}
        loading={weatherLoading}
        error={weatherError}
        onClose={onWeatherClose}
      />

      {/* Koordinat girişi */}
      {showCoordInput && (
        <CoordInput
          mapRef={mapRef}
          onGo={(lng, lat) => onCoordGo?.(lng, lat)}
          onClose={() => setShowCoordInput(false)}
        />
      )}

      {/* Mini harita */}
      {mapRef && (
        <MiniMap mainMapRef={mapRef} currentStyle={currentStyle} />
      )}
    </>
  )
}
