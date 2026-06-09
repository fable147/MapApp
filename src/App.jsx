import React, { useRef, useState, useCallback, useEffect } from 'react'
import { useMap } from './hooks/useMap'
import { usePins } from './hooks/usePins'
import { useRouting } from './hooks/useRouting'
import { useWeather } from './hooks/useWeather'
import { useTheme } from './hooks/useTheme'
import { useElevation } from './hooks/useElevation'
import { usePoi } from './hooks/usePoi'
import { useLayerManager, getGeoJsonBounds } from './hooks/useLayerManager'
import { useHotels } from './hooks/useHotels'
import { useTouristSpots } from './hooks/useTouristSpots'
import { useRestaurants } from './hooks/useRestaurants'
import { useTraffic } from './hooks/useTraffic'
import { useWeatherLayer } from './hooks/useWeatherLayer'
import { useLiveLocation } from './hooks/useLiveLocation'
import { useVoiceNav } from './hooks/useVoiceNav'
import { useVoiceCommand } from './hooks/useVoiceCommand'
import VoiceFeedback from './components/VoiceFeedback'
import WeatherLegend from './components/WeatherLegend'
import LiveStatsHUD from './components/LiveStatsHUD'
import NavOverlay from './components/NavOverlay'
import ContextMenu from './components/ContextMenu'
import ElevationChart from './components/ElevationChart'
import { haversine, geocode, polygonAreaM2, formatArea, polygonCentroid, distToPolylineM } from './utils/geo'
import { POI_CATEGORIES } from './hooks/usePoi'
import {
  DRAW_SOURCE_ID, MEASURE_SOURCE_ID, POLYGON_SOURCE_ID,
  TURKEY_CENTER, TURKEY_ZOOM,
} from './utils/constants'
import Sidebar from './components/Sidebar'
import MapControls from './components/MapControls'
import styles from './App.module.css'

const MODE_TIPS = {
  pan:     'Gezin modu aktif',
  pin:     'Pin Koy modu — tıklayın',
  draw:    'Çizim modu — çift tıkla bitir',
  measure: 'Ölçüm modu — 2 noktaya tıkla',
  polygon: 'Alan Çiz modu — çift tıkla kapat',
}

const MODE_STATUS = {
  pan:     'Haritayı sürükleyip zoom yapabilirsiniz',
  pin:     'Haritada istediğiniz yere tıklayarak pin ekleyin',
  draw:    'Tıklayarak çizgi noktaları ekleyin • Çift tıklayarak tamamlayın',
  measure: 'İki noktaya tıklayarak aralarındaki mesafeyi ölçün',
  polygon: 'Tıklayarak köşe noktaları ekleyin • Çift tıklayarak alanı kapatın',
}

