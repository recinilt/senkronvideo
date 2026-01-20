
// ==================== YOUTUBE PLAYER CREATION ====================

// YouTube player oluştur
async function createYouTubePlayer(videoId, containerId) {
    if (!videoId) {
        console.error('YouTube video ID gerekli');
        return null;
    }
    
    containerId = containerId || 'youtube-player-container';
    
    try {
        await loadYouTubeAPI();
        
        // ✅ FIX: Sadece player'ı temizle, container'ı silme!
        cleanupYouTubePlayerOnly();
        
        return new Promise((resolve, reject) => {
            // Container var mı kontrol et
            const container = document.getElementById(containerId);
            if (!container) {
                reject(new Error('YouTube player container bulunamadı: ' + containerId));
                return;
            }
            
            debugLog('🎬 Creating YT.Player for container:', containerId, 'videoId:', videoId);
            
            ytPlayer = new YT.Player(containerId, {
                height: '100%',
                width: '100%',
                videoId: videoId,
                playerVars: {
                    'autoplay': 1, // ✅ FIX: Muted autoplay için
                    'mute': 1, // ✅ KRİTİK: Muted başla - autoplay için zorunlu
                    'controls': 1,
                    'disablekb': 0, // Klavye kontrolleri açık
                    'enablejsapi': 1,
                    'fs': 1, // Fullscreen butonu açık
                    'iv_load_policy': 3, // Annotations kapalı
                    'modestbranding': 1,
                    'rel': 0, // İlgili videoları gösterme
                    'playsinline': 1,
                    'origin': window.location.origin
                },
                events: {
                    'onReady': (event) => {
                        ytPlayerReady = true;
                        debugLog('✅ YouTube player ready');
                        
                        // ✅ FIX: Sadece kontrolleri güncelle, state sync'i interval'a bırak
                        updateYouTubeControls();
                        
                        // ✅ FIX: Unmute overlay'i göster (user gesture için)
                        showUnmuteOverlay();
                        
                        resolve(ytPlayer);
                    },
                    'onStateChange': onYTPlayerStateChange,
                    'onError': (event) => {
                        console.error('YouTube player error:', event.data);
                        const errorMessages = {
                            2: 'Geçersiz video ID',
                            5: 'HTML5 player hatası',
                            100: 'Video bulunamadı veya özel',
                            101: 'Video gömülmeye izin vermiyor',
                            150: 'Video gömülmeye izin vermiyor'
                        };
                        const msg = errorMessages[event.data] || 'Bilinmeyen hata';
                        showYouTubeError(msg);
                    }
                }
            });
            
            // Timeout
            setTimeout(() => {
                if (!ytPlayerReady) {
                    reject(new Error('YouTube player oluşturma zaman aşımı'));
                }
            }, 15000);
        });
        
    } catch (error) {
        console.error('YouTube player creation error:', error);
        throw error;
    }
}

// ==================== YOUTUBE PLAYER EVENTS ====================

// ✅ FIX: Seek throttle için değişken
let lastYTSeekTime = 0;