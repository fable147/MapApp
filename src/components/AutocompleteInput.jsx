import React, { useRef, useEffect, useState } from 'react'
import { useAutocomplete } from '../hooks/useAutocomplete'
import { useSearchHistory } from '../hooks/useSearchHistory'
import styles from './AutocompleteInput.module.css'

/**
 * Reusable autocomplete input
 *
 * Props:
 *   placeholder  — string
 *   value        — controlled value (string)
 *   onChange     — (stringValue) => void
 *   onSelect     — ({ lon, lat, name }) => void
 *   onEnter      — () => void  (Enter tuşu)
 *   id           — string (opsiyonel)
 *   autoFocus    — bool
 */
export default function AutocompleteInput({
  placeholder,
  value,
  onChange,
  onSelect,
  onEnter,
  id,
  autoFocus,
}) {
  const wrapRef     = useRef(null)
  const inputRef    = useRef(null)
  const sentinelRef = useRef(null)
  const [focused, setFocused] = useState(false)

  const {
    query, setQuery,
    suggestions, loading, loadingMore, hasMore, open,
    highlightIdx, highlightNext, highlightPrev,
    select, close, loadMore,
  } = useAutocomplete(300)

  const { history, addEntry, removeEntry, clearHistory } = useSearchHistory()

  // Geçmişi sadece query boşken ve input focus'tayken göster
  const showHistory = focused && query.trim().length < 2 && !open && history.length > 0

  // Dışarı tıklanınca kapat
  useEffect(() => {
    function handleOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        close()
        setFocused(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    document.addEventListener('touchstart', handleOutside, { passive: true })
    return () => {
      document.removeEventListener('mousedown', handleOutside)
      document.removeEventListener('touchstart', handleOutside)
    }
  }, [close])

  // Controlled value → query sync
  useEffect(() => {
    if (value !== undefined && value !== query) setQuery(value)
  }, [value]) // eslint-disable-line

  // IntersectionObserver — sentinel göründüğünde daha fazla yükle
  useEffect(() => {
    if (!sentinelRef.current || !hasMore || !open) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && !loadingMore) loadMore() },
      { threshold: 0.1 }
    )
    observer.observe(sentinelRef.current)
    return () => observer.disconnect()
  }, [hasMore, open, loadMore, loadingMore, suggestions.length])

  function handleChange(e) {
    setQuery(e.target.value)
    onChange?.(e.target.value)
  }

  function handleSelect(suggestion) {
    addEntry(suggestion)
    const result = select(suggestion)
    onChange?.(result.name)
    onSelect?.(result)
    inputRef.current?.blur()
    setFocused(false)
  }

  function handleHistorySelect(entry) {
    setQuery(entry.shortName)
    onChange?.(entry.shortName)
    onSelect?.({ lon: entry.lon, lat: entry.lat, name: entry.shortName })
    close()
    setFocused(false)
    inputRef.current?.blur()
  }

  function handleKeyDown(e) {
    if (e.key === 'Escape') { close(); setFocused(false); return }
    if (e.key === 'ArrowDown') { e.preventDefault(); highlightNext(); return }
    if (e.key === 'ArrowUp')   { e.preventDefault(); highlightPrev(); return }
    if (e.key === 'Enter') {
      if (open && suggestions.length > 0) {
        handleSelect(highlightIdx >= 0 ? suggestions[highlightIdx] : suggestions[0])
      } else {
        onEnter?.()
      }
    }
  }

  return (
    <div className={styles.wrap} ref={wrapRef}>
      <div className={styles.inputRow}>
        <i className="ti ti-search" aria-hidden="true" style={{ fontSize: 14, color: 'var(--t3)', flexShrink: 0 }} />
        <input
          ref={inputRef}
          id={id}
          className={styles.input}
          type="text"
          autoComplete="off"
          placeholder={placeholder}
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          autoFocus={autoFocus}
          aria-autocomplete="list"
          aria-expanded={open || showHistory}
        />
        {loading && <span className={styles.spinner} aria-hidden="true" />}
        {query && !loading && (
          <button
            className={styles.clearBtn}
            onClick={() => { setQuery(''); onChange?.(''); close(); inputRef.current?.focus() }}
            aria-label="Temizle"
            tabIndex={-1}
          >
            <i className="ti ti-x" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Geçmiş aramaları — query boşken */}
      {showHistory && (
        <ul className={styles.dropdown} role="listbox">
          <li className={styles.historyHeader}>
            <span>Son Aramalar</span>
            <button
              className={styles.clearHistoryBtn}
              onMouseDown={(e) => { e.preventDefault(); clearHistory() }}
              aria-label="Geçmişi temizle"
            >
              Temizle
            </button>
          </li>
          {history.map((h, i) => (
            <li
              key={`${h.lat}-${h.lon}-${i}`}
              className={styles.item}
              role="option"
              onMouseDown={(e) => { e.preventDefault(); handleHistorySelect(h) }}
              onTouchEnd={(e)  => { e.preventDefault(); handleHistorySelect(h) }}
            >
              <i className="ti ti-history" aria-hidden="true" style={{ fontSize: 14, flexShrink: 0, color: 'var(--t3)' }} />
              <div className={styles.itemText}>
                <span className={styles.itemShort}>{h.shortName}</span>
                <span className={styles.itemFull}>{h.displayName}</span>
              </div>
              <button
                className={styles.historyDelBtn}
                onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); removeEntry(i) }}
                aria-label="Geçmişten kaldır"
                tabIndex={-1}
              >
                <i className="ti ti-x" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Autocomplete sonuçları */}
      {open && (
        <ul className={styles.dropdown} role="listbox">
          {suggestions.map((s, i) => (
            <li
              key={`${s.lat}-${s.lon}-${i}`}
              className={`${styles.item} ${i === highlightIdx ? styles.highlighted : ''}`}
              role="option"
              aria-selected={i === highlightIdx}
              onMouseDown={(e) => { e.preventDefault(); handleSelect(s) }}
              onTouchEnd={(e)  => { e.preventDefault(); handleSelect(s) }}
            >
              <i className={`ti ${s.icon}`} aria-hidden="true" style={{ fontSize: 14, flexShrink: 0, color: 'var(--accent)' }} />
              <div className={styles.itemText}>
                <span className={styles.itemShort}>{s.shortName}</span>
                <span className={styles.itemFull}>{s.displayName}</span>
              </div>
            </li>
          ))}

          {hasMore && (
            <li className={styles.sentinel} ref={sentinelRef} aria-hidden="true">
              {loadingMore && <span className={styles.spinnerSm} />}
            </li>
          )}
        </ul>
      )}
    </div>
  )
}
