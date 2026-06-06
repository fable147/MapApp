import React, { useState } from 'react'
import styles from './DiscoverPanel.module.css'
import { TOURIST_CATEGORIES } from '../hooks/useTouristSpots'
import { FOOD_CATEGORIES } from '../hooks/useRestaurants'
import { useLanguage } from '../contexts/LanguageContext'

const VIEW_IDS = [
  { id: 'tourist', icon: 'ti-star',           labelKey: 'discover.tourist' },
  { id: 'food',    icon: 'ti-tools-kitchen-2', labelKey: 'discover.food' },
]

function distLabel(m) {
  if (!m) return ''
  return m < 1000 ? `${m} m` : `${(m / 1000).toFixed(1)} km`
}

export default function DiscoverPanel({
  spots, spotsLoading, spotsError, spotsActiveCategory,
  onSearchTourist, onClearSpots, onSpotClick,
  places, placesLoading, placesError, placesActiveCategory,
  onSearchFood, onClearRestaurants, onPlaceClick,
}) {
  const { t } = useLanguage()
  const [view, setView] = useState('tourist')

  const isTourist   = view === 'tourist'
  const isLoading   = isTourist ? spotsLoading        : placesLoading
  const error       = isTourist ? spotsError          : placesError
  const activeCat   = isTourist ? spotsActiveCategory : placesActiveCategory
  const categories  = isTourist ? TOURIST_CATEGORIES  : FOOD_CATEGORIES
  const items       = isTourist ? spots                : places
  const onSearch    = isTourist ? onSearchTourist      : onSearchFood
  const onClear     = isTourist ? onClearSpots         : onClearRestaurants
  const onItemClick = isTourist ? onSpotClick          : onPlaceClick
  const prefix      = isTourist ? 'tourist'            : 'food'

  return (
    <div className={styles.wrap}>
      {/* Sub-tab toggle */}
      <div className={styles.viewBar}>
        {VIEW_IDS.map((v) => (
          <button
            key={v.id}
            className={`${styles.viewBtn} ${view === v.id ? styles.viewActive : ''}`}
            onClick={() => setView(v.id)}
          >
            <i className={`ti ${v.icon}`} />
            {t(v.labelKey)}
          </button>
        ))}
      </div>

      {/* Category buttons */}
      <div className={styles.top}>
        <div className={styles.grid}>
          {categories.map((cat) => (
            <button
              key={cat.id}
              className={`${styles.catBtn} ${activeCat === cat.id ? styles.catActive : ''}`}
              style={{ '--cc': cat.color }}
              onClick={() => onSearch(cat)}
              disabled={isLoading}
            >
              <i className={`ti ${cat.icon}`} style={activeCat === cat.id ? { color: cat.color } : undefined} />
              {t(`${prefix}.${cat.id}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <div className={styles.results}>
        {isLoading && (
          <div className={styles.resHeader}>
            <span className={styles.spinner} /> {t('discover.loading')}
          </div>
        )}

        {error && !isLoading && (
          <div className={styles.errorMsg}>
            <i className="ti ti-alert-circle" /> {error}
          </div>
        )}

        {items.length > 0 && !isLoading && (
          <>
            <div className={styles.resHeader}>
              <span>{items.length} {t('discover.found')}</span>
              <button className={styles.clearBtn} onClick={onClear}>
                <i className="ti ti-x" /> {t('discover.clear')}
              </button>
            </div>
            <ul className={styles.list}>
              {items.map((item) => (
                <li key={item.id} className={styles.item} onClick={() => onItemClick(item)}>
                  <div className={styles.itemName}>{item.name}</div>
                  <div className={styles.itemMeta}>
                    {!!item.distance && <span className={styles.chip}>{distLabel(item.distance)}</span>}
                    {item.cuisine  && <span className={styles.chip}>{item.cuisine}</span>}
                    {item.opening  && <span className={styles.chip}><i className="ti ti-clock" /> {item.opening}</span>}
                  </div>
                  {item.address && <div className={styles.itemAddr}>{item.address}</div>}
                </li>
              ))}
            </ul>
          </>
        )}

        {!isLoading && items.length === 0 && !error && (
          <div className={styles.empty}>
            <i className={`ti ${isTourist ? 'ti-map-2' : 'ti-tools-kitchen-2'}`} />
            <span>{t('discover.empty')}</span>
          </div>
        )}
      </div>
    </div>
  )
}
