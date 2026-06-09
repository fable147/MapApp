import { useState, useCallback, useRef, useEffect } from 'react'

// ── POI anahtar kelime tablosu ────────────────────────────────────────────────
const NEARBY_MAP = {
  hastane:      { id: 'hospital',    label: 'Hastane'  },
  hastaneler:   { id: 'hospital',    label: 'Hastane'  },
  eczane:       { id: 'pharmacy',    label: 'Eczane'   },
  eczaneler:    { id: 'pharmacy',    label: 'Eczane'   },
  kafe:         { id: 'cafe',        label: 'Kafe'     },
  kahve:        { id: 'cafe',        label: 'Kafe'     },
  kahvehane:    { id: 'cafe',        label: 'Kafe'     },
  restoran:     { id: 'restaurant',  label: 'Restoran' },
  yemek:        { id: 'restaurant',  label: 'Restoran' },
  lokanta:      { id: 'restaurant',  label: 'Restoran' },
  atm:          { id: 'atm',         label: 'ATM'      },
  benzin:       { id: 'fuel',        label: 'Benzin'   },
  akaryakıt:    { id: 'fuel',        label: 'Benzin'   },
  benzinlik:    { id: 'fuel',        label: 'Benzin'   },
  market:       { id: 'supermarket', label: 'Market'   },
  bakkal:       { id: 'supermarket', label: 'Market'   },
  süpermarket:  { id: 'supermarket', label: 'Market'   },
  otel:         { id: 'hotel',       label: 'Otel'     },
  pansiyon:     { id: 'hotel',       label: 'Otel'     },
  konaklama:    { id: 'hotel',       label: 'Otel'     },
  park:         { id: 'park',        label: 'Park'     },
  okul:         { id: 'school',      label: 'Okul'     },
  ilkokul:      { id: 'school',      label: 'Okul'     },
  lise:         { id: 'school',      label: 'Okul'     },
}

// ── Harita stili tablosu ──────────────────────────────────────────────────────
const STYLE_PATTERNS = [
  [/uydu/,                          'satellite', 'Uydu'],
  [/topo(grafik)?/,                 'topo',      'Topo'],
  [/üç.?boyut|3d harita|threed/,    'threed',    '3D'],
  [/karanlık harita|koyu harita/,   'dark',      'Koyu'],
  [/aydınlık harita|açık harita/,   'bright',    'Açık'],
  [/voyager/,                       'voyager',   'Voyager'],
  [/standart harita|normal harita|varsayılan/, 'liberty', 'Standart'],
]

// ── Mod tablosu ───────────────────────────────────────────────────────────────
const MODE_LABELS = {
  pin: 'Pin modu', measure: 'Ölçüm modu',
  draw: 'Çizim modu', polygon: 'Alan modu', pan: 'Normal mod',
}

// ── Yolculuk modu ─────────────────────────────────────────────────────────────
function detectTravelMode(t) {
  if (/yürüyerek|yürüye|yaya|yürü|yürüyüş/.test(t)) return 'foot'
  if (/bisiklet/.test(t))                             return 'bike'
  return 'car'
}

