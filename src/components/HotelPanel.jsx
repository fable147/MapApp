import React from 'react'
import styles from './HotelPanel.module.css'
import { useLanguage } from '../contexts/LanguageContext'

function Stars({ count }) {
  if (!count) return null
  return <span className={styles.stars}>{'⭐'.repeat(count)}</span>
}

function distLabel(m) {
  return m < 1000 ? `${m} m` : `${(m / 1000).toFixed(1)} km`
}

export default function HotelPanel({ hotels, loading, error, onSearch, onClear, onItemClick, onRouteToHotel }) {
  const { t } = useLanguage()

  return (
    <div className={styles.wrap}>
      <div className={styles.top}>
        <button className={styles.searchBtn} onClick={onSearch} disabled={loading}>
          {loading
            ? <><span className={styles.spinner} />{t('hotel.searching')}</>
            : <><i className="ti ti-search" /> {t('hotel.searchBtn')}</>}
        </button>
        <div className={styles.hint}>
          <i className="ti ti-info-circle" />
          {t('hotel.hint')}
        </div>
      </div>

      {error && (
        <div className={styles.error}>
          <i className="ti ti-alert-circle" />
          {error}
        </div>
      )}

      {hotels.length > 0 && (
        <>
          <div className={styles.resHeader}>
            <span>{hotels.length} {t('hotel.found')}</span>
            <button className={styles.clearBtn} onClick={onClear}>
              <i className="ti ti-x" /> {t('hotel.clear')}
            </button>
          </div>
          <ul className={styles.list}>
            {hotels.map((h) => (
              <li key={h.id} className={styles.item} onClick={() => onItemClick(h)}>
                <div className={styles.itemRow}>
                  <span className={styles.itemName}>{h.name}</span>
                  <span className={styles.itemDist}>{distLabel(h.distance)}</span>
                </div>
                <div className={styles.itemMeta}>
                  <span className={styles.typeTag}>{h.type}</span>
                  <Stars count={h.stars} />
                  {h.website && (
                    <a
                      href={h.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.web}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <i className="ti ti-world" />
                    </a>
                  )}
                  <button
                    className={styles.routeBtn}
                    onClick={(e) => { e.stopPropagation(); onRouteToHotel?.(h) }}
                    title={t('hotel.route')}
                  >
                    <i className="ti ti-car" /> {t('hotel.route')}
                  </button>
                </div>
                {h.address && <div className={styles.itemAddr}>{h.address}</div>}
              </li>
            ))}
          </ul>
        </>
      )}

      {!loading && hotels.length === 0 && !error && (
        <div className={styles.empty}>
          <i className="ti ti-building-hotel" style={{ fontSize: 28, opacity: 0.25 }} />
          <span>{t('hotel.empty')}</span>
        </div>
      )}
    </div>
  )
}
