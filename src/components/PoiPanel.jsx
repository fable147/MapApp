import React from 'react'
import { POI_CATEGORIES } from '../hooks/usePoi'
import styles from './PoiPanel.module.css'

export default function PoiPanel({
  onSearch, onClear, onItemClick,
  poiList, loading, error, activeCategory,
}) {
  return (
    <div className={styles.wrap}>
      <div className={styles.top}>
        <div className={styles.hint}>
          <i className="ti ti-info-circle" />
          Harita merkezinin 1.5 km çevresinde arar
        </div>
        <div className={styles.grid}>
          {POI_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              className={`${styles.catBtn} ${activeCategory === cat.id ? styles.active : ''}`}
              style={{ '--cc': cat.color }}
              onClick={() => onSearch(cat)}
              title={cat.label}
            >
              <i className={`ti ${cat.icon}`} style={{ color: cat.color }} />
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {(loading || error || poiList.length > 0) && (
        <div className={styles.results}>
          <div className={styles.resHeader}>
            {loading
              ? <><span className={styles.spinner} /> Aranıyor…</>
              : <span>{poiList.length} sonuç</span>
            }
            <button className={styles.clearBtn} onClick={onClear}>
              <i className="ti ti-x" /> Temizle
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
