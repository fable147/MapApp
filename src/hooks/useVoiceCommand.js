import { useState, useCallback, useRef, useEffect } from 'react'

const NEARBY_MAP = {
  restoran: 'restaurant', yemek: 'restaurant', lokanta: 'restaurant',
  kafe: 'cafe', kahve: 'cafe', kahvehane: 'cafe',
  otel: 'hotel', pansiyon: 'hotel',
  market: 'supermarket', bakkal: 'supermarket',
  eczane: 'pharmacy', hastane: 'hospital',
  benzin: 'fuel', akaryakıt: 'fuel',
  park: 'park', müze: 'museum', cami: 'place_of_worship',
}

function extractDestination(text) {
  // "[yer]'e/a/ye/ya git|rota|navigasyon" formatını yakalar
  const gitIdx  = text.indexOf(' git')
  const rotaIdx = text.indexOf(' rota')
  const navIdx  = text.indexOf(' navigasyon')
  const idx = Math.min(
    gitIdx  >= 0 ? gitIdx  : Infinity,
    rotaIdx >= 0 ? rotaIdx : Infinity,
    navIdx  >= 0 ? navIdx  : Infinity,
  )
  if (idx === Infinity) return null
  return text.slice(0, idx).replace(/['''‘’][aeıioöuüyAEIİOÖUÜY]+$/u, '').trim()
}

function matchCommand(raw) {
  const t = raw.toLowerCase().trim()

  // — Navigasyon —
  const dest = extractDestination(t)
  if (dest) return { action: 'navigate', payload: dest }

  // — Temizle —
  if (/temizle|rota.*(sil|kald)|sil.*rota|harita.*temizle/.test(t))
    return { action: 'clearAll' }
  if (/rota.*temizle|rotayı temizle/.test(t))
    return { action: 'clearRoute' }

  // — Konum —
  if (/konum(um)?|beni bul|neredeyim/.test(t))
    return { action: 'locate' }

  // — Zoom —
  if (/yakınlaş|büyüt|zoom.*in/.test(t))  return { action: 'zoomIn' }
  if (/uzaklaş|küçült|zoom.*out/.test(t)) return { action: 'zoomOut' }

  // — Canlı takip —
  if (/canlı.*(başlat|aç|kapat|durdur)|takibi.*(başlat|aç|kapat|durdur)/.test(t))
    return { action: 'toggleLive' }

  // — Tema —
  if (/karanlık|koyu|gece mod/.test(t))  return { action: 'darkMode' }
  if (/aydınlık|açık|gündüz mod/.test(t)) return { action: 'lightMode' }

  // — 3D Binalar —
  if (/3d|bina(lar)?|gökdelen/.test(t)) return { action: 'toggleBuildings' }

  // — Türkiye —
  if (/türkiye|ana sayfa|geri dön/.test(t)) return { action: 'flyToTurkey' }

  // — Yakın POI —
  for (const [tr, en] of Object.entries(NEARBY_MAP)) {
    if (t.includes(tr)) return { action: 'searchNearby', payload: en }
  }

  return null
}

export function useVoiceCommand(handlers) {
  const [listening,  setListening]  = useState(false)
  const [transcript, setTranscript] = useState('')
  const [feedback,   setFeedback]   = useState('')

  const recogRef    = useRef(null)
  const handlersRef = useRef(handlers)
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
      case 'navigate':
        showFeedback(`"${cmd.payload}" aranıyor…`, false)
        h.onNavigate?.(cmd.payload)
        break
      case 'clearAll':
        showFeedback('Harita temizlendi')
        h.onClearAll?.()
        break
      case 'clearRoute':
        showFeedback('Rota temizlendi')
        h.onClearRoute?.()
        break
      case 'locate':
        showFeedback('Konum bulunuyor…')
        h.onLocate?.()
        break
      case 'zoomIn':
        showFeedback('Yakınlaşıldı')
        h.onZoomIn?.()
        break
      case 'zoomOut':
        showFeedback('Uzaklaşıldı')
        h.onZoomOut?.()
        break
      case 'toggleLive':
        showFeedback('Canlı takip değiştirildi')
        h.onToggleLive?.()
        break
      case 'darkMode':
        showFeedback('Koyu mod')
        h.onDarkMode?.()
        break
      case 'lightMode':
        showFeedback('Aydınlık mod')
        h.onLightMode?.()
        break
      case 'toggleBuildings':
        showFeedback('3D binalar değiştirildi')
        h.onToggleBuildings?.()
        break
      case 'flyToTurkey':
        showFeedback("Türkiye'ye odaklanıldı")
        h.onFlyToTurkey?.()
        break
      case 'searchNearby':
        showFeedback(`Yakın ${text} aranıyor…`)
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
    recog.lang = 'tr-TR'
    recog.continuous = false
    recog.interimResults = true
    recog.maxAlternatives = 1

    recog.onresult = (e) => {
      const r = e.results[e.results.length - 1]
      const txt = r[0].transcript
      if (r.isFinal) processTranscript(txt)
      else setTranscript(txt)
    }
    recog.onend  = () => { setListening(false); recogRef.current = null }
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

  const stopListening = useCallback(() => {
    recogRef.current?.stop()
  }, [])

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