export default function App() {
  const containerRef = useRef(null)
  const [mode, setModeState] = useState('pan')
  const modeRef = useRef('pan')
  const [currentStyle, setCurrentStyle] = useState('liberty')
  const [status, setStatus] = useState('Harita hazır')
  const [distResult, setDistResult] = useState(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [activeMobileTab, setActiveMobileTab] = useState(null)

  const drawCoordsRef    = useRef([])
  const measurePointsRef = useRef([])
  const measureMarkersRef = useRef([])
  const polyRef          = useRef([])
  const areaMarkerRef    = useRef(null)

  // Rota sapma tespiti için
  const activeWaypointsRef   = useRef(null)
  const activeRouteCoordsRef = useRef(null)
  const activeTravelModeRef  = useRef('car')
  const lastRerouteRef       = useRef(0)
  const deviationStartRef    = useRef(null)

  // map click — modeRef üzerinden okur, stale closure yok
  const handleMapClick = useCallback((e) => {
    const { lng, lat } = e.lngLat
    const m = modeRef.current
    if (m === 'pin') {
      addPinRef.current?.(lng, lat)
    } else if (m === 'draw') {
      drawCoordsRef.current = [...drawCoordsRef.current, [lng, lat]]
      setGeoJsonLineRef.current?.(DRAW_SOURCE_ID, drawCoordsRef.current)
      setStatus(`Çizim: ${drawCoordsRef.current.length} nokta — çift tıklayarak bitir`)
    } else if (m === 'polygon') {
      polyRef.current = [...polyRef.current, [lng, lat]]
      const pts = polyRef.current
      if (pts.length === 1) {
        clearGeoJsonRef.current?.(POLYGON_SOURCE_ID)
        if (areaMarkerRef.current) { areaMarkerRef.current.remove(); areaMarkerRef.current = null }
      }
      if (pts.length >= 3) {
        setGeoJsonPolygonRef.current?.(POLYGON_SOURCE_ID, [...pts, pts[0]])
      }
      setStatus(`Alan: ${pts.length} köşe eklendi — çift tıklayarak kapat`)
    } else if (m === 'measure') {
      measurePointsRef.current = [...measurePointsRef.current, [lng, lat]]
      addMeasureMarkerLocal(lng, lat, measurePointsRef.current.length)
      if (measurePointsRef.current.length === 2) {
        const d = haversine(measurePointsRef.current[0], measurePointsRef.current[1])
        setGeoJsonLineRef.current?.(MEASURE_SOURCE_ID, measurePointsRef.current)
        setStatus(`Mesafe: ${d.toFixed(1)} km`)
        measurePointsRef.current = []
        setTimeout(() => {
          measureMarkersRef.current.forEach((mk) => mk.remove())
          measureMarkersRef.current = []
          clearGeoJsonRef.current?.(MEASURE_SOURCE_ID)
        }, 4000)
      } else {
        setStatus('2. noktayı işaretleyin')
      }
    }
  }, [])

  // Ref köprüleri — hook'lar henüz tanımlı değilken callback yakalanmasın
  const addPinRef            = useRef(null)
  const setGeoJsonLineRef    = useRef(null)
  const clearGeoJsonRef      = useRef(null)
  const setGeoJsonPolygonRef = useRef(null)

  const {
    mapRef, setGeoJsonLine, setGeoJsonPolygon, clearGeoJson,
    flyTo, fitBounds, changeStyle, setCursor,
    terrainOn, toggleTerrain,
    buildingsOn, toggleBuildings,
  } = useMap(containerRef, handleMapClick)

  const { pins, addPin, removePin, clearPins, focusPin } = usePins(mapRef)
  const { getRoute, selectRoute, clearRoutes, reinitLayers } = useRouting(mapRef)
  const { weather, loading: weatherLoading, error: weatherError, fetchWeather, clearWeather } = useWeather()
  const { theme, toggleTheme } = useTheme()
  const { profile, loading: elevLoading, error: elevError, fetchProfile, clearProfile } = useElevation()
  const { poiList, loading: poiLoading, error: poiError, activeCategory: poiActiveCategory,
          searchPoi, focusPoi, clearPoi } = usePoi(mapRef)
  const { layers: customLayers, addLayer, removeLayer, toggleLayer, changeColor: changeLayerColor,
          reinitLayers: reinitCustomLayers } = useLayerManager(mapRef)
  const { hotels, loading: hotelLoading, error: hotelError,
          searchHotels, clearHotels, focusHotel } = useHotels(mapRef)
  const { spots, loading: spotsLoading, error: spotsError, activeCategory: spotsActiveCategory,
          searchSpots, clearSpots, focusSpot } = useTouristSpots(mapRef)
  const { places, loading: placesLoading, error: placesError, activeCategory: placesActiveCategory,
          searchRestaurants, clearRestaurants, focusRestaurant } = useRestaurants(mapRef)
  const { flowOn, incOn, toggleFlow, toggleIncidents } = useTraffic(mapRef)
  const { activeWeatherLayer, selectWeatherLayer } = useWeatherLayer(mapRef)
  const { liveOn, toggleLive, accuracy: liveAccuracy, liveError,
          totalDistKm, elapsedSec, avgSpeedKmh, currentPos } = useLiveLocation(mapRef)
  const [routeDestCoord, setRouteDestCoord] = useState(null)
  const [navSteps,       setNavSteps]       = useState(null)
  const [navStepIdx,     setNavStepIdx]     = useState(0)

  const remainingKm = (liveOn && currentPos && routeDestCoord)
    ? haversine([currentPos.lng, currentPos.lat], [routeDestCoord.lon, routeDestCoord.lat])
    : null

  const distToNextM = (liveOn && currentPos && navSteps && navSteps[navStepIdx]?.location)
    ? haversine([currentPos.lng, currentPos.lat], navSteps[navStepIdx].location) * 1000
    : null

  const { voiceOn, toggleVoice, speak } = useVoiceNav({ navSteps, navStepIdx, distToNextM, liveOn })
  const speakRef = useRef(speak)
  useEffect(() => { speakRef.current = speak }, [speak])

  // GPS güncellenince mevcut adıma yaklaşıldıysa otomatik ilerle
  useEffect(() => {
    if (!liveOn || !currentPos || !navSteps || navStepIdx >= navSteps.length - 1) return
    const step = navSteps[navStepIdx]
    if (!step?.location) return
    const distKm = haversine([currentPos.lng, currentPos.lat], step.location)
    if (distKm * 1000 < 30) {
      setNavStepIdx((prev) => Math.min(prev + 1, navSteps.length - 1))
    }
  }, [currentPos])

  // GPS güncellenince rotadan saptı mı kontrol et; saptıysa yeniden hesapla
  useEffect(() => {
    if (!liveOn || !currentPos) { deviationStartRef.current = null; return }
    const coords    = activeRouteCoordsRef.current
    const waypoints = activeWaypointsRef.current
    if (!coords || !waypoints || waypoints.length < 2) return

    const distM = distToPolylineM([currentPos.lng, currentPos.lat], coords)
    const now   = Date.now()

    if (distM > 75) {
      if (!deviationStartRef.current) deviationStartRef.current = now
      // 3 saniye sürekli sapma + 20 saniyelik cooldown
      if (now - deviationStartRef.current > 3000 && now - lastRerouteRef.current > 20000) {
        lastRerouteRef.current    = now
        deviationStartRef.current = null
        const newWps = [[currentPos.lng, currentPos.lat], ...waypoints.slice(1)]
        setStatus('Rotadan çıkıldı — yeniden hesaplanıyor…')
        speakRef.current?.('Rotadan çıkıldı, yeniden hesaplanıyor')
        getRoute(newWps, activeTravelModeRef.current).then((routes) => {
          if (!routes) { setStatus('Yeniden rota hesaplanamadı'); return }
          activeRouteCoordsRef.current = routes[0].coords
          activeWaypointsRef.current   = newWps
          const lastWp = newWps[newWps.length - 1]
          handleRouteSuccess({ lon: lastWp[0], lat: lastWp[1] }, routes[0].steps)
          setStatus(`Rota güncellendi — ${routes[0].distanceKm} km, ${routes[0].durationMin} dk`)
          speakRef.current?.(routes[0].steps?.[0]?.label ?? 'Rota güncellendi')
        }).catch(() => setStatus('Yeniden rota hesaplanamadı'))
      }
    } else {
      deviationStartRef.current = null
    }
  }, [currentPos, liveOn])
  const fetchProfileRef = useRef(null)
  useEffect(() => { fetchProfileRef.current = fetchProfile }, [fetchProfile])
  const [contextMenu, setContextMenu] = useState(null)

  // Ref'leri güncelle
  useEffect(() => { addPinRef.current = addPin },                          [addPin])
  useEffect(() => { setGeoJsonLineRef.current = setGeoJsonLine },          [setGeoJsonLine])
  useEffect(() => { clearGeoJsonRef.current = clearGeoJson },              [clearGeoJson])
  useEffect(() => { setGeoJsonPolygonRef.current = setGeoJsonPolygon },    [setGeoJsonPolygon])

  function addMeasureMarkerLocal(lng, lat, n) {
    if (!mapRef.current) return
    const mgl = window.maplibregl
    const el = document.createElement('div')
    el.style.cssText =
      'width:22px;height:22px;background:#34d9a0;border:2px solid white;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#0e1117;font-size:11px;font-weight:700;'
    el.textContent = n
    const mk = new mgl.Marker({ element: el }).setLngLat([lng, lat]).addTo(mapRef.current)
    measureMarkersRef.current = [...measureMarkersRef.current, mk]
  }

  useEffect(() => {
    if (!mapRef.current) return
    const map = mapRef.current
    const handleDblClick = (e) => {
      if (modeRef.current === 'draw' && drawCoordsRef.current.length > 1) {
        e.preventDefault()
        const completed = [...drawCoordsRef.current]
        setStatus(`Çizim tamamlandı — ${completed.length} nokta`)
        drawCoordsRef.current = []
        setTimeout(() => clearGeoJson(DRAW_SOURCE_ID), 100)
        fetchProfileRef.current?.(completed)
      } else if (modeRef.current === 'polygon' && polyRef.current.length >= 3) {
        e.preventDefault()
        const pts = [...polyRef.current]
        polyRef.current = []
        const area  = polygonAreaM2(pts)
        const label = formatArea(area)
        const center = polygonCentroid(pts)
        setGeoJsonPolygon(POLYGON_SOURCE_ID, [...pts, pts[0]])
        if (areaMarkerRef.current) { areaMarkerRef.current.remove(); areaMarkerRef.current = null }
        const mgl = window.maplibregl
        const el  = document.createElement('div')
        el.style.cssText =
          'background:rgba(245,131,77,0.92);color:#fff;padding:4px 10px;border-radius:6px;' +
          'font-size:13px;font-weight:700;white-space:nowrap;' +
          'border:1.5px solid rgba(255,255,255,0.4);box-shadow:0 2px 8px rgba(0,0,0,.35);'
        el.textContent = label
        areaMarkerRef.current = new mgl.Marker({ element: el, anchor: 'center' })
          .setLngLat(center)
          .addTo(mapRef.current)
        setStatus(`Alan: ${label}`)
      }
    }
    map.on('dblclick', handleDblClick)
    map.on('contextmenu', handleContextMenu)
    return () => {
      map.off('dblclick', handleDblClick)
      map.off('contextmenu', handleContextMenu)
    }
  }, [clearGeoJson])

  function setMode(m) {
    modeRef.current = m
    setModeState(m)
    setCursor(m === 'pan' ? '' : 'crosshair')
    drawCoordsRef.current = []
    measurePointsRef.current = []
    measureMarkersRef.current.forEach((mk) => mk.remove())
    measureMarkersRef.current = []
    polyRef.current = []
    setStatus(MODE_STATUS[m])
  }

  function handleStyleChange(key) {
    setCurrentStyle(key)
    changeStyle(key, () => { reinitLayers(); reinitCustomLayers() })
    setStatus('Altlık değiştirildi')
  }

  async function handleGetRoute(waypoints, travelMode = 'car') {
    setStatus('Rota hesaplanıyor...')
    activeWaypointsRef.current   = waypoints
    activeTravelModeRef.current  = travelMode
    try {
      const routes = await getRoute(waypoints, travelMode)
      if (routes) {
        activeRouteCoordsRef.current = routes[0].coords
        const leg = waypoints.length > 2 ? `${waypoints.length} durak` : ''
        setStatus(`${leg ? leg + ' · ' : ''}${routes[0].distanceKm} km, ${routes[0].durationMin} dk`)
      } else {
        activeRouteCoordsRef.current = null
        setStatus('Rota bulunamadı')
      }
      return routes
    } catch (e) {
      activeRouteCoordsRef.current = null
      setStatus('Rota alınamadı')
      throw e
    }
  }

  function handleClearRoute() {
    clearRoutes()
    setRouteDestCoord(null)
    setNavSteps(null)
    setNavStepIdx(0)
    activeWaypointsRef.current   = null
    activeRouteCoordsRef.current = null
    deviationStartRef.current    = null
    setStatus('Rota temizlendi')
  }

  function handleRouteSuccess(destCoord, steps) {
    setRouteDestCoord(destCoord ?? null)
    setNavSteps(steps ?? null)
    setNavStepIdx(0)
  }

  async function handleCalcDistance(v1, v2) {
    if (!v1 || !v2) { setDistResult({ km: '—', label: 'İki konum girin' }); return }
    setDistResult({ km: '...', label: 'Hesaplanıyor' })
    try {
      const [c1, c2] = await Promise.all([geocode(v1), geocode(v2)])
      if (!c1) { setDistResult({ km: '!', label: `"${v1}" bulunamadı` }); return }
      if (!c2) { setDistResult({ km: '!', label: `"${v2}" bulunamadı` }); return }
      const d = haversine(c1, c2)
      setDistResult({ km: d.toFixed(1), label: `${v1} → ${v2}` })
      setGeoJsonLine(MEASURE_SOURCE_ID, [c1, c2])
      ;[c1, c2].forEach((c, i) => {
        const pin = addPin(c[0], c[1], i === 0 ? v1 : v2)
        pin._isDist = true
      })
      fitBounds([c1, c2])
      setStatus(`${d.toFixed(1)} km — ${v1} ile ${v2} arası`)
    } catch {
      setDistResult({ km: '!', label: 'Bağlantı hatası' })
    }
  }

  function handleClearAll() {
    clearPins()
    clearRoutes()
    drawCoordsRef.current = []
    measurePointsRef.current = []
    measureMarkersRef.current.forEach((mk) => mk.remove())
    measureMarkersRef.current = []
    clearGeoJson(DRAW_SOURCE_ID)
    clearGeoJson(MEASURE_SOURCE_ID)
    polyRef.current = []
    if (areaMarkerRef.current) { areaMarkerRef.current.remove(); areaMarkerRef.current = null }
    clearGeoJson(POLYGON_SOURCE_ID)
    setDistResult(null)
    setContextMenu(null)
    clearProfile()
    clearPoi()
    clearHotels()
    clearSpots()
    clearRestaurants()
    setStatus('Harita temizlendi')
  }

  function handleContextMenu(e) {
    e.originalEvent?.preventDefault()
    setContextMenu({ x: e.point.x, y: e.point.y, lng: e.lngLat.lng, lat: e.lngLat.lat })
  }

  async function handleWeatherRequest() {
    if (weather || weatherLoading) { clearWeather(); return }
    // Haritanın merkez koordinatını al
    const map = mapRef.current
    if (!map) return
    const center = map.getCenter()
    setStatus('Hava durumu alınıyor...')
    // Reverse geocode ile konum adı bul
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${center.lat}&lon=${center.lng}&format=json`,
        { headers: { 'Accept-Language': 'tr' } }
      )
      const data = await res.json()
      const name = data.address?.city || data.address?.town || data.address?.county || data.display_name?.split(',')[0]
      await fetchWeather(center.lat, center.lng, name)
      setStatus('Hava durumu güncellendi')
    } catch {
      await fetchWeather(center.lat, center.lng)
      setStatus('Hava durumu güncellendi')
    }
  }

  function handleTouristSearch(category) {
    const map = mapRef.current
    if (!map) return
    const { lat, lng } = map.getCenter()
    searchSpots(category, lat, lng)
    setStatus(`${category.label} aranıyor…`)
  }

  function handleFoodSearch(category) {
    const map = mapRef.current
    if (!map) return
    const { lat, lng } = map.getCenter()
    searchRestaurants(category, lat, lng)
    setStatus(`${category.label} aranıyor…`)
  }

  function handleLayerAdd(name, geojson) {
    addLayer(name, geojson)
    const bounds = getGeoJsonBounds(geojson)
    if (bounds) fitBounds(bounds, 60)
    setStatus(`"${name}" katmanı eklendi`)
  }

  function handlePoiSearch(category) {
    const map = mapRef.current
    if (!map) return
    const { lat, lng } = map.getCenter()
    searchPoi(category, lat, lng)
    setStatus(`${category.label} aranıyor…`)
  }

  function handleHotelSearch() {
    const map = mapRef.current
    if (!map) return
    const { lat, lng } = map.getCenter()
    searchHotels(lat, lng)
    setStatus('Yakındaki oteller aranıyor…')
  }

  function handleRouteToHotel(hotel) {
    if (!navigator.geolocation) { setStatus('Konum servisi desteklenmiyor'); return }
    setStatus('Konum alınıyor…')
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const { longitude: lng, latitude: lat } = coords
        setStatus('Rota hesaplanıyor…')
        try {
          const routes = await getRoute([[lng, lat], [hotel.lng, hotel.lat]])
          if (routes) setStatus(`${hotel.name} · ${routes[0].distanceKm} km, ${routes[0].durationMin} dk`)
          else setStatus('Rota bulunamadı')
        } catch {
          setStatus('Rota alınamadı')
        }
      },
      () => setStatus('Konum alınamadı — izin vermeniz gerekiyor')
    )
  }

  function handleCoordGo(lng, lat) {
    flyTo([lng, lat], 14, 1000)
    addPin(lng, lat, `${lat.toFixed(5)}, ${lng.toFixed(5)}`)
    setStatus(`${lat.toFixed(5)}, ${lng.toFixed(5)} konumuna gidildi`)
  }

  function handleCenterOnLocation() {
    if (!currentPos || !mapRef.current) return
    const map = mapRef.current
    map.flyTo({ center: [currentPos.lng, currentPos.lat], zoom: Math.max(map.getZoom(), 15), duration: 800 })
  }

  async function handleVoiceNavigate(destName) {
    setStatus(`"${destName}" aranıyor…`)
    try {
      const result = await geocode(destName)
      if (!result) { setStatus(`"${destName}" bulunamadı`); return }
      const [destLng, destLat] = result
      const start = (liveOn && currentPos)
        ? [currentPos.lng, currentPos.lat]
        : (() => { const c = mapRef.current?.getCenter(); return c ? [c.lng, c.lat] : null })()
      if (!start) return
      const routes = await handleGetRoute([start, [destLng, destLat]], 'car')
      if (routes) handleRouteSuccess({ lon: destLng, lat: destLat }, routes[0].steps)
    } catch { setStatus('Rota hesaplanamadı') }
  }

  const { listening: voiceListening, toggleListening, transcript: voiceTranscript, feedback: voiceFeedback } =
    useVoiceCommand({
      onNavigate:       handleVoiceNavigate,
      onLocate:         handleLocate,
      onClearAll:       handleClearAll,
      onClearRoute:     handleClearRoute,
      onZoomIn:         () => { const m = mapRef.current; if (m) m.zoomIn() },
      onZoomOut:        () => { const m = mapRef.current; if (m) m.zoomOut() },
      onToggleLive:     toggleLive,
      onDarkMode:       () => { if (theme !== 'dark')  toggleTheme() },
      onLightMode:      () => { if (theme !== 'light') toggleTheme() },
      onToggleBuildings: toggleBuildings,
      onFlyToTurkey:    () => { flyTo(TURKEY_CENTER, TURKEY_ZOOM, 1400); setStatus("Türkiye'ye odaklanıldı") },
      onSearchNearby:   (id) => {
        const m = mapRef.current; if (!m) return
        const cat = POI_CATEGORIES.find((c) => c.id === id)
        if (!cat) return
        const { lat, lng } = m.getCenter()
        searchPoi(cat, lat, lng)
        setStatus(`Yakın ${cat.label} aranıyor…`)
      },
    })

  function handleLocate() {
    if (!navigator.geolocation) { setStatus('Konum servisi desteklenmiyor'); return }
    setStatus('Konum alınıyor...')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { longitude: lng, latitude: lat } = pos.coords
        flyTo([lng, lat], 13)
        addPin(lng, lat, 'Benim Konum')
        setStatus('Konumunuz bulundu ve eklendi')
      },
      () => setStatus('Konum alınamadı — izin vermeniz gerekiyor')
    )
  }

  function handleMobileTab(tabId) {
    if (tabId === null) {
      setMobileOpen(false)
      setActiveMobileTab(null)
    } else {
      setMobileOpen((prev) => activeMobileTab === tabId ? !prev : true)
      setActiveMobileTab(tabId)
    }
  }

  function handlePinClick(pin) {
    focusPin(pin)
  }

  return (
    <div className={styles.app}>
      <Sidebar
        mode={mode}
        onModeChange={setMode}
        currentStyle={currentStyle}
        onStyleChange={handleStyleChange}
        pins={pins}
        onPinClick={handlePinClick}
        onPinDelete={removePin}
        onCalcDistance={handleCalcDistance}
        distResult={distResult}
        onGetRoute={handleGetRoute}
        onClearRoute={handleClearRoute}
        onSelectRoute={selectRoute}
        isOpen={mobileOpen}
        onMobileTabChange={handleMobileTab}
        activeMobileTab={activeMobileTab}
        poiList={poiList}
        poiLoading={poiLoading}
        poiError={poiError}
        poiActiveCategory={poiActiveCategory}
        onPoiSearch={handlePoiSearch}
        onPoiClear={clearPoi}
        onPoiItemClick={(item) => { flyTo([item.lng, item.lat], 17, 900); focusPoi(item) }}
        customLayers={customLayers}
        onLayerAdd={handleLayerAdd}
        onLayerRemove={removeLayer}
        onLayerToggle={toggleLayer}
        onLayerColorChange={changeLayerColor}
        hotels={hotels}
        hotelLoading={hotelLoading}
        hotelError={hotelError}
        onHotelSearch={handleHotelSearch}
        onHotelClear={clearHotels}
        onHotelItemClick={(h) => { flyTo([h.lng, h.lat], 16, 900); focusHotel(h) }}
        onHotelRouteToHotel={handleRouteToHotel}
        spots={spots}
        spotsLoading={spotsLoading}
        spotsError={spotsError}
        spotsActiveCategory={spotsActiveCategory}
        onSearchTourist={handleTouristSearch}
        onClearSpots={clearSpots}
        onSpotClick={(s) => { flyTo([s.lng, s.lat], 17, 900); focusSpot(s) }}
        places={places}
        placesLoading={placesLoading}
        placesError={placesError}
        placesActiveCategory={placesActiveCategory}
        onSearchFood={handleFoodSearch}
        onClearRestaurants={clearRestaurants}
        onPlaceClick={(p) => { flyTo([p.lng, p.lat], 17, 900); focusRestaurant(p) }}
        flowOn={flowOn}
        onTrafficFlow={toggleFlow}
        incOn={incOn}
        onTrafficIncidents={toggleIncidents}
        activeWeatherLayer={activeWeatherLayer}
        onWeatherLayer={selectWeatherLayer}
        liveOn={liveOn}
        currentPos={currentPos}
        onRouteSuccess={handleRouteSuccess}
      />
      <div className={styles.mapWrap}>
        <div ref={containerRef} className={styles.map} />
        <WeatherLegend activeLayer={activeWeatherLayer} />
        <NavOverlay
          liveOn={liveOn}
          navSteps={navSteps}
          navStepIdx={navStepIdx}
          distToNextM={distToNextM}
          voiceOn={voiceOn}
          onToggleVoice={toggleVoice}
        />
        <LiveStatsHUD
          liveOn={liveOn}
          totalDistKm={totalDistKm}
          elapsedSec={elapsedSec}
          avgSpeedKmh={avgSpeedKmh}
          remainingKm={remainingKm}
        />
        <MapControls
          onLocate={handleLocate}
          onFlyToTurkey={() => { flyTo(TURKEY_CENTER, TURKEY_ZOOM, 1400); setStatus("Türkiye'ye odaklanıldı") }}
          onClearAll={handleClearAll}
          status={status}
          tipText={MODE_TIPS[mode]}
          mapRef={mapRef}
          currentStyle={currentStyle}
          weather={weather}
          weatherLoading={weatherLoading}
          weatherError={weatherError}
          onWeatherRequest={handleWeatherRequest}
          onWeatherClose={clearWeather}
          theme={theme}
          onToggleTheme={toggleTheme}
          onCoordGo={handleCoordGo}
          terrainOn={terrainOn}
          onToggleTerrain={toggleTerrain}
          buildingsOn={buildingsOn}
          onToggleBuildings={toggleBuildings}
          liveOn={liveOn}
          onToggleLive={toggleLive}
          liveAccuracy={liveAccuracy}
          currentPos={currentPos}
          onCenterOnLocation={handleCenterOnLocation}
          voiceListening={voiceListening}
          onToggleVoiceCommand={toggleListening}
          onSearchSelect={({ lon, lat, name }) => {
            const doFly = () => {
              flyTo([lon, lat], 13, 1000)
              addPin(lon, lat, name)
              setStatus(`${name} konumuna gidildi`)
            }
            if (mapRef.current?.isStyleLoaded()) doFly()
            else mapRef.current?.once('load', doFly)
          }}
        />
      <VoiceFeedback
        listening={voiceListening}
        transcript={voiceTranscript}
        feedback={voiceFeedback}
      />
      <ElevationChart
        profile={profile}
        loading={elevLoading}
        error={elevError}
        onClose={clearProfile}
      />
      {contextMenu && (
          <ContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            lat={contextMenu.lat}
            lng={contextMenu.lng}
            onClose={() => setContextMenu(null)}
            onCopyCoords={(lat, lng) => {
              navigator.clipboard?.writeText(`${lat.toFixed(6)}, ${lng.toFixed(6)}`)
              setStatus(`Kopyalandı: ${lat.toFixed(5)}, ${lng.toFixed(5)}`)
            }}
            onAddPin={(lng, lat) => addPin(lng, lat)}
            onWeather={async (lat, lon) => {
              setStatus('Hava durumu alınıyor...')
              await fetchWeather(lat, lon)
              setStatus('Hava durumu güncellendi')
            }}
          />
        )}
      </div>
    </div>
  )
}
