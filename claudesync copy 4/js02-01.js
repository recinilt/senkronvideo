// Sync mechanism
        let syncState = null;
        let countdownInterval = null;
        let syncTimeoutId = null;
        let lastSyncCheck = 0;
        
        // Buffer countdown system
        let bufferCountdownInterval = null;
        let bufferTargetTime = null;
        let isBuffering = false;
        
        // Cached DOM elements
        let cachedElements = {};
        
        // Firebase batch updates
        let pendingFirebaseUpdates = {};
        let firebaseBatchTimeout = null;

        // ✅ FIX #3: joinRoom yarışması önleme
        let isJoiningRoom = false;
        
        // ✅ FIX #8: onDisconnect referansı
        let currentOnDisconnectRef = null;
        
        // ✅ FIX #7: hashchange listener referansı
        let hashChangeHandler = null;

        // ✅ FIX: Scene ve keyboard listener referansları (cleanup için)
        let sceneEnterVRHandler = null;
        let sceneExitVRHandler = null;
        let keydownHandler = null;

        let seekDebounceTimer = null;
        let pendingSeekAmount = 0;
        let pendingSeekDirection = null;
        let syncModeActive = false;
        let seekTimeoutId = null;
        let commandSourceTimeoutId = null;
        let videoStateUpdateDebounce = null;

        // ✅ VR UI Panel değişkenleri
        let screenPosition = { x: 0, y: 2, z: -10 };
        let currentScreenScale = 1.0;
        let seekBarUpdateInterval = null;
        const VR_UI_CONFIG = {
            position: { x: -5, y: 1.6, z: -3 },
            rotation: { x: 0, y: 90, z: 0 },
            scale: 0.7,
            buttonSize: 0.28,
            seekBarWidth: 1.8
        };

        // ✅ MEMORY LEAK FIX: Object URL tracking
        let currentVideoObjectURL = null;

        // ✅ Owner transfer tracking
        let ownerTransferInProgress = false;

        // ==================== P2P WebTorrent STATE ====================
        let p2pClient = null;
        let currentTorrent = null;
        let selectedLocalFile = null;
        let currentVideoSourceType = 'url'; // 'url', 'local' veya 'youtube'
        let p2pUpdateInterval = null;
        
        // ✅ YENİ: P2P download tamamlandı mı?
        let isP2PDownloadComplete = false;
        
        // WebTorrent Tracker URLs
        const WEBTORRENT_TRACKERS = [
            'wss://tracker.btorrent.xyz',
            'wss://tracker.openwebtorrent.com',
            'wss://tracker.webtorrent.dev'
        ];

// ==================== ADAPTIVE STREAMING (ABR) ====================
let hlsInstance = null;
let dashInstance = null;

// Start as low as possible, cap max at <= 720p (user adjustable)
const QUALITY_CAPS = [360, 480, 720];
let abrMaxHeightCap = 720;

function getStreamType(url) {
    const u = (url || '').split('?')[0].toLowerCase();
    if (u.endsWith('.m3u8')) return 'hls';
    if (u.endsWith('.mpd')) return 'dash';
    return 'native';
}

// ==================== OWNERSHIP REQUEST STATE ====================
let ownershipRequestListener = null;
let ownershipRequestTimeoutInterval = null;
let lastOwnershipRequestTime = 0;
let pendingOwnershipRequest = null;
let currentRequestModal = null;