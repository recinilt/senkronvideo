
// Arama sonucundan video seç
async function selectYTSearchResult(videoId, title) {
    if (!isRoomOwner) {
        alert('Sadece oda sahibi video değiştirebilir');
        return;
    }
    
    if (!videoId) return;
    
    debugLog('🎬 Seçilen video:', videoId, title);
    
    // Arama sonuçlarını gizle
    hideYTSearchResults();
    
    // Arama inputunu temizle
    const searchInput = document.getElementById('yt-search-input');
    if (searchInput) searchInput.value = '';
    
    try {
        // Firebase'de YouTube video bilgilerini güncelle
        await db.ref('rooms/' + currentRoomId).update({
            'youtube/videoId': videoId,
            'videoState/isPlaying': false,
            'videoState/currentTime': 0,
            'videoState/startTimestamp': getServerTime(),
            'videoState/lastUpdate': firebase.database.ServerValue.TIMESTAMP
        });
        
        // ✅ FIX: Player yoksa oluştur
        if (!ytPlayer || !ytPlayerReady) {
            debugLog('🎬 Player yok, oluşturuluyor...');
            
            try {
                await createYouTubePlayer(videoId, 'youtube-player-container');
                
                // Kontrolleri ayarla
                updateYouTubeControls();
                
                // Sync interval başlat
                startYouTubeSyncInterval();
                
                // Video değişikliği dinle
                if (typeof listenYouTubeVideoChange === 'function') {
                    listenYouTubeVideoChange();
                }
                
                debugLog('✅ Player oluşturuldu ve video yüklendi');
                
            } catch (error) {
                console.error('Player oluşturma hatası:', error);
                showYouTubeError(error.message);
            }
        } else {
            // Player var, sadece videoyu değiştir
            ytPlayer.loadVideoById(videoId);
            ytPlayer.pauseVideo();
            debugLog('✅ Video değiştirildi (mevcut player)');
        }
        
        // Lokal state güncelle
        youtubeVideoId = videoId;
        if (currentRoomData && currentRoomData.youtube) {
            currentRoomData.youtube.videoId = videoId;
        }
        
        debugLog('✅ Video değiştirildi:', videoId);
        
    } catch (error) {
        console.error('Video değiştirme hatası:', error);
        alert('Video değiştirilemedi: ' + error.message);
    }
}

// Arama sonuçlarını gizle
function hideYTSearchResults() {
    const container = document.getElementById('yt-search-results');
    if (container) {
        container.style.display = 'none';
        container.innerHTML = '';
    }
    ytSearchResults = [];
}

// Arama hatası göster
function showYTSearchError(message) {
    const container = document.getElementById('yt-search-results');
    if (!container) return;
    
    container.innerHTML = `<div class="yt-search-error">${escapeHtml(message)}</div>`;
    container.style.display = 'block';
}