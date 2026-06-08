import React from 'react'
import styles from './WeatherLegend.module.css'
import { useLanguage } from '../contexts/LanguageContext'

const LEGENDS = {
  precipitation_new: {
    gradient: 'linear-gradient(to right, rgba(200,240,255,0), #c8f0ff, #64b4ff, #0064ff, #6400ff)',
    stops: ['0', '0.1', '0.5', '2', '10'],
    unit: 'mm/h',
  },
  temp_new: {
    gradient: 'linear-gradient(to right, #9600c8, #0000c8, #0064ff, #00c8ff, #00ff96, #c8ff00, #ffff00, #ffc800, #ff6400, #ff0000)',
    stops: ['-40°', '0°', '20°', '40°'],
    unit: '°C',
  },
  wind_new: {
    gradient: 'linear-gradient(to right, rgba(150,255,220,0.2), #96ffdc, #64c8ff, #ffff64, #ff9600, #ff0000)',
    stops: ['0', '5', '15', '30', '50'],
    unit: 'm/s',
  },
  clouds_new: {
    gradient: 'linear-gradient(to right, rgba(255,255,255,0.05), #c8d8e8, #8c9cb0, #3c4a56)',
    stops: ['0%', '25%', '50%', '100%'],
    unit: '',
  },
}

export default function WeatherLegend({ activeLayer }) {
  const { t } = useLanguage()
  if (!activeLayer) return null
  const legend = LEGENDS[activeLayer]
  if (!legend) return null

  return (
    <div className={styles.wrap}>
      <div className={styles.title}>
        {t(`weather.${activeLayer}`)}
        {legend.unit && <span className={styles.unit}>{legend.unit}</span>}
      </div>
      <div className={styles.bar} style={{ background: legend.gradient }} />
      <div className={styles.labels}>
        {legend.stops.map((s, i) => (
          <span key={i}>{s}</span>
        ))}
      </div>
    </div>
  )
}
