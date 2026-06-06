import React from 'react'
import { POI_CATEGORIES } from '../hooks/usePoi'
import styles from './PoiPanel.module.css'
import { useLanguage } from '../contexts/LanguageContext'

export default function PoiPanel({
  onSearch, onClear, onItemClick,
  poiList, loading, error, activeCategory,
}) {
  const { t } = useLanguage()

  return (
    <div className={styles.wrap}>
      <div className={styles.top}>
        <div className={styles.hint}>
          <i className="ti ti-info-circle" />
          {t('poi.hint')}
        </div>
        <div className={styles.grid}>
          {POI_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              className={`${styles.catBtn} ${activeCategory === cat.id ? styles.active : ''}`}
              style={{ '--cc': cat.color }}
              onClick={() => onSearch(cat)}
              title={t(`poi.${cat.id}`)}
            >
              <i className={`ti ${cat.icon}`} style={{ color: cat.color }} />
              {t(`poi.${cat.id}`)}
            </button>
          ))}
        </div>
      </div>

      {(loading || error || poiList.length > 0) && (
        <div className={styles.results}>
          <div className={styles.resHeader}>
            {loading
              ? <><span className={styles.spinner} /> {t('poi.loading')}</>
              : <span>{poiList.length} {t('poi.results')}</span>
            }
            <button className={styles.clearBtn} onClick={onClear}>
              <i className="ti ti-x" /> {t('poi.clear')}
            </button>
          </div>

          {error && <div className={styles.error}><i className="ti ti-alert-circle" /> {error}</div>}

          <ul className={styles.list}>
            {poiList.map((item) => (
              <li key={item.id} className={styles.item} onClick={() => onItemClick(item)}>
                <div className={styles.itemName}>{item.name}</div>
                {item.address && <div className={styles.itemAddr}>{item.address}</div>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
