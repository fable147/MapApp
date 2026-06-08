# MapApp — Özellik Dökümanı

React + MapLibre GL JS ile geliştirilmiş tam özellikli harita uygulaması.


---

## İçindekiler

1. [Arayüz Genel Bakış](#arayüz-genel-bakış)
2. [Harita Araçları](#harita-araçları)
3. [Pin Yönetimi](#pin-yönetimi)
4. [Çizim ve Ölçüm Araçları](#çizim-ve-ölçüm-araçları)
5. [Yol Tarifi ve Navigasyon](#yol-tarifi-ve-navigasyon)
6. [Canlı Konum Takibi](#canlı-konum-takibi)
7. [Keşfet (Turistik & Yemek)](#keşfet-turistik--yemek)
8. [Yakın Yerler (POI)](#yakın-yerler-poi)
9. [Oteller](#oteller)
10. [Katman Yönetimi](#katman-yönetimi)
11. [Hava Durumu](#hava-durumu)
12. [Trafik Katmanı](#trafik-katmanı)
13. [3D Arazi Görünümü](#3d-arazi-görünümü)
14. [Minimap](#minimap)
15. [Yükseklik Profili](#yükseklik-profili)
16. [Sağ Tık Menüsü](#sağ-tık-menüsü)
17. [Hava Durumu Katmanları](#hava-durumu-katmanları)
18. [Dil Desteği](#dil-desteği)
19. [Harita Stilleri](#harita-stilleri)
20. [Teknik Altyapı](#teknik-altyapı)

---

## Arayüz Genel Bakış

Uygulama iki ana bölümden oluşur:

- **Sol Panel (Sidebar):** Tüm araç ve ayarlara erişim; sekmeli yapı
- **Harita Alanı:** MapLibre GL JS tabanlı interaktif harita; araç çubuğu, arama kutusu ve HUD elemanları

![Genel görünüm](<screenshots/genel görünüm, sidebar açık, harita görünür -.png>)

---

## Harita Araçları

Sol panelin üst kısmında 5 mod bulunur:

| Mod | Açıklama |
|-----|----------|
| **Gezin** | Varsayılan pan/zoom modu |
| **Pin Koy** | Tıklanan noktaya pin ekler |
| **Çizim** | Tıklayarak çizgi, çift tıkla bitirir |
| **Ölçüm** | İki nokta arası mesafeyi ölçer |
| **Alan Çiz** | Çokgen çizer, alanı m²/ha/km² gösterir |

Ayrıca harita üzerinde sağ alt köşede:
- **Konumum** butonu — GPS ile mevcut konuma uç, pin ekle
- **Türkiye'ye Dön** — haritayı Türkiye'ye odakla
- **Temizle** — tüm pin/çizim/rota/sonuçları sil
- **Koordinat Git** — elle lat/lng girerek konuma git
- **Karanlık/Aydınlık Tema** toggle
- **Canlı Konum** toggle (mavi GPS butonu)


---

## Pin Yönetimi

- Haritada tıklayarak (Pin Koy modu) veya sağ tık → "Pin Ekle" ile pin eklenir
- Her pin otomatik isim ve renk alır (9 renk döngüsü)
- **Kümeleme (Clustering):** Yakın pinler zoom'a göre numaralı dairelere toplanır
  - Mavi daire: 2–4 pin
  - Turuncu daire: 5–19 pin
  - Kırmızı daire: 20+ pin
  - Dairelere tıklayınca zoom in yapılır, pinler açılır
- Sol paneldeki pin listesinden tıklanınca haritada popup gösterilir
- Çöp kutusu ikonu ile pin silinir

![Marker kümeleme](<screenshots/Marker Kümeleme.png>)

---

## Çizim ve Ölçüm Araçları

### Çizgi Çizimi
- **Çizim modu** aktifken haritaya tıklayarak nokta eklenir
- Çift tıkla çizim tamamlanır
- Tamamlanınca otomatik **Yükseklik Profili** hesaplanır

### Mesafe Ölçümü
- **Ölçüm modu** aktifken iki noktaya tıkla
- Noktalar arası kuş uçuşu mesafe km olarak status bar'da gösterilir
- 4 saniye sonra otomatik temizlenir

### Alan Ölçümü
- **Alan Çiz modu** aktifken köşe noktaları eklenir
- Çift tıkla kapatılır, merkeze alan etiketi (m², ha veya km²) yerleşir
- Poligon dolgu olarak görünür

### Mesafe Hesaplama (Sidebar)
- İki konum adı girerek kuş uçuşu mesafe hesaplanır
- Haritada iki pin ve aralarında çizgi gösterilir

![Çizgi çizimi ve yükseklik profili](<screenshots/Yükesklik Profili ve Çizgi.png>)

---

## Yol Tarifi ve Navigasyon

**Navigasyon sekmesinden** ulaşılır.

### Özellikler
- **3 ulaşım modu:** Araba, Yaya, Bisiklet
- **Çok duraklı rota:** A → B arası en az 2, en fazla 8 durak
- "Ara Durak Ekle" butonu ile dinamik durak ekleme
- Başlangıç/bitiş sırasını tek tıkla tersine çevirme
- **Mevcut Konumumu Kullan** butonu (A alanı yanında):
  - Normal: tarayıcı GPS'i kullanır
  - Canlı konum aktifken: yeşil + nabız efekti, anında mevcut koordinatı doldurur

### Rota Sonuçları
- En hızlı + 2 alternatif rota kartı
- Her kart: süre, mesafe, renk kodu
- Adım adım talimatlar (açılır/kapanır liste)

### Rota OSRM API
Yol verisi [OSRM Demo Server](http://router.project-osrm.org) üzerinden çekilir.

![Rota ve adım adım talimatlar](<screenshots/Rota ve Adım.png>)

---

## Canlı Konum Takibi

Sağ alttaki **mavi GPS butonu** ile aktifleştirilir.

### Konum Gösterimi
- Haritada mavi nokta + animasyonlu halka (canlı marker)
- Mavi dolgu daire: GPS doğruluk yarıçapı
- Mavi çizgi: gün boyunca gidilen yol (path polyline)

### İstatistik HUD (sağ altta)
Canlı takip açıkken floating panel gösterilir:

| Metrik | Açıklama |
|--------|----------|
| **km** | Toplam gidilen mesafe |
| **süre** | Geçen süre (ss:dd:ss) |
| **km/sa** | Ortalama hız (60s sonra aktif) |
| **kaldı** | Hedefe kalan mesafe (rota aktifse, turuncu) |

### GPS Filtresi
- Doğruluk ≤ 50m olan ölçümler kabul edilir
- 5m'den kısa hareketler gürültü sayılıp atlanır

![Canlı konum takibi ve HUD](<screenshots/canlı konum aktif, HUD paneli ve yol çizgisi.png>)

---

## Keşfet (Turistik & Yemek)

**Keşfet sekmesinden** ulaşılır. Haritanın mevcut merkez noktası etrafında arama yapılır.

### Turistik Noktalar (Overpass API)
8 kategori:
- Müze, Turistik Alan, Manzara Noktası, Kale/Hisar
- Anıt/Heykel, Tarihi Alan, Plaj, Sanat Galerisi

### Yemek Yerleri (Geoapify API)
5 kategori:
- Restoran, Kafe, Fast Food, Bar, Fırın/Pastane

### Ortak Özellikler
- Haritada özel ikonlarla işaretlenir
- Listeden tıklanınca harita o noktaya uçar, popup açılır
- Popup'ta **Wikipedia özeti** (TR → EN fallback, lazy load)
- "Temizle" butonu ile sonuçlar kaldırılır

![Keşfet paneli — turistik noktalar](<screenshots/keşfet paneli, turistik noktalar listesi + harita işaretleri.png>)

---

## Yakın Yerler (POI)

**Yakın sekmesinden** ulaşılır. Geoapify API.

10 kategori:
- Hastane, Eczane, Okul, Restoran, Kafe
- Alışveriş, Eğlence, Ulaşım, Spor, Konaklama

Listeden tıklanınca harita yakınlaşır ve popup açılır.

![POI — yakın eczaneler](<screenshots/POI paneli, yakın eczaneler örneği .png>)

---

## Oteller

**Oteller sekmesinden** ulaşılır. Geoapify API (VITE_GEOAPIFY_KEY gerekli).

- Haritanın merkezi etrafında yakın oteller listeler
- Yıldız puanı, adres, ücret bilgisi
- Listeden tıklanınca haritada popup
- **"Rota Al"** butonu: mevcut konumdan otele OSRM rotası hesaplar
- Wikipedia özeti desteği

![Otel paneli ve rota](<screenshots/tel paneli, rota al butonu .png>)

---

## Katman Yönetimi

**Katmanlar sekmesinden** ulaşılır.

- **GeoJSON/GPX dosyası yükle** — dosya seçici veya sürükle-bırak
- Yüklenen katman haritaya eklenir, sınırlarına otomatik yakınlaşılır
- Her katman için:
  - Görünürlük toggle (göz ikonu)
  - Renk değiştirme (renk seçici)
  - Silme butonu
- Stil değişince katmanlar otomatik yeniden yüklenir

![Katman yönetimi](<screenshots/layer paneli, yüklü 2 katman, renk seçici açık .png>)

---

## Hava Durumu

Harita araç çubuğundaki **bulut ikonu** ile haritanın mevcut merkezinin hava durumu gösterilir.

- Sıcaklık, hissedilen, nem, rüzgar hızı ve yönü
- Hava durumu ikonu + açıklama
- Konum adı (reverse geocode ile)
- Tekrar basınca panel kapanır

![Hava durumu kartı](<screenshots/hava durumu kartı açık.png>)

---

## Trafik Katmanı

**Katmanlar sekmesi** altında trafik toggle'ları:

- **Trafik Akışı:** Yol hızlarını renk skalasıyla gösterir (yeşil → sarı → kırmızı)
- **Olaylar:** Kaza, yol çalışması gibi olayları simgelerle işaretler

Tomtom tile servisi kullanır.

![Trafik katmanı](<screenshots/trafik katmanı aktif, yoğun kavşak .png>)

---

## 3D Arazi Görünümü

Harita kontrol araç çubuğundaki **dağ ikonu** ile aktifleştirilir.

- AWS Terrain RGB tile'ları ile yükseklik verisi
- 2.5x exaggeration — dağlar, vadiler belirgin
- 45° pitch otomatik uygulanır
- `antialias: true` ile pürüzsüz render

![3D arazi görünümü](<screenshots/3D arazi, dağlık bölge profili .png>)

---

## Minimap

Harita üzerinde sağ üst köşede açılır.

- Ana haritanın baktığı alanı küçük haritada **mavi dikdörtgen** ile gösterir
- Pan/zoom değiştikçe dikdörtgen güncellenir
- Aç/kapat toggle


---

## Yükseklik Profili

Çizim modu ile bir rota çizilip tamamlandığında otomatik çalışır.

- Open-Meteo Elevation API
- Haritanın altında animasyonlu SVG çizgi grafiği
- X ekseni: mesafe (km), Y ekseni: yükseklik (m)
- Min/maks yükseklik etiketleri
- "X" ile kapatılır

![Yükseklik profili grafiği](<screenshots/Yükesklik Profili ve Çizgi.png>)

---

## Sağ Tık Menüsü

Haritada herhangi bir yere sağ tıklanınca çıkar:

| Seçenek | Açıklama |
|---------|----------|
| **Koordinatları Kopyala** | `lat, lng` panoya kopyalanır |
| **Pin Ekle** | O noktaya pin bırakır |
| **Hava Durumu** | O koordinatın hava durumunu getirir |
| **Street View** | Google Maps'te Street View'da açar |

![Sağ tık menüsü](<screenshots/sağ tık menüsü açık .png>)

---

## Hava Durumu Katmanları

Harita araç çubuğundan erişilir. 5 seçenek:

| Katman | Açıklama |
|--------|----------|
| **Yağış** | Yağmur/kar yoğunluğu |
| **Sıcaklık** | Renk skalası ile sıcaklık dağılımı |
| **Rüzgar** | Yön ve hız görselleştirmesi |
| **Bulut** | Bulut örtüsü |
| **Basınç** | Atmosfer basıncı |

Aktif katmana göre haritanın sol altında **renk lejantı** gösterilir.

![Hava durumu katmanı — yağış ve lejant](<screenshots/yağış katmanı aktif + lejant.png>)

---

## Dil Desteği

Sidebar logo alanındaki **TR / EN** pill butonu ile değiştirilir.

- Tüm arayüz metinleri `src/i18n/translations.js` dosyasında
- Tercih `localStorage` ile saklanır, yeniden açılınca hatırlanır
- Wikipedia özetleri: önce TR, bulunamazsa EN

---

## Harita Stilleri

Sol panelden 8 farklı altlık harita:

| Stil | Açıklama |
|------|----------|
| **Liberty** | OpenFreeMap varsayılan, detaylı sokak |
| **Bright** | Açık renkli, yüksek kontrast |
| **Fiord** | Koyu, navigasyon odaklı |
| **ESRI Uydu** | Gerçek uydu görüntüsü |
| **ESRI Topo** | Topografik + uydu karışımı |
| **CARTO Voyager** | Açık, minimal |
| **CARTO Koyu** | Koyu, modern |
| **OSM Standart** | Klasik OpenStreetMap |

---

## Teknik Altyapı

| Katman | Teknoloji |
|--------|-----------|
| **Framework** | React 18 |
| **Harita** | MapLibre GL JS 4.7 |
| **Build** | Vite 5 |
| **Tiles** | OpenFreeMap, ESRI, CARTO, AWS Terrain |
| **Geocoding** | Nominatim (OpenStreetMap) |
| **Routing** | OSRM Demo Server |
| **POI / Otel** | Geoapify API |
| **Turistik** | Overpass API |
| **Hava Durumu** | Open-Meteo |
| **Trafik** | Tomtom Flow/Incidents |
| **Clustering** | Supercluster |
| **İkonlar** | Tabler Icons |

### Kurulum

```bash
npm install
```

`.env` dosyası oluştur:
```
VITE_GEOAPIFY_KEY=your_key_here
```

```bash
npm run dev    # Geliştirme sunucusu
npm run build  # Production build
```

---

*Tüm özellikler birlikte ~3500 satır React kodu, 15 custom hook ve 20+ bileşenden oluşmaktadır.*
