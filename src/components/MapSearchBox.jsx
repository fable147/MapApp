import React, { useState } from 'react'
import AutocompleteInput from './AutocompleteInput'
import styles from './MapSearchBox.module.css'

/**
 * Harita üstü arama kutusu
 * Konum seçilince onSelect({ lon, lat, name }) çağrılır
 */
export default function MapSearchBox({ onSelect }) {
  const [value, setValue] = useState('')

  function handleSelect(result) {
    onSelect(result)
  }

  return (
    <div className={styles.box}>
      <AutocompleteInput
        placeholder="Konum ara... (şehir, ilçe, adres)"
        value={value}
        onChange={setValue}
        onSelect={handleSelect}
        autoFocus={false}
      />
    </div>
  )
}
