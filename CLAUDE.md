# 🎬 VR Cinema ULTRA - Teknik Dokümantasyon

> ⚠️ **DİKKAT:** Bu dokümantasyon manuel olarak güncellenmektedir. Dosyalar güncellenip bu MD güncellenmemiş olabilir. **Her zaman asıl kaynak kodları (js dosyaları, index.html, styles.css, firebase-rules.json) referans alın.** Bu MD sadece genel bakış sağlar.

---

## 📋 İçindekiler
- [Proje Genel Bakış](#proje-genel-bakış)
- [Teknoloji Stack](#teknoloji-stack)
- [Mimari Yapı](#mimari-yapı)
- [Özellikler](#özellikler)
- [Kurulum](#kurulum)
- [Dosya Yapısı](#dosya-yapısı)
- [Firebase Yapılandırması](#firebase-yapılandırması)
- [Önemli Fonksiyonlar](#önemli-fonksiyonlar)
- [Senkronizasyon Mekanizması](#senkronizasyon-mekanizması)
- [P2P (WebTorrent) Desteği](#p2p-webtorrent-desteği)
- [Adaptive Streaming (ABR)](#adaptive-streaming-abr)
- [YouTube 2D Watch Party](#youtube-2d-watch-party)
- [Spatial Audio Sistemi](#spatial-audio-sistemi)
- [Ownership Request Sistemi](#ownership-request-sistemi)
- [Sync Request Sistemi](#sync-request-sistemi)
- [Performans Optimizasyonları](#performans-optimizasyonları)
- [Bilinen Sorunlar ve Çözümler](#bilinen-sorunlar-ve-çözümler)

---

## 🎯 Proje Genel Bakış

**VR Cinema ULTRA**, çoklu kullanıcıların bir arada VR ortamında veya 2D modda senkronize video izleyebileceği bir web uygulamasıdır.

> **📌 TANIM:** Bu dokümantasyondaki **"BİLGİ BANKASI"** terimi, Claude'un document index'indeki `claudesync/` klasöründeki tüm proje dosyalarını ifade eder. Sohbete `/mnt/user-data/uploads/` yoluyla eklenen dosyalar ise **"Ekteki Dosyalar"** olarak anılır.

### Ana Özellikler:
- ✅ Gerçek zamanlı video senkronizasyonu
- ✅ VR desteği (A-Frame)
- ✅ P2P video paylaşımı (WebTorrent)
- ✅ Adaptive streaming (HLS/DASH)
- ✅ **YouTube 2D Watch Party** (VR yok, senkronize izleme)
- ✅ **YouTube Arama** (oda içinde video değiştirme)
- ✅ **Spatial Audio** (3D pozisyonel ses)
- ✅ Otomatik sahiplik transferi
- ✅ Ownership Request sistemi
- ✅ Sync Request sistemi (viewer'dan sync isteği)
- ✅ Buffer yönetimi ve drift düzeltme
- ✅ VR UI Panel (ekran kontrol, ses, video, seek bar)

---

## 🛠️ Teknoloji Stack

### Frontend
- **A-Frame 1.6.0** - VR framework
- **HTML5 Video** - Video oynatma
- **YouTube IFrame API** - YouTube entegrasyonu
- **Web Audio API** - Spatial Audio
- **CSS3** - Stil ve animasyonlar

### Backend & Veritabanı
- **Firebase Realtime Database** - Gerçek zamanlı veri senkronizasyonu
- **Firebase Authentication** - Anonim kullanıcı girişi

### Streaming Teknolojileri
- **HLS.js 1.6.15** - HLS streaming desteği
- **dash.js 5.1.1** - DASH streaming desteği
- **WebTorrent** - P2P video paylaşımı

### Performans & Optimizasyon
- Interval/timeout tracking (memory leak prevention)
- RAF (RequestAnimationFrame) queue
- Firebase batch updates
- DOM element caching

---

## 🏗️ Mimari Yapı

### Modüler JavaScript Yapısı

Proje modüler JavaScript dosyalarına bölünmüştür:

| Dosya | Görev |
|-------|-------|
| ytapi.js | YouTube API Key (obfuscated) |
| js01.js | Temel değişkenler ve konfigürasyon |
| js02.js | Global state yönetimi |
| js03.js | Adaptive streaming yönetimi |
| js04.js | DASH kalite kontrolü |
| js05.js | HLS/DASH setup |
| js06.js | Seek işlemleri |
| js07.js | Firebase init ve helper'lar |
| js08.js | RAF queue ve caching |
| js09.js | Cleanup fonksiyonları |
| js10.js | P2P/YouTube source switching |
| js11.js | P2P client destroy |
| js12.js | P2P seeding (yayıncı) |
| js13.js | P2P joining (izleyici) |
| js14.js | P2P UI güncellemeleri |
| js15.js | Dosya seçme event'leri |
| js16.js | Full cleanup |
| js17.js | Firebase batch updates |
| js18.js | Oda oluşturma |
| js19.js | Odaya katılma |
| js20.js | Sahiplik transferi (otomatik) |
| js21.js | Odadan ayrılma |
| js22.js | Oda listesi gösterme |
| js23.js | UI geçişleri |
| js24-01.js | 3D sahne oluşturma (VR) |
| js24-02.js | YouTube 2D sahne oluşturma |
| js25.js | VR buton yönetimi |
| js26.js | Video oynatma |
| js27.js | Video duraklama |
| js28-01.js | Sync başlatma, sync request |
| js28-02.js | Sync request onay/red |
| js29.js | Sync state uygulama |
| js30.js | Sync countdown (deprecated) |
| js31.js | Sync execution (deprecated) |
| js32.js | Sync state temizleme |
| js33.js | Video state dinleme |
| js34.js | Video senkronizasyonu |
| js35.js | Video state listener |
| js36.js | Keyframe gönderme |
| js37.js | Keyframe dinleme |
| js38.js | Drift tracking |
| js39.js | Sahip kontrolü |
| js40.js | Periodic tasks ve init |
| js41-01.js | VR UI Panel (butonlar) |
| js41-02.js | VR UI Panel (seek bar, fonksiyonlar) |
| js42-01.js | Ownership Request (gönderme, dinleme) |
| js42-02.js | Ownership Request (kabul/red) |
| js43-01.js | Spatial Audio (init, update) |
| js43-02.js | Spatial Audio (UI button) |
| js44-01.js | YouTube player oluşturma |
| js44-02.js | YouTube kontroller (play/pause/seek) |
| js44-03.js | YouTube sync (viewer) |
| js44-04.js | YouTube UI container |
| js44-05.js | YouTube unmute overlay |
| js45.js | YouTube Arama sistemi |

---

## ⚙️ Özellikler

### 1. Video Senkronizasyonu
- Gerçek zamanlı oynatma durumu senkronizasyonu
- Drift düzeltme (3 seviyeli: TIER1, TIER2, TIER3)
- Hard seek mekanizması (9+ saniye sapma)
- Buffer-wait sistemi

### 2. P2P Video Paylaşımı
- WebTorrent ile peer-to-peer video aktarımı
- Magnet URI oluşturma ve paylaşma
- İndirme/yükleme progress tracking
- Peer sayısı gösterimi

### 3. Adaptive Streaming
- HLS (.m3u8) desteği
- DASH (.mpd) desteği
- Kalite sınırlama (360p, 480p, 720p)
- Otomatik bandwidth adaptasyonu

### 4. VR Özellikleri
- A-Frame tabanlı VR ortamı
- VR kontrolör desteği
- Raycaster ile etkileşim
- 3 farklı ekran boyutu (Orta, Büyük, IMAX)
- **Spatial Audio** (3D pozisyonel ses)

### 5. YouTube 2D Watch Party
- YouTube IFrame API entegrasyonu
- VR desteklenmiyor (sadece 2D)
- Senkronize izleme
- **Oda içi YouTube arama** (owner video değiştirebilir)
- Autoplay policy workaround (muted başlatma + unmute overlay)

### 6. Sahiplik ve Sync Sistemleri
- Oda sahibi ayrılınca otomatik transfer
- **Ownership Request** - kullanıcılar sahiplik isteyebilir
- **Sync Request** - viewer'lar sync başlatabilir (owner onayı ile)

---

## 📦 Kurulum

### Gereksinimler
- Modern web tarayıcı (Chrome, Firefox, Edge)
- Firebase projesi
- YouTube Data API v3 key (arama için)

### Adımlar

1. **Firebase Projesi Oluşturma**
```javascript
const firebaseConfig = {
    apiKey: "AIzaSyC60idSLdAiqAjPWAOMaM3g8LAKPGEUwH8",
    authDomain: "vr-sinema.firebaseapp.com",
    databaseURL: "https://vr-sinema-default-rtdb.firebaseio.com",
    projectId: "vr-sinema",
    storageBucket: "vr-sinema.firebasestorage.app",
    messagingSenderId: "724648238300",
    appId: "1:724648238300:web:dceba8c536e8a5ffd96819"
};
```

2. **YouTube API Key** (ytapi.js içinde obfuscated)

3. **Firebase Rules Ayarlama**
```bash
firebase deploy --only database
```

---

## 📁 Dosya Yapısı

```
claudesync/                 # ← BİLGİ BANKASI (Ana Proje)
├── index.html              # Ana HTML dosyası
├── styles.css              # CSS stilleri
├── firebase-rules.json     # Firebase güvenlik kuralları
├── CLAUDE.md               # Proje dokümantasyonu
├── ytapi.js                # YouTube API Key
├── js01.js - js45.js       # JavaScript modülleri
└── deneme.html             # Test dosyası
```

---

## 🔥 Firebase Yapılandırması

### Veritabanı Yapısı

```
rooms/
  └── $roomId/
      ├── name: string
      ├── owner: string (userId)
      ├── videoUrl: string
      ├── screenSize: "medium" | "large" | "imax"
      ├── environment: "none" | "minimal"
      ├── createdAt: timestamp
      ├── p2p/
      │   ├── magnetURI: string
      │   ├── fileName: string
      │   └── fileSize: number
      ├── youtube/
      │   ├── videoId: string
      │   └── originalUrl: string
      ├── activeViewers/
      │   └── $userId/
      │       ├── joinedAt: timestamp
      │       ├── lastSeen: timestamp
      │       ├── isOwner: boolean
      │       ├── currentDrift: number
      │       └── currentPosition: number
      ├── videoState/
      │   ├── isPlaying: boolean
      │   ├── currentTime: number
      │   ├── startTimestamp: number
      │   └── lastUpdate: timestamp
      ├── keyframes/
      │   └── $keyframeId/
      │       ├── time: number
      │       └── timestamp: timestamp
      ├── syncState/
      │   ├── syncedSeekPosition: number
      │   ├── playAtTime: number
      │   ├── initiatedBy: string
      │   └── initiatedAt: timestamp
      ├── syncRequests/
      │   └── $userId/
      │       ├── fromUid: string
      │       ├── currentPosition: number
      │       ├── timestamp: timestamp
      │       ├── status: "pending" | "rejected"
      │       └── expiresAt: number
      └── ownershipRequests/
          └── $requestId/
              ├── fromUid: string
              ├── timestamp: timestamp
              ├── status: "pending" | "accepted" | "rejected"
              └── expiresAt: number
```

---

## 🎬 YouTube 2D Watch Party

**js44-01.js ~ js44-05.js** ve **js45.js** dosyalarında implement edilmiştir.

### Özellikler
- YouTube IFrame API ile video oynatma
- VR desteklenmiyor (A-Frame gizlenir)
- Senkronize play/pause/seek
- Autoplay policy workaround (muted + unmute overlay)
- **Oda içi arama** - owner video değiştirebilir

### State Değişkenleri (js02.js)
```javascript
let ytPlayer = null;
let ytPlayerReady = false;
let isYouTubeMode = false;
let youtubeVideoId = null;
let lastYTSyncTime = 0;
let lastYTSeekTime = 0;
const YT_SEEK_COOLDOWN = 3000;
```

---

## 🎧 Spatial Audio Sistemi

**js43-01.js** ve **js43-02.js** dosyalarında implement edilmiştir.

### Özellikler
- Web Audio API ile 3D pozisyonel ses
- HRTF panning model
- Kamera pozisyonuna göre ses yönü
- Toggle butonu (3D Ses / Stereo)

### Fonksiyonlar
| Fonksiyon | Görev |
|-----------|-------|
| `initSpatialAudio(videoEl)` | Spatial audio başlatır |
| `updateSpatialAudio()` | Pozisyon günceller |
| `toggleSpatialAudio()` | 3D/Stereo geçişi |
| `cleanupSpatialAudio()` | Temizlik |

---

## 🔄 Sync Request Sistemi

**js28-01.js** ve **js28-02.js** dosyalarında implement edilmiştir.

### Özellikler
- Viewer'lar sync başlatabilir (owner onayı gerekir)
- Owner direkt sync başlatır
- Modal ile onay/red
- 30 saniye timeout

### Sabitler
```javascript
const SYNC_REQUEST_TIMEOUT = 30000;
const SYNC_PLAY_DELAY = 3000;
```

---

## 🙋 Ownership Request Sistemi

**js42-01.js** ve **js42-02.js** dosyalarında implement edilmiştir.

### Özellikler
- Katılımcılar sahiplik talep edebilir
- 60 saniye timeout, 2 dakika cooldown

---

## 📊 Sabitler

```javascript
const SYNCCHECKINTERVAL = 750;
const KEYFRAME_INTERVAL = 10000;
const CLOCK_SYNC_INTERVAL = 60000;
const DRIFT_UPDATE_INTERVAL = 10000;
const PRESENCE_UPDATE_INTERVAL = 30000;
const PRELOAD_BUFFER_SECONDS = 9;

const TIER1_THRESHOLD = 300;
const TIER2_THRESHOLD = 800;
const TIER3_THRESHOLD = 1500;
const LARGE_DRIFT_THRESHOLD = 9000;

const OWNERSHIP_REQUEST_TIMEOUT = 60000;
const OWNERSHIP_REQUEST_COOLDOWN = 120000;
const SYNC_REQUEST_TIMEOUT = 30000;
const SYNC_PLAY_DELAY = 3000;
const YT_SEEK_COOLDOWN = 3000;
```

---

## 🚀 Deployment

### Namecheap Hosting
- Domain: `https://vr-sinema.online`

### GitHub Pages
- Repository: `recinilt/mefeypublicv2`
- URL: `https://recinilt.github.io/mefeypublicv2/`

---

**Versiyon:** 4.0  
**Son Güncelleme:** Ocak 2025