import React, { createContext, useContext, useState, useCallback } from 'react'
import translations from '../i18n/translations'

const LanguageContext = createContext(null)

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('app-lang') ?? 'tr')

  const t = useCallback((key) => {
    return translations[lang]?.[key] ?? translations.tr[key] ?? key
  }, [lang])

  const toggleLang = useCallback(() => {
    setLang((prev) => {
      const next = prev === 'tr' ? 'en' : 'tr'
      localStorage.setItem('app-lang', next)
      return next
    })
  }, [])

  return (
    <LanguageContext.Provider value={{ lang, t, toggleLang }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}
