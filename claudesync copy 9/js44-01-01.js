// ============================================
// YOUTUBE IFRAME API WRAPPER
// 2D Watch Party modu için YouTube player
// VR desteği yok - sadece 2D senkronize izleme
// ============================================

// ==================== YOUTUBE API LOADING ====================

// YouTube IFrame API'yi yükle
function loadYouTubeAPI() {
    return new Promise((resolve, reject) => {
        if (ytApiLoaded) {
            resolve();
            return;
        }
        
        if (window.YT && window.YT.Player) {
            ytApiLoaded = true;
            resolve();
            return;
        }
        
        // Global callback fonksiyonu
        window.onYouTubeIframeAPIReady = () => {
            ytApiLoaded = true;
            debugLog('✅ YouTube IFrame API loaded');
            resolve();
        };
        
        // API script'ini yükle
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        tag.onerror = () => reject(new Error('YouTube API yüklenemedi'));
        
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        
        // Timeout
        setTimeout(() => {
            if (!ytApiLoaded) {
                reject(new Error('YouTube API yükleme zaman aşımı'));
            }
        }, 10000);
    });
}