// YouTube sync interval başlat
function startYouTubeSyncInterval() {
    if (ytPlayerStateInterval) {
        clearInterval(ytPlayerStateInterval);
    }
    
    ytPlayerStateInterval = setInterval(() => {
        if (!isRoomOwner && ytPlayer && ytPlayerReady) {
            syncYouTubeVideo();
        }
        updateYouTubeTimeDisplay();
    }, 500);
    
    trackInterval(ytPlayerStateInterval);
    debugLog('✅ YouTube sync interval started');
}

// YouTube zaman göstergesini güncelle
function updateYouTubeTimeDisplay() {
    if (!ytPlayer || !ytPlayerReady) return;
    
    // ✅ FIX: Player state kontrolü - UNSTARTED durumunda güvenilir değer alamayız
    const ytState = ytPlayer.getPlayerState();
    if (ytState === -1) return;
    
    const currentTime = ytPlayer.getCurrentTime();
    const duration = ytPlayer.getDuration();
    
    const timeDisplay = document.getElementById('youtube-time-display');
    if (timeDisplay) {
        timeDisplay.textContent = formatTime(currentTime) + ' / ' + formatTime(duration);
    }
    
    // Progress bar güncelle
    const progressBar = document.getElementById('youtube-progress-fill');
    if (progressBar && duration > 0) {
        const percent = (currentTime / duration) * 100;
        progressBar.style.width = percent + '%';
    }
}