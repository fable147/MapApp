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

const TOOLS = [
  { id: 'pan',     icon: 'ti-hand-move',    label: 'Gezin' },
  { id: 'pin',     icon: 'ti-map-pin',       label: 'Pin Koy' },
  { id: 'draw',    icon: 'ti-pencil',         label: 'Çiz' },
  { id: 'measure', icon: 'ti-ruler-measure',  label: 'Ölç' },
  { id: 'polygon', icon: 'ti-polygon',        label: 'Alan' },
]

const TABS = [
  { id: 'map',      icon: 'ti-layers',         label: 'Harita' },
  { id: 'nav',      icon: 'ti-route',          label: 'Navigasyon' },
  { id: 'discover', icon: 'ti-compass',        label: 'Keşfet' },
  { id: 'poi',      icon: 'ti-radar',          label: 'Yakın' },
  { id: 'hotels',   icon: 'ti-bed',            label: 'Oteller' },
  { id: 'layers',   icon: 'ti-stack-2',        label: 'Katmanlar' },
]

const MOB_TABS = [
  { id: 'map',    icon: 'ti-layers',    label: 'Harita' },
  { id: 'nav',    icon: 'ti-route',     label: 'Navigasyon' },
  { id: 'poi',    icon: 'ti-radar',     label: 'Yakın' },
  { id: 'layers', icon: 'ti-stack-2',   label: 'Katmanlar' },
  { id: 'close',  icon: 'ti-x',         label: 'Kapat' },
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
}) {
  const [tab, setTab]   = useState('map')
  const [loc1, setLoc1] = useState('')
  const [loc2, setLoc2] = useState('')

  function handleCalc() { onCalcDistance(loc1.trim(), loc2.trim()) }

  const sidebarClass = `${styles.sidebar} ${isOpen ? styles.open : ''}`

  return (
    <>
      {/* Sidebar gövdesi */}
      <aside className={sidebarClass}>
        {/* Desktop logo */}
        <div className={styles.logo}>
          <div className={styles.logoIcon}>
            <i className="ti ti-map-2" aria-hidden="true" />
          </div>
          <div>
            <div className={styles.logoText}>MapApp</div>
            <div className={styles.logoSub}>Harita Uygulaması</div>
          </div>
        </div>

        {/* Desktop tab bar */}
        <div className={styles.tabBar}>
          {TABS.map((t) => (
            <button
              key={t.id}
              className={`${styles.tabBtn} ${tab === t.id ? styles.tabActive : ''}`}
              onClick={() => setTab(t.id)}
            >
              <i className={`ti ${t.icon}`} aria-hidden="true" />
              {t.label}
            </button>
          ))}
        </div>

        {/* Harita sekmesi */}
        {tab === 'map' && <>
          <div className={styles.section}>
            <div className={styles.secTitle}>Araçlar</div>
            <div className={styles.toolGrid}>
              {TOOLS.map((t) => (
                <button
                  key={t.id}
                  className={`${styles.toolBtn} ${mode === t.id ? styles.active : ''}`}
                  onClick={() => onModeChange(t.id)}
                >
                  <i className={`ti ${t.icon}`} aria-hidden="true" />
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.section}>
            <div className={styles.secTitle}>Altlık</div>
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
            <div className={styles.secTitle}>Mesafe Ölç</div>
            <AutocompleteInput
              placeholder="Başlangıç noktası..."
              value={loc1}
              onChange={setLoc1}
              onSelect={(r) => setLoc1(r.name)}
              onEnter={() => document.getElementById('loc2-inp')?.focus()}
            />
            <AutocompleteInput
              id="loc2-inp"
              placeholder="Bitiş noktası..."
              value={loc2}
              onChange={setLoc2}
              onSelect={(r) => { setLoc2(r.name); if (loc1.trim()) onCalcDistance(loc1.trim(), r.name) }}
              onEnter={handleCalc}
            />
            <button className={styles.calcBtn} onClick={handleCalc}>
              <i className="ti ti-calculator" aria-hidden="true"
                style={{ fontSize: 14, verticalAlign: '-2px', marginRight: 5 }} />
              Hesapla
            </button>
            {distResult && (
              <div className={styles.distResult}>
                <span className={styles.distKm}>{distResult.km} km</span>
                <span className={styles.distLabel}>{distResult.label}</span>
              </div>
            )}
          </div>

          <div className={styles.pinHeader}>
            <span className={styles.secTitle} style={{ marginBottom: 0 }}>Pinler</span>
            <span className={styles.pinCount}>{pins.length}</span>
          </div>
          <PinList pins={pins} onPinClick={onPinClick} onPinDelete={onPinDelete} />
        </>}

        {/* Navigasyon sekmesi */}
        {tab === 'nav' && <>
          <div className={styles.navInfo}>
            <i className="ti ti-info-circle" aria-hidden="true" style={{ flexShrink: 0 }} />
            OSRM ile ücretsiz yol tarifi.
          </div>
          <RoutingPanel
            onGetRoute={onGetRoute}
            onClearRoute={onClearRoute}
            onSelectRoute={onSelectRoute}
          />
        </>}

        {/* Keşfet sekmesi */}
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

        {/* Yakın sekmesi */}
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

        {/* Oteller sekmesi */}
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

        {/* Katmanlar sekmesi */}
        {tab === 'layers' && (
          <LayerPanel
            layers={customLayers}
            onAdd={onLayerAdd}
            onRemove={onLayerRemove}
            onToggle={onLayerToggle}
            onChangeColor={onLayerColorChange}
          />
        )}

        {/* Pinler sekmesi — sadece mobilde görünür */}
        {tab === 'pins' && <>
          <div className={styles.pinHeader}>
            <span className={styles.secTitle} style={{ marginBottom: 0 }}>Pinler</span>
            <span className={styles.pinCount}>{pins.length}</span>
          </div>
          <PinList pins={pins} onPinClick={onPinClick} onPinDelete={onPinDelete} />
        </>}
      </aside>

      {/* Mobil alt tab bar */}
      <nav className={styles.mobileTabBar}>
        {MOB_TABS.map((t) => (
          <button
            key={t.id}
            className={`${styles.mobileTabBtn} ${activeMobileTab === t.id ? styles.mobileTabActive : ''}`}
            onClick={() => {
              if (t.id === 'close') {
                onMobileTabChange(null)
              } else {
                setTab(t.id === 'pins' ? 'map' : t.id)
                if (t.id === 'pins') setTab('map')
                onMobileTabChange(t.id)
                // Pin sekmesini aç
                if (t.id === 'pins') setTab('pins')
                else if (t.id === 'map') setTab('map')
                else if (t.id === 'nav') setTab('nav')
              }
            }}
          >
            <i className={`ti ${t.icon}`} aria-hidden="true" />
            {t.label}
          </button>
        ))}
      </nav>
    </>
  )
}
