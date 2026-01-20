let isSeeking = false;
        let isHardSeeking = false; // ✅ FIX: syncVideo ve listenKeyframes çakışmasını önlemek için

        
        // ==================== CONFIG ====================
        // Firebase Yapılandırması
const firebaseConfig = {
    apiKey: "AIzaSyC60idSLdAiqAjPWAOMaM3g8LAKPGEUwH8",
    authDomain: "vr-sinema.firebaseapp.com",
    databaseURL: "https://vr-sinema-default-rtdb.firebaseio.com",
    projectId: "vr-sinema",
    storageBucket: "vr-sinema.firebasestorage.app",
    messagingSenderId: "724648238300",
    appId: "1:724648238300:web:dceba8c536e8a5ffd96819"
};
        
        // ==================== OPTIMIZED CONSTANTS ====================
        const SYNCCHECKINTERVAL = 750; // ✅ FIX: drift timing sorunu için artırıldı
        const KEYFRAME_INTERVAL = 10000;
        const CLOCK_SYNC_INTERVAL = 60000;
        const DRIFT_UPDATE_INTERVAL = 10000;
        const PRESENCE_UPDATE_INTERVAL = 30000;
        const CLEANUP_INTERVAL = 10000;
        const PLAY_BUFFER_TIME = 5000;
        const PRELOAD_BUFFER_SECONDS = 9; // ✅ FIX: 7 -> 9 saniye buffer
        
        // Optimized thresholds
        const TIER1_THRESHOLD = 300;
        const TIER2_THRESHOLD = 800;
        const TIER3_THRESHOLD = 1500;
        const TIER2_LAGGING_SPEED = 1.05;
        const TIER3_LAGGING_SPEED = 1.15;
        
        // Hard seek throttle sabitleri
        const LARGE_DRIFT_THRESHOLD = 2000; // ✅ FIX: YouTube gibi 2sn sonra hard seek
        const HARD_SEEK_MIN_INTERVAL = 3000; // ✅ FIX: YouTube gibi 3sn cooldown
        
        const OWNER_PRESENCE_UPDATE_INTERVAL = 30000;
        const OWNER_PRESENCE_TIMEOUT = 45000;
        const DEBUG_MODE = true;
        
        // ==================== GLOBAL STATE ====================
        let db, auth, currentUser, currentRoomId, currentRoomData;
        let videoElement, isRoomOwner = false;
        let clockOffset = 0;
        
        // Interval tracking for cleanup (Memory Leak Prevention)
        const activeIntervals = [];
        const activeTimeouts = [];
        const firebaseListeners = [];
        
        // Performance optimization
        let lastDriftValue = null;
        let lastFirebaseUpdate = 0;
        let lastUIUpdate = 0;
        
        // Hard seek throttle tracking
        let lastHardSeekTime = 0;
        let lastSyncedPosition = 0;
        
        // Command source tracking (to prevent self-triggering)
        let lastCommandSource = null;