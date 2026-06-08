import React, { useRef, useEffect } from 'react'
import { useAutocomplete } from '../hooks/useAutocomplete'
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
  const wrapRef = useRef(null)
  const inputRef = useRef(null)
  const { query, setQuery, suggestions, loading, open, select, close } =
    useAutocomplete(300)

  // Dışarı tıklanınca kapat (mouse + touch)
  useEffect(() => {
    function handleOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) close()
    }
    document.addEventListener('mousedown', handleOutside)
    document.addEventListener('touchstart', handleOutside, { passive: true })
    return () => {
      document.removeEventListener('mousedown', handleOutside)
      document.removeEventListener('touchstart', handleOutside)
    }
  }, [close])

  // Controlled value → query sync (parent'tan set edilince)
  useEffect(() => {
    if (value !== undefined && value !== query) setQuery(value)
  }, [value])

  function handleChange(e) {
    setQuery(e.target.value)
    onChange?.(e.target.value)
  }

  function handleSelect(suggestion) {
    const result = select(suggestion)
    onChange?.(result.name)
    onSelect?.(result)
    inputRef.current?.blur()
  }

  

  function handleKeyDown(e) {
    if (e.key === 'Escape') { close(); return }
    if (e.key === 'Enter') {
      if (open && suggestions.length > 0) {
        handleSelect(suggestions[0])
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
          onFocus={() => { if (suggestions.length > 0) close() }}
          autoFocus={autoFocus}
          aria-autocomplete="list"
          aria-expanded={open}
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

      {open && (
        <ul className={styles.dropdown} role="listbox">
          {suggestions.map((s, i) => (
            <li
              key={i}
              className={styles.item}
              role="option"
              onMouseDown={(e) => { e.preventDefault(); handleSelect(s) }}
            onTouchEnd={(e) => { e.preventDefault(); handleSelect(s) }}
            >
              <i className={`ti ${s.icon}`} aria-hidden="true" style={{ fontSize: 14, flexShrink: 0, color: 'var(--accent)' }} />
              <div className={styles.itemText}>
                <span className={styles.itemShort}>{s.shortName}</span>
                <span className={styles.itemFull}>{s.displayName}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
