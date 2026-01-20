const OWNERSHIP_REQUEST_TIMEOUT = 60000; // 60 saniye
const OWNERSHIP_REQUEST_COOLDOWN = 120000; // 2 dakika

// ==================== SYNC REQUEST STATE ====================
let syncRequestListener = null;
let currentSyncRequestModal = null;
let pendingSyncRequest = null;
let syncPlayAtTimeTimeout = null;
const SYNC_REQUEST_TIMEOUT = 30000; // 30 saniye
const SYNC_PLAY_DELAY = 3000; // 3 saniye sonra başlat

// ==================== YOUTUBE STATE ====================
let ytPlayer = null;
let ytPlayerReady = false;
let isYouTubeMode = false;
let youtubeVideoId = null;
let ytApiLoaded = false;
let ytPlayerStateInterval = null;
let lastYTSyncTime = 0;

// ==================== YOUTUBE SEARCH API ====================
// ⚠️ Google Cloud Console'dan API key alıp buraya yapıştır
// https://console.cloud.google.com → APIs & Services → Credentials → Create API Key
// YouTube Data API v3'ü etkinleştirmeyi unutma!
//const YOUTUBE_API_KEY = 'YOUR_API_KEY_HERE'; ytapi.js dosyasından alınıyor

// Arama state
let ytSearchResults = [];
let ytSearchLoading = false;