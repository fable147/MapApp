import React, { useState } from 'react'
import styles from './Sidebar.module.css'
import { MAP_STYLES } from '../utils/constants'
import PinList from './PinList'
import AutocompleteInput from './AutocompleteInput'
import RoutingPanel from './RoutingPanel'
import PoiPanel from './PoiPanel'
import LayerPanel from './LayerPanel'
import HotelPanel from './HotelPanel'
import DiscoverPanel from './DiscoverPanel'
import { useLanguage } from '../contexts/LanguageContext'

const TOOL_IDS = [
  { id: 'pan',     icon: 'ti-hand-move',   labelKey: 'tool.pan' },
  { id: 'pin',     icon: 'ti-map-pin',      labelKey: 'tool.pin' },
  { id: 'draw',    icon: 'ti-pencil',        labelKey: 'tool.draw' },
  { id: 'measure', icon: 'ti-ruler-measure', labelKey: 'tool.measure' },
  { id: 'polygon', icon: 'ti-polygon',       labelKey: 'tool.polygon' },
]

const TAB_IDS = [
  { id: 'map',      icon: 'ti-layers',  labelKey: 'tab.map' },
  { id: 'nav',      icon: 'ti-route',   labelKey: 'tab.nav' },
  { id: 'discover', icon: 'ti-compass', labelKey: 'tab.discover' },
  { id: 'poi',      icon: 'ti-radar',   labelKey: 'tab.poi' },
  { id: 'hotels',   icon: 'ti-bed',     labelKey: 'tab.hotels' },
  { id: 'layers',   icon: 'ti-stack-2', labelKey: 'tab.layers' },
]

const MOB_TAB_IDS = [
  { id: 'map',    icon: 'ti-layers',  labelKey: 'mob.map' },
  { id: 'nav',    icon: 'ti-route',   labelKey: 'mob.nav' },
  { id: 'poi',    icon: 'ti-radar',   labelKey: 'mob.poi' },
  { id: 'layers', icon: 'ti-stack-2', labelKey: 'mob.layers' },
  { id: 'close',  icon: 'ti-x',       labelKey: 'mob.close' },
]

