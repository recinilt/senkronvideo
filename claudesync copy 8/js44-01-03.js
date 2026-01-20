const YT_SEEK_COOLDOWN = 3000; // 3 saniye

// YouTube player state değişikliği
function onYTPlayerStateChange(event) {
    if (!ytPlayer || !ytPlayerReady) return;
    
    // State değerleri:
    // -1: unstarted, 0: ended, 1: playing, 2: paused, 3: buffering, 5: video cued
    
    const state = event.data;
    debugLog('🎬 YouTube state:', state);
    
    // ✅ FIX: Player PLAYING veya PAUSED durumuna geçtiğinde ilk sync yap
    if (!isRoomOwner && (state === YT.PlayerState.PLAYING || state === YT.PlayerState.PAUSED)) {
        // State değiştiğinde hemen bir sync dene
        lastYTSeekTime = 0; // Cooldown'ı sıfırla
        syncYouTubeVideo();
    }
    
    // ✅ YENİ: Video bittiğinde (ENDED) - hem owner hem viewer için
    if (state === YT.PlayerState.ENDED) {
        debugLog('🏁 YouTube video ended');
        
        if (isRoomOwner) {
            // Owner: Firebase'e yaz, herkes sync olsun
            lastCommandSource = 'self';
            
            // Önce 0'a seek
            ytPlayer.seekTo(0, true);
            
            // 500ms sonra pause
            trackTimeout(setTimeout(() => {
                ytPlayer.pauseVideo();
                
                // Firebase güncelle
                db.ref('rooms/' + currentRoomId + '/videoState').update({
                    isPlaying: false,
                    currentTime: 0,
                    startTimestamp: getServerTime(),
                    lastUpdate: firebase.database.ServerValue.TIMESTAMP
                });
                
                debugLog('🏁 Video ended: seek to 0 and paused (owner)');
                
                trackTimeout(setTimeout(() => {
                    lastCommandSource = null;
                }, 300));
            }, 500));
            
        } else {
            // Viewer: Lokal olarak 0'a seek ve pause (Firebase sync de yapacak)
            ytPlayer.seekTo(0, true);
            
            trackTimeout(setTimeout(() => {
                ytPlayer.pauseVideo();
                debugLog('🏁 Video ended: seek to 0 and paused (viewer)');
            }, 500));
        }
        
        return; // ENDED işlendi, devam etme
    }
    
    // Sadece owner'ın aksiyonları Firebase'e gönderilir
    if (!isRoomOwner) return;
    
    // Kendi komutumuzdan gelen değişiklikse ignore et
    if (lastCommandSource === 'self') return;
    
    // Sync mode aktifse ignore et
    if (syncModeActive) return;
    
    if (state === YT.PlayerState.PLAYING) {
        // Video oynatıldı
        const serverTime = getServerTime();
        const currentTime = ytPlayer.getCurrentTime();
        
        db.ref('rooms/' + currentRoomId + '/videoState').update({
            isPlaying: true,
            currentTime: currentTime,
            startTimestamp: serverTime,
            lastUpdate: firebase.database.ServerValue.TIMESTAMP
        });
        
        debugLog('▶️ YouTube playing, time:', currentTime);
        
    } else if (state === YT.PlayerState.PAUSED) {
        // Video duraklatıldı
        const currentTime = ytPlayer.getCurrentTime();
        
        db.ref('rooms/' + currentRoomId + '/videoState').update({
            isPlaying: false,
            currentTime: currentTime,
            startTimestamp: getServerTime(),
            lastUpdate: firebase.database.ServerValue.TIMESTAMP
        });
        
        debugLog('⏸️ YouTube paused, time:', currentTime);
    }
}