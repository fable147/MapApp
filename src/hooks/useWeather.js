import { useState, useCallback, useRef } from 'react'

// WMO hava kodu → Türkçe açıklama + ikon
const WMO_CODES = {
  0:  { label: 'Açık',            icon: 'ti-sun' },
  1:  { label: 'Çoğunlukla açık', icon: 'ti-sun' },
  2:  { label: 'Parçalı bulutlu', icon: 'ti-cloud' },
  3:  { label: 'Kapalı',          icon: 'ti-cloud' },
  45: { label: 'Sisli',           icon: 'ti-mist' },
  48: { label: 'Kırağılı sis',    icon: 'ti-mist' },
  51: { label: 'Hafif çisenti',   icon: 'ti-cloud-rain' },
  53: { label: 'Çisenti',         icon: 'ti-cloud-rain' },
  55: { label: 'Yoğun çisenti',   icon: 'ti-cloud-rain' },
  61: { label: 'Hafif yağmur',    icon: 'ti-cloud-rain' },
  63: { label: 'Yağmur',          icon: 'ti-cloud-rain' },
  65: { label: 'Şiddetli yağmur', icon: 'ti-cloud-rain' },
  71: { label: 'Hafif kar',       icon: 'ti-snowflake' },
  73: { label: 'Kar',             icon: 'ti-snowflake' },
  75: { label: 'Yoğun kar',       icon: 'ti-snowflake' },
  80: { label: 'Sağanak',         icon: 'ti-cloud-storm' },
  81: { label: 'Kuvvetli sağanak',icon: 'ti-cloud-storm' },
  95: { label: 'Fırtına',         icon: 'ti-bolt' },
  99: { label: 'Dolu fırtınası',  icon: 'ti-bolt' },
}

export function useWeather() {
  const [weather, setWeather] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)
  const cacheRef = useRef({})

  const fetchWeather = useCallback(async (lat, lon, locationName = null) => {
    const key = `${lat.toFixed(2)},${lon.toFixed(2)}`
    if (cacheRef.current[key]) {
      setWeather(cacheRef.current[key])
      return
    }

    setLoading(true)
    setError(null)

    try {
      const url =
        `https://api.open-meteo.com/v1/forecast` +
        `?latitude=${lat}&longitude=${lon}` +
        `&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weathercode,apparent_temperature` +
        `&wind_speed_unit=kmh&timezone=auto`

      const res  = await fetch(url)
      const data = await res.json()
      const c    = data.current

      const wmo    = WMO_CODES[c.weathercode] || { label: 'Bilinmiyor', icon: 'ti-cloud' }
      const result = {
        lat, lon,
        locationName,
        temp:       Math.round(c.temperature_2m),
        feelsLike:  Math.round(c.apparent_temperature),
        humidity:   c.relative_humidity_2m,
        windSpeed:  Math.round(c.wind_speed_10m),
        label:      wmo.label,
        icon:       wmo.icon,
        timezone:   data.timezone,
      }

      cacheRef.current[key] = result
      setWeather(result)
    } catch (e) {
      setError('Hava durumu alınamadı')
    } finally {
      setLoading(false)
    }
  }, [])

  const clearWeather = useCallback(() => {
    setWeather(null)
    setError(null)
  }, [])

  return { weather, loading, error, fetchWeather, clearWeather }
}
