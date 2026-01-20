
// YouTube player ve container'ı tamamen temizle
function destroyYouTubePlayer() {
    // Önce player'ı temizle
    cleanupYouTubePlayerOnly();
    
    // 2D container'ı kaldır
    const container = document.getElementById('youtube-2d-container');
    if (container) {
        container.remove();
    }
    
    // A-Frame sahnesini tekrar göster
    const scene = document.querySelector('a-scene');
    if (scene) {
        scene.style.display = 'block';
    }
    
    debugLog('🧹 YouTube player destroyed');
}

// ✅ FIX: YouTube modu aktif mi kontrol et
// videoId boş olsa bile youtube objesi varsa YouTube modundayız
function checkYouTubeMode() {
    if (!currentRoomData) return false;
    // youtube objesi varsa (videoId boş olsa bile) YouTube modundayız
    return currentRoomData.youtube !== undefined && currentRoomData.youtube !== null;
}