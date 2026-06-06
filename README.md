# MapApp — React Harita Uygulaması

MapLibre GL JS tabanlı, tam özellikli harita uygulaması.

## Kurulum

```bash
npm install
npm run dev
```

Tarayıcıda http://localhost:5173 adresini aç.

## Özellikler

- **Gezin** — haritayı sürükle, zoom yap
- **Pin Koy** — haritaya tıklayarak renkli marker ekle; sidebar'da listele, tıkla, sil
- **Çiz** — tıklayarak çizgi çiz, çift tıklayınca tamamla
- **Ölç** — haritada iki noktaya tıkla, kuş uçuşu km hesapla
- **Mesafe Hesaplayıcı** — iki şehir adı yaz, Enter'a bas; Nominatim geocoding + Haversine
- **Altlık seçimi** — Standart, Açık, Topo, Koyu (tümü OpenFreeMap — ücretsiz)
- **Konumumu Bul** — tarayıcı Geolocation API
- **Türkiye'ye Dön** — flyTo animasyonu
- **Temizle** — tüm pin ve çizimleri sil

## Proje Yapısı

```
src/
├── App.jsx                  # Ana bileşen, tüm state yönetimi
├── App.module.css
├── index.css                # Global stil + MapLibre override
├── main.jsx
├── components/
│   ├── Sidebar.jsx          # Sol panel
│   ├── Sidebar.module.css
│   ├── PinList.jsx          # Pin listesi
│   ├── PinList.module.css
│   ├── MapControls.jsx      # Harita üstü butonlar + status bar
│   └── MapControls.module.css
├── hooks/
│   ├── useMap.js            # MapLibre init, katman yönetimi, flyTo
│   └── usePins.js           # Pin ekleme/silme/temizleme
└── utils/
    ├── constants.js         # Stil URL'leri, renkler, sabitler
    └── geo.js               # Haversine + Nominatim geocode
```

## Teknolojiler

| Araç | Versiyon |
|------|----------|
| React | 18 |
| MapLibre GL JS | 4.7 |
| Vite | 5 |
| OpenFreeMap | ücretsiz tiles |
| Nominatim | OpenStreetMap geocoding |

## Geliştirme Notları

- Geocoding sonuçları `geoCache` ile önbelleğe alınır
- `useMap` hook'u MapLibre instance'ını `mapRef`'te tutar
- `usePins` hook'u pin state'ini ve marker nesnesini birlikte yönetir
- CSS Modules ile component-scoped stil