export default function Sidebar({
  mode, onModeChange,
  currentStyle, onStyleChange,
  pins, onPinClick, onPinDelete,
  onCalcDistance, distResult,
  onGetRoute, onClearRoute, onSelectRoute,
  isOpen, onMobileTabChange, activeMobileTab,
  poiList, poiLoading, poiError, poiActiveCategory,
  onPoiSearch, onPoiClear, onPoiItemClick,
  customLayers, onLayerAdd, onLayerRemove, onLayerToggle, onLayerColorChange,
  hotels, hotelLoading, hotelError,
  onHotelSearch, onHotelClear, onHotelItemClick, onHotelRouteToHotel,
  spots, spotsLoading, spotsError, spotsActiveCategory,
  onSearchTourist, onClearSpots, onSpotClick,
  places, placesLoading, placesError, placesActiveCategory,
  onSearchFood, onClearRestaurants, onPlaceClick,
  flowOn, onTrafficFlow, incOn, onTrafficIncidents,
  activeWeatherLayer, onWeatherLayer,
}) {
  const { t, toggleLang } = useLanguage()
  const [tab, setTab]   = useState('map')
  const [loc1, setLoc1] = useState('')
  const [loc2, setLoc2] = useState('')

  function handleCalc() { onCalcDistance(loc1.trim(), loc2.trim()) }

  const sidebarClass = `${styles.sidebar} ${isOpen ? styles.open : ''}`

  return (
    <>
      <aside className={sidebarClass}>
        {/* Mobil kapama handle'ı — tıklayarak veya dışarı tıklayarak kapatılır */}
        <div className={styles.mobileHandle} onClick={() => onMobileTabChange(null)} aria-hidden="true">
          <div className={styles.handleBar} />
        </div>

        {/* Desktop logo */}
        <div className={styles.logo}>
          <div className={styles.logoIcon}>
            <i className="ti ti-map-2" aria-hidden="true" />
          </div>
          <div className={styles.logoMeta}>
            <div className={styles.logoText}>MapApp</div>
            <div className={styles.logoSub}>{t('logo.sub')}</div>
          </div>
          <button className={styles.langBtn} onClick={toggleLang} title="Switch language">
            {t('lang.switch')}
          </button>
        </div>

        {/* Desktop tab bar */}
        <div className={styles.tabBar}>
          {TAB_IDS.map((tb) => (
            <button
              key={tb.id}
              className={`${styles.tabBtn} ${tab === tb.id ? styles.tabActive : ''}`}
              onClick={() => setTab(tb.id)}
            >
              <i className={`ti ${tb.icon}`} aria-hidden="true" />
              {t(tb.labelKey)}
            </button>
          ))}
        </div>

        {/* Harita / Map sekmesi */}
        {tab === 'map' && <>
          <div className={styles.section}>
            <div className={styles.secTitle}>{t('section.tools')}</div>
            <div className={styles.toolGrid}>
              {TOOL_IDS.map((tl) => (
                <button
                  key={tl.id}
                  className={`${styles.toolBtn} ${mode === tl.id ? styles.active : ''}`}
                  onClick={() => onModeChange(tl.id)}
                >
                  <i className={`ti ${tl.icon}`} aria-hidden="true" />
                  {t(tl.labelKey)}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.section}>
            <div className={styles.secTitle}>{t('section.basemap')}</div>
            <div className={styles.styleGrid}>
              {Object.entries(MAP_STYLES).map(([key, val]) => (
                <button
                  key={key}
                  className={`${styles.styleBtn} ${currentStyle === key ? styles.active : ''}`}
                  onClick={() => onStyleChange(key)}
                >
                  {val.label}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.section}>
            <div className={styles.secTitle}>{t('section.distance')}</div>
            <AutocompleteInput
              placeholder={t('dist.from')}
              value={loc1}
              onChange={setLoc1}
              onSelect={(r) => setLoc1(r.name)}
              onEnter={() => document.getElementById('loc2-inp')?.focus()}
            />
            <AutocompleteInput
              id="loc2-inp"
              placeholder={t('dist.to')}
              value={loc2}
              onChange={setLoc2}
              onSelect={(r) => { setLoc2(r.name); if (loc1.trim()) onCalcDistance(loc1.trim(), r.name) }}
              onEnter={handleCalc}
            />
            <button className={styles.calcBtn} onClick={handleCalc}>
              <i className="ti ti-calculator" aria-hidden="true"
                style={{ fontSize: 14, verticalAlign: '-2px', marginRight: 5 }} />
              {t('dist.calc')}
            </button>
            {distResult && (
              <div className={styles.distResult}>
                <span className={styles.distKm}>{distResult.km} km</span>
                <span className={styles.distLabel}>{distResult.label}</span>
              </div>
            )}
          </div>

          <div className={styles.pinHeader}>
            <span className={styles.secTitle} style={{ marginBottom: 0 }}>{t('section.pins')}</span>
            <span className={styles.pinCount}>{pins.length}</span>
          </div>
          <PinList pins={pins} onPinClick={onPinClick} onPinDelete={onPinDelete} />
        </>}

        {/* Navigasyon / Route sekmesi */}
        {tab === 'nav' && <>
          <div className={styles.navInfo}>
            <i className="ti ti-info-circle" aria-hidden="true" style={{ flexShrink: 0 }} />
            {t('dist.navInfo')}
          </div>
          <RoutingPanel
            onGetRoute={onGetRoute}
            onClearRoute={onClearRoute}
            onSelectRoute={onSelectRoute}
          />
        </>}

        {/* Keşfet / Discover sekmesi */}
        {tab === 'discover' && (
          <DiscoverPanel
            spots={spots}
            spotsLoading={spotsLoading}
            spotsError={spotsError}
            spotsActiveCategory={spotsActiveCategory}
            onSearchTourist={onSearchTourist}
            onClearSpots={onClearSpots}
            onSpotClick={onSpotClick}
            places={places}
            placesLoading={placesLoading}
            placesError={placesError}
            placesActiveCategory={placesActiveCategory}
            onSearchFood={onSearchFood}
            onClearRestaurants={onClearRestaurants}
            onPlaceClick={onPlaceClick}
          />
        )}

        {/* Yakın / Nearby sekmesi */}
        {tab === 'poi' && (
          <PoiPanel
            onSearch={onPoiSearch}
            onClear={onPoiClear}
            onItemClick={onPoiItemClick}
            poiList={poiList}
            loading={poiLoading}
            error={poiError}
            activeCategory={poiActiveCategory}
          />
        )}

        {/* Oteller / Hotels sekmesi */}
        {tab === 'hotels' && (
          <HotelPanel
            hotels={hotels}
            loading={hotelLoading}
            error={hotelError}
            onSearch={onHotelSearch}
            onClear={onHotelClear}
            onItemClick={onHotelItemClick}
            onRouteToHotel={onHotelRouteToHotel}
          />
        )}

        {/* Katmanlar / Layers sekmesi */}
        {tab === 'layers' && (
          <LayerPanel
            layers={customLayers}
            onAdd={onLayerAdd}
            onRemove={onLayerRemove}
            onToggle={onLayerToggle}
            onChangeColor={onLayerColorChange}
            flowOn={flowOn}
            onTrafficFlow={onTrafficFlow}
            incOn={incOn}
            onTrafficIncidents={onTrafficIncidents}
            activeWeatherLayer={activeWeatherLayer}
            onWeatherLayer={onWeatherLayer}
          />
        )}

        {/* Pinler sekmesi — sadece mobilde */}
        {tab === 'pins' && <>
          <div className={styles.pinHeader}>
            <span className={styles.secTitle} style={{ marginBottom: 0 }}>{t('section.pins')}</span>
            <span className={styles.pinCount}>{pins.length}</span>
          </div>
          <PinList pins={pins} onPinClick={onPinClick} onPinDelete={onPinDelete} />
        </>}
      </aside>

      {/* Mobil alt tab bar */}
      <nav className={styles.mobileTabBar}>
        {MOB_TAB_IDS.map((tb) => (
          <button
            key={tb.id}
            className={`${styles.mobileTabBtn} ${activeMobileTab === tb.id ? styles.mobileTabActive : ''}`}
            onClick={() => {
              if (tb.id === 'close') {
                onMobileTabChange(null)
              } else {
                setTab(tb.id)
                onMobileTabChange(tb.id)
              }
            }}
          >
            <i className={`ti ${tb.icon}`} aria-hidden="true" />
            {t(tb.labelKey)}
          </button>
        ))}
      </nav>

      {/* Mobil backdrop — sidebar açıkken dışarıya tıklayınca kapanır */}
      {isOpen && (
        <div
          className={styles.backdrop}
          onClick={() => onMobileTabChange(null)}
          aria-hidden="true"
        />
      )}
    </>
  )
}
