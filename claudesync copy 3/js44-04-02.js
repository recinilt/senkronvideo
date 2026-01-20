
// YouTube room info güncelle
function updateYouTubeRoomInfo() {
    const roomName = document.getElementById('youtube-room-name');
    const viewerCount = document.getElementById('youtube-viewer-count');
    
    if (roomName && currentRoomData) {
        roomName.textContent = currentRoomData.name + (isRoomOwner ? ' 👑' : '');
    }
    
    if (viewerCount && currentRoomId) {
        db.ref('rooms/' + currentRoomId + '/activeViewers').once('value')
            .then(snapshot => {
                const count = snapshot.numChildren();
                viewerCount.textContent = `👥 ${count} izleyici`;
            })
            .catch(() => {});
    }
    
    // ✅ YENİ: Arama bölümünü owner'a göster
    updateYTSearchVisibility();
}

// ✅ YENİ: Arama bölümü görünürlüğünü ayarla
function updateYTSearchVisibility() {
    const searchContainer = document.getElementById('yt-search-container');
    if (searchContainer) {
        if (isRoomOwner) {
            searchContainer.style.display = 'block';
        } else {
            searchContainer.style.display = 'none';
        }
    }
}

// YouTube kontrol butonlarını owner/viewer'a göre ayarla
function updateYouTubeControls() {
    const ownerOnlyButtons = ['yt-btn-play', 'yt-btn-pause', 'yt-btn-stop', 'yt-btn-rewind', 'yt-btn-forward'];
    
    ownerOnlyButtons.forEach(id => {
        const btn = document.getElementById(id);
        if (btn) {
            btn.disabled = !isRoomOwner;
            btn.style.opacity = isRoomOwner ? '1' : '0.5';
            btn.style.cursor = isRoomOwner ? 'pointer' : 'not-allowed';
        }
    });
    
    // Sahiplik iste butonu
    const requestBtn = document.getElementById('yt-btn-request-ownership');
    if (requestBtn) {
        requestBtn.disabled = isRoomOwner;
        requestBtn.style.opacity = isRoomOwner ? '0.5' : '1';
        requestBtn.textContent = isRoomOwner ? '👑 Oda Sahibisin' : '🙋 Sahiplik İste';
    }
    
    // ✅ YENİ: Arama görünürlüğünü güncelle
    updateYTSearchVisibility();
}

// ==================== YOUTUBE CLEANUP ====================

// ✅ FIX: Sadece player'ı temizle, container'ı silme
function cleanupYouTubePlayerOnly() {
    if (ytPlayerStateInterval) {
        clearInterval(ytPlayerStateInterval);
        ytPlayerStateInterval = null;
    }
    
    if (ytPlayer) {
        try {
            ytPlayer.destroy();
        } catch (e) {
            console.warn('YouTube player destroy error:', e);
        }
        ytPlayer = null;
    }
    
    ytPlayerReady = false;
    lastYTSeekTime = 0; // ✅ FIX: Seek cooldown'ı sıfırla
    debugLog('🧹 YouTube player only cleanup (container preserved)');
}