// ── Navigasyon hedefini metinden çıkar ────────────────────────────────────────
function extractDestination(text) {
  const gitIdx  = text.indexOf(' git')
  const rotaIdx = text.indexOf(' rota')
  const navIdx  = text.indexOf(' navigasyon')
  const götür   = text.indexOf(' götür')
  const idx = Math.min(
    gitIdx  >= 0 ? gitIdx  : Infinity,
    rotaIdx >= 0 ? rotaIdx : Infinity,
    navIdx  >= 0 ? navIdx  : Infinity,
    götür   >= 0 ? götür   : Infinity,
  )
  if (idx === Infinity) return null
  return text.slice(0, idx).replace(/['''''][aeıioöuüyAEIİOÖUÜY]{1,3}$/u, '').trim()
}

// ── Ana komut eşleştirici ─────────────────────────────────────────────────────
function matchCommand(raw) {
  const t = raw.toLowerCase().trim()

  // ── Navigasyon (seyahat modu dahil) ──
  const dest = extractDestination(t)
  if (dest) return { action: 'navigate', payload: dest, travelMode: detectTravelMode(t) }

  // ── Harita stili ──
  for (const [pattern, key, label] of STYLE_PATTERNS) {
    if (pattern.test(t)) return { action: 'changeStyle', payload: key, label }
  }

  // ── Trafik ──
  if (/trafik.*(kapat|gizle|kaldır|durdur)/.test(t)) return { action: 'trafficOff' }
  if (/trafik.*(aç|göster|başlat)/.test(t))           return { action: 'trafficOn' }
  if (/trafik/.test(t))                                return { action: 'toggleTraffic' }

  // ── Hava durumu ──
  if (/hava.*(kapat|gizle|kaldır)/.test(t))  return { action: 'closeWeather' }
  if (/hava (durumu|nasıl)|meteoroloji|havayı (göster|aç)/.test(t)) return { action: 'weather' }

  // ── 3D Arazi ──
  if (/3d arazi|arazi (modu|görünüm)|yükseklik (göster|modu)|dağ modu/.test(t))
    return { action: 'toggleTerrain' }

  // ── Temizleme ──
  if (/harita.*temizle|her.?şeyi (temizle|sil)|tümünü (temizle|sil)/.test(t))
    return { action: 'clearAll' }
  if (/rota.*(temizle|sil|kaldır)|rotayı (temizle|sil|kaldır)/.test(t))
    return { action: 'clearRoute' }
  if (/pin.*(temizle|sil|kaldır)|pinleri (temizle|sil|kaldır)/.test(t))
    return { action: 'clearPins' }

  // ── Etkileşim modu ──
  if (/pin (modu|koy|moduna geç)|pin moduna/.test(t))  return { action: 'setMode', payload: 'pin' }
  if (/ölçüm (modu|yap|başlat)|mesafe ölç/.test(t))    return { action: 'setMode', payload: 'measure' }
  if (/çizim (modu|yap|başlat)|çiz(gi)?( modu)?/.test(t)) return { action: 'setMode', payload: 'draw' }
  if (/alan (çiz|ölç|modu)|polygon/.test(t))           return { action: 'setMode', payload: 'polygon' }
  if (/normal (mod|harita|görünüm)|gezin|pan (modu|mod)/.test(t)) return { action: 'setMode', payload: 'pan' }

  // ── Pin ekle ──
  if (/buraya pin|pin (koy|ekle|at|bırak)|işaret (koy|ekle|bırak)/.test(t))
    return { action: 'addPinHere' }

  // ── Konum bul ──
  if (/konum(um)?|beni bul|neredeyim|konumumu (göster|bul)/.test(t))
    return { action: 'locate' }

  // ── Zoom seviyesi ──
  const zoomNumMatch = t.match(/zoom\s*(\d+)|(\d+)[.']?\s*(?:seviye|zoom)|(\d+)(?:'(?:e|a|ye|ya))?\s*zum/)
  if (zoomNumMatch) {
    const level = parseInt(zoomNumMatch[1] ?? zoomNumMatch[2] ?? zoomNumMatch[3])
    if (level >= 1 && level <= 20) return { action: 'zoomTo', payload: level }
  }
  if (/çok yakınlaş|daha (çok )?(yakın|büyük)|süper yakın/.test(t)) return { action: 'zoomIn',  steps: 3 }
  if (/yakınlaş|büyüt|zoom (in|gir)/.test(t))                       return { action: 'zoomIn',  steps: 1 }
  if (/çok uzaklaş|daha (çok )?(uzak|küçük)|süper uzak/.test(t))    return { action: 'zoomOut', steps: 3 }
  if (/uzaklaş|küçült|zoom (out|çık)/.test(t))                      return { action: 'zoomOut', steps: 1 }

  // ── Döndür / eğim ──
  if (/kuzeye (döndür|çevir)|kuzeyi göster|haritayı (sıfırla|düzelt)/.test(t))
    return { action: 'resetBearing' }
  if (/eğim (aç|artır)|haritayı (eğ|yatır)|3d (görünüm|mod)/.test(t))
    return { action: 'tiltMap' }
  if (/eğimi (kapat|kaldır|sıfırla)|düz harita|yukarıdan/.test(t))
    return { action: 'flatMap' }

  // ── Canlı takip ──
  if (/canlı (başlat|aç)|takibi (başlat|aç)|canlı takip(i)? (başlat|aç)/.test(t))
    return { action: 'startLive' }
  if (/canlı (kapat|durdur|bitir)|takibi (kapat|durdur|bitir)/.test(t))
    return { action: 'stopLive' }
  if (/canlı|takip/.test(t)) return { action: 'toggleLive' }

  // ── Tema ──
  if (/karanlık( mod| tema)?|koyu( mod| tema)?|gece (mod|tema)/.test(t)) return { action: 'darkMode' }
  if (/aydınlık( mod| tema)?|açık( mod| tema)?|gündüz (mod|tema)/.test(t)) return { action: 'lightMode' }

  // ── 3D Binalar ──
  if (/3d (bina|gökdelen)|bina.*(aç|göster|kapat)|gökdelen/.test(t))
    return { action: 'toggleBuildings' }

  // ── Türkiye / Ana sayfa ──
  if (/türkiye|ana (sayfa|ekran)|başa dön|geri dön/.test(t)) return { action: 'flyToTurkey' }

  // ── Sesli yönlendirme ──
  if (/yönlendirme.*(kapat|sus|kapa)|sesli.*(kapat|sus)|navigasyon sesini kapat/.test(t))
    return { action: 'muteNav' }
  if (/yönlendirme.*(aç|başlat)|sesli.*(aç|başlat)|navigasyon sesini aç/.test(t))
    return { action: 'unmuteNav' }

  // ── Navigasyon adımı ──
  if (/sonraki (adım|yön|talimat|dönüş)|ileri git|devam et/.test(t))
    return { action: 'nextNavStep' }
  if (/önceki (adım|yön|talimat)|geri (adım|dön)/.test(t))
    return { action: 'prevNavStep' }

  // ── Rota modu (seyahat türü değiştir) ──
  if (/araba(yla)? (rota|git)|sürüş (rota|modu)/.test(t))  return { action: 'setTravelMode', payload: 'car' }
  if (/yürüyerek (rota|git)|yaya (rota|modu)/.test(t))     return { action: 'setTravelMode', payload: 'foot' }
  if (/bisiklet(le)? (rota|git)|bisiklet (rota|modu)/.test(t)) return { action: 'setTravelMode', payload: 'bike' }

  // ── Tam ekran ──
  if (/tam ekran|fullscreen|büyük ekran/.test(t)) return { action: 'fullscreen' }

  // ── Konum paylaş / ortala ──
  if (/konuma (ortala|git|dön)|konumu ortala|beni ortala/.test(t))
    return { action: 'centerOnLocation' }

  // ── Yakın POI (en sona — diğer komutlarla çakışmasın) ──
  for (const [tr, info] of Object.entries(NEARBY_MAP)) {
    if (t.includes(tr)) return { action: 'searchNearby', payload: info.id, label: info.label }
  }

  return null
}

// ── Hook ─────────────────────────────────────────────────────────────────────
export function useVoiceCommand(handlers) {
  const [listening,  setListening]  = useState(false)
  const [transcript, setTranscript] = useState('')
  const [feedback,   setFeedback]   = useState('')

  const recogRef         = useRef(null)
  const handlersRef      = useRef(handlers)
  const feedbackTimerRef = useRef(null)

  useEffect(() => { handlersRef.current = handlers }, [handlers])

  const showFeedback = useCallback((msg, autoClear = true) => {
    setFeedback(msg)
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current)
    if (autoClear) {
      feedbackTimerRef.current = setTimeout(() => {
        setFeedback('')
        setTranscript('')
      }, 3500)
    }
  }, [])

  const processTranscript = useCallback((text) => {
    setTranscript(text)
    const cmd = matchCommand(text)
    if (!cmd) {
      showFeedback(`"${text}" — komut anlaşılamadı`)
      return
    }

    const h = handlersRef.current
    switch (cmd.action) {

      // — Navigasyon —
      case 'navigate':
        showFeedback(`"${cmd.payload}" aranıyor…`, false)
        h.onNavigate?.(cmd.payload, cmd.travelMode)
        break

      // — Harita stili —
      case 'changeStyle':
        showFeedback(`${cmd.label} haritası`)
        h.onChangeStyle?.(cmd.payload)
        break

      // — Trafik —
      case 'trafficOn':
        showFeedback('Trafik akışı gösteriliyor')
        h.onTrafficOn?.()
        break
      case 'trafficOff':
        showFeedback('Trafik akışı gizlendi')
        h.onTrafficOff?.()
        break
      case 'toggleTraffic':
        showFeedback('Trafik değiştirildi')
        h.onToggleTraffic?.()
        break

      // — Hava durumu —
      case 'weather':
        showFeedback('Hava durumu yükleniyor…')
        h.onWeather?.()
        break
      case 'closeWeather':
        showFeedback('Hava durumu kapatıldı')
        h.onCloseWeather?.()
        break

      // — Arazi —
      case 'toggleTerrain':
        showFeedback('3D arazi değiştirildi')
        h.onToggleTerrain?.()
        break

      // — Temizleme —
      case 'clearAll':
        showFeedback('Harita temizlendi')
        h.onClearAll?.()
        break
      case 'clearRoute':
        showFeedback('Rota temizlendi')
        h.onClearRoute?.()
        break
      case 'clearPins':
        showFeedback('Pinler temizlendi')
        h.onClearPins?.()
        break

      // — Mod —
      case 'setMode':
        showFeedback(MODE_LABELS[cmd.payload] ?? cmd.payload)
        h.onSetMode?.(cmd.payload)
        break

      // — Pin —
      case 'addPinHere':
        showFeedback('Pin eklendi')
        h.onAddPinHere?.()
        break

      // — Konum —
      case 'locate':
        showFeedback('Konum bulunuyor…')
        h.onLocate?.()
        break

      // — Zoom —
      case 'zoomTo':
        showFeedback(`Zoom: ${cmd.payload}`)
        h.onZoomTo?.(cmd.payload)
        break
      case 'zoomIn':
        showFeedback(cmd.steps === 3 ? 'Çok yakınlaşıldı' : 'Yakınlaşıldı')
        h.onZoomIn?.(cmd.steps ?? 1)
        break
      case 'zoomOut':
        showFeedback(cmd.steps === 3 ? 'Çok uzaklaşıldı' : 'Uzaklaşıldı')
        h.onZoomOut?.(cmd.steps ?? 1)
        break

      // — Döndür / eğim —
      case 'resetBearing':
        showFeedback('Harita kuzeye döndürüldü')
        h.onResetBearing?.()
        break
      case 'tiltMap':
        showFeedback('Harita eğildi')
        h.onTiltMap?.()
        break
      case 'flatMap':
        showFeedback('Harita düzleştirildi')
        h.onFlatMap?.()
        break

      // — Canlı takip —
      case 'startLive':
      case 'stopLive':
      case 'toggleLive':
        showFeedback('Canlı takip değiştirildi')
        h.onToggleLive?.()
        break

      // — Tema —
      case 'darkMode':
        showFeedback('Koyu mod')
        h.onDarkMode?.()
        break
      case 'lightMode':
        showFeedback('Aydınlık mod')
        h.onLightMode?.()
        break

      // — 3D Binalar —
      case 'toggleBuildings':
        showFeedback('3D binalar değiştirildi')
        h.onToggleBuildings?.()
        break

      // — Türkiye —
      case 'flyToTurkey':
        showFeedback("Türkiye'ye odaklanıldı")
        h.onFlyToTurkey?.()
        break

      // — Sesli yönlendirme —
      case 'muteNav':
        showFeedback('Sesli yönlendirme kapatıldı')
        h.onMuteNav?.()
        break
      case 'unmuteNav':
        showFeedback('Sesli yönlendirme açıldı')
        h.onUnmuteNav?.()
        break

      // — Navigasyon adımı —
      case 'nextNavStep':
        showFeedback('Sonraki adım')
        h.onNextNavStep?.()
        break
      case 'prevNavStep':
        showFeedback('Önceki adım')
        h.onPrevNavStep?.()
        break

      // — Seyahat modu —
      case 'setTravelMode': {
        const labels = { car: 'Araba', foot: 'Yaya', bike: 'Bisiklet' }
        showFeedback(`${labels[cmd.payload]} modu`)
        h.onSetTravelMode?.(cmd.payload)
        break
      }

      // — Tam ekran —
      case 'fullscreen':
        showFeedback('Tam ekran')
        h.onFullscreen?.()
        break

      // — Konuma ortala —
      case 'centerOnLocation':
        showFeedback('Konuma odaklanıldı')
        h.onCenterOnLocation?.()
        break

      // — Yakın POI —
      case 'searchNearby':
        showFeedback(`Yakın ${cmd.label} aranıyor…`)
        h.onSearchNearby?.(cmd.payload)
        break

      default: break
    }
  }, [showFeedback])

  const startListening = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) {
      showFeedback('Ses tanıma bu tarayıcıda desteklenmiyor')
      return
    }
    const recog = new SR()
    recog.lang            = 'tr-TR'
    recog.continuous      = false
    recog.interimResults  = true
    recog.maxAlternatives = 1

    recog.onresult = (e) => {
      const r = e.results[e.results.length - 1]
      const txt = r[0].transcript
      if (r.isFinal) processTranscript(txt)
      else setTranscript(txt)
    }
    recog.onend   = () => { setListening(false); recogRef.current = null }
    recog.onerror = (e) => {
      setListening(false)
      recogRef.current = null
      if (e.error !== 'no-speech' && e.error !== 'aborted')
        showFeedback('Ses tanıma hatası — mikrofon iznini kontrol edin')
    }

    recog.start()
    recogRef.current = recog
    setListening(true)
    setTranscript('')
    setFeedback('')
  }, [processTranscript, showFeedback])

  const stopListening  = useCallback(() => { recogRef.current?.stop() }, [])
  const toggleListening = useCallback(() => {
    if (listening) stopListening()
    else startListening()
  }, [listening, startListening, stopListening])

  useEffect(() => () => {
    recogRef.current?.abort()
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current)
  }, [])

  return { listening, toggleListening, transcript, feedback }
}
