import { useState, useEffect, useCallback, useRef } from 'react'

export function useVoiceNav({ navSteps, navStepIdx, distToNextM, liveOn }) {
  const [voiceOn, setVoiceOn] = useState(true)
  const voiceOnRef      = useRef(true)
  const announcedRef    = useRef({ stepIdx: -1, t500: false, t200: false, t50: false })
  const distRef         = useRef(distToNextM)

  useEffect(() => { distRef.current = distToNextM }, [distToNextM])

  const speak = useCallback((text) => {
    if (!voiceOnRef.current || !window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const utt = new SpeechSynthesisUtterance(text)
    utt.lang   = 'tr-TR'
    utt.rate   = 1.05
    utt.pitch  = 1.0
    utt.volume = 1.0
    window.speechSynthesis.speak(utt)
  }, [])

  const toggleVoice = useCallback(() => {
    const next = !voiceOnRef.current
    voiceOnRef.current = next
    setVoiceOn(next)
    if (!next) window.speechSynthesis?.cancel()
  }, [])

  // Navigasyon durduğunda sesi kes
  useEffect(() => {
    if (!liveOn) {
      window.speechSynthesis?.cancel()
      announcedRef.current = { stepIdx: -1, t500: false, t200: false, t50: false }
    }
  }, [liveOn])

  // Adım değişince talimatı duyur ve eşikleri sıfırla
  useEffect(() => {
    if (!liveOn || !navSteps || navStepIdx < 0) return
    const step = navSteps[navStepIdx]
    if (!step) return

    const d = distRef.current
    announcedRef.current = {
      stepIdx: navStepIdx,
      t500: d != null && d < 500,
      t200: d != null && d < 200,
      t50:  d != null && d < 50,
    }

    const isLast = navStepIdx >= navSteps.length - 1
    if (isLast) {
      speak('Hedefinize ulaştınız')
    } else {
      speak(step.label)
    }
  }, [navStepIdx, liveOn, speak])

  // Mesafeye göre önceden uyar
  useEffect(() => {
    if (!liveOn || !navSteps || distToNextM == null) return
    const step = navSteps[navStepIdx]
    if (!step || navStepIdx >= navSteps.length - 1) return

    const a = announcedRef.current
    if (a.stepIdx !== navStepIdx) return

    if (distToNextM <= 50 && !a.t50) {
      a.t50 = true
      speak(step.label)
    } else if (distToNextM <= 200 && !a.t200) {
      a.t200 = true
      speak(`200 metre sonra, ${step.label}`)
    } else if (distToNextM <= 500 && !a.t500) {
      a.t500 = true
      speak(`500 metre sonra, ${step.label}`)
    }
  }, [distToNextM, liveOn, speak])

  return { voiceOn, toggleVoice, speak }
}
