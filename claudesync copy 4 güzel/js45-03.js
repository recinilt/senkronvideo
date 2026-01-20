
// Arama UI durumunu güncelle
function updateYTSearchUI(state) {
    const btn = document.getElementById('yt-search-btn');
    const input = document.getElementById('yt-search-input');
    
    if (state === 'loading') {
        if (btn) {
            btn.disabled = true;
            btn.textContent = '⏳';
        }
        if (input) input.disabled = true;
    } else {
        if (btn) {
            btn.disabled = false;
            btn.textContent = '🔍';
        }
        if (input) input.disabled = false;
    }
}

// HTML escape (XSS önleme)
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ==================== YOUTUBE VIDEO CHANGE LISTENER ====================

// Viewer'lar için: Video değişikliğini dinle
function listenYouTubeVideoChange() {
    if (!currentRoomId) return;
    
    const ref = db.ref('rooms/' + currentRoomId + '/youtube/videoId');
    trackListener(ref);
    
    ref.on('value', async (snapshot) => {
        const newVideoId = snapshot.val();
        
        if (!newVideoId) return;
        
        // Aynı video ise ignore et
        if (newVideoId === youtubeVideoId) return;
        
        debugLog('🔄 YouTube video değişti:', newVideoId);
        
        // Lokal state güncelle
        youtubeVideoId = newVideoId;
        if (currentRoomData && currentRoomData.youtube) {
            currentRoomData.youtube.videoId = newVideoId;
        }
        
        // ✅ FIX: Player yoksa oluştur (viewer için de)
        if (!ytPlayer || !ytPlayerReady) {
            debugLog('🎬 Viewer: Player yok, oluşturuluyor...');
            
            try {
                await createYouTubePlayer(newVideoId, 'youtube-player-container');
                updateYouTubeControls();
                startYouTubeSyncInterval();
                debugLog('✅ Viewer: Player oluşturuldu');
            } catch (error) {
                console.error('Viewer player oluşturma hatası:', error);
                showYouTubeError(error.message);
            }
        } else {
            // Player var, videoyu güncelle
            ytPlayer.loadVideoById(newVideoId);
            
            // Owner değilsek pause'da bekle
            if (!isRoomOwner) {
                ytPlayer.pauseVideo();
            }
        }
    });
}

// ==================== SEARCH INPUT HANDLERS ====================

// Enter tuşu ile arama
function handleYTSearchKeydown(event) {
    // ✅ FIX: Tüm tuşlara izin ver (boşluk dahil), sadece Enter ve Escape'i yakala
    if (event.key === 'Enter') {
        event.preventDefault();
        const input = document.getElementById('yt-search-input');
        if (input && input.value.trim()) {
            searchYouTube(input.value);
        }
    } else if (event.key === 'Escape') {
        hideYTSearchResults();
    }
    // Diğer tüm tuşlar (boşluk dahil) normal davranır
}