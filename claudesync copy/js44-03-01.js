
// ✅ FIX: YouTube video senkronizasyonu (viewer için) - Tamamen yeniden yazıldı
function syncYouTubeVideo() {
    // Owner sync yapmaz
    if (isRoomOwner) return;
    
    // Player hazır değilse çık
    if (!ytPlayer || !ytPlayerReady) return;
    
    // Room data yoksa çık
    if (!currentRoomData || !currentRoomData.videoState) return;
    
    // Sync mode aktifse çık
    if (syncModeActive) return;
    
    // ✅ FIX: Player state kontrolü - UNSTARTED, BUFFERING, CUED durumlarında sync yapma
    const ytState = ytPlayer.getPlayerState();
    
    // -1: UNSTARTED, 3: BUFFERING, 5: CUED - bu durumlarda seekTo() güvenilir çalışmaz
    if (ytState === -1 || ytState === 3 || ytState === 5) {
        // Sadece play/pause senkronizasyonu yap, seek yapma
        const state = currentRoomData.videoState;
        
        if (state.isPlaying && ytState !== 1) {
            ytPlayer.playVideo();
            debugLog('▶️ YouTube: Trying to start playback (state:', ytState, ')');
            
            // 500ms sonra kontrol et - başlamadıysa mute edip tekrar dene
            trackTimeout(setTimeout(() => {
                if (ytPlayer && ytPlayerReady && currentRoomData && currentRoomData.videoState && currentRoomData.videoState.isPlaying) {
                    const checkState = ytPlayer.getPlayerState();
                    if (checkState !== YT.PlayerState.PLAYING && checkState !== YT.PlayerState.BUFFERING) {
                        debugLog('⚠️ YouTube: initial play failed, trying muted');
                        ytPlayer.mute();
                        ytPlayer.playVideo();
                        showUnmuteOverlay();
                    }
                }
            }, 500));
        }
        return; // Seek yapmadan çık
    }
    
    // ✅ FIX: Throttle - çok sık sync yapma
    const now = Date.now();
    if (now - lastYTSyncTime < 500) return;
    lastYTSyncTime = now;
    
    const state = currentRoomData.videoState;
    const serverTime = getServerTime();
    
    // Hedef zamanı hesapla
    let expectedTime = state.currentTime;
    if (state.isPlaying) {
        const elapsed = (serverTime - state.startTimestamp) / 1000;
        if (isFinite(elapsed) && elapsed >= 0 && elapsed < 86400) {
            expectedTime = state.currentTime + elapsed;
        }
    }
    
    // Mevcut zamanı al
    const currentTime = ytPlayer.getCurrentTime();
    const drift = Math.abs(currentTime - expectedTime) * 1000;
    
    // Play/Pause senkronizasyonu
    const isYTPlaying = ytState === YT.PlayerState.PLAYING;
    
    if (state.isPlaying && !isYTPlaying) {
        // ✅ FIX: Autoplay policy workaround
        ytPlayer.playVideo();
        debugLog('▶️ YouTube sync: play attempt');
        
        // 500ms sonra kontrol et - başlamadıysa mute edip tekrar dene
        trackTimeout(setTimeout(() => {
            if (ytPlayer && ytPlayerReady && currentRoomData && currentRoomData.videoState && currentRoomData.videoState.isPlaying) {
                const checkState = ytPlayer.getPlayerState();
                if (checkState !== YT.PlayerState.PLAYING && checkState !== YT.PlayerState.BUFFERING) {
                    // Autoplay policy'ye takıldı - mute edip tekrar dene
                    debugLog('⚠️ YouTube: play failed, trying muted');
                    ytPlayer.mute();
                    ytPlayer.playVideo();
                    
                    // Unmute overlay göster
                    showUnmuteOverlay();
                }
            }
        }, 500));
        
    } else if (!state.isPlaying && isYTPlaying) {
        ytPlayer.pauseVideo();
        debugLog('⏸️ YouTube sync: pause');
    }
    
    // ✅ FIX: Pozisyon senkronizasyonu - seek cooldown ile
    if (drift > 2000) {
        // Seek cooldown kontrolü
        if (now - lastYTSeekTime < YT_SEEK_COOLDOWN) {
            debugLog('⏳ YouTube seek cooldown active, skipping seek');
            return;
        }
        
        // 2 saniyeden fazla sapma varsa seek
        debugLog('🔄 YouTube sync seek, drift:', Math.round(drift), 'ms, target:', expectedTime.toFixed(1));
        ytPlayer.seekTo(expectedTime, true);
        lastYTSeekTime = now; // Cooldown başlat
        
        // ✅ FIX: Seek sonrası play komutu ver (state.isPlaying true ise)
        if (state.isPlaying) {
            // Seek sonrası biraz bekle, sonra play
            trackTimeout(setTimeout(() => {
                if (ytPlayer && ytPlayerReady && currentRoomData && currentRoomData.videoState && currentRoomData.videoState.isPlaying) {
                    ytPlayer.playVideo();
                    debugLog('▶️ YouTube: play after seek attempt');
                    
                    // 500ms sonra kontrol et - başlamadıysa mute edip tekrar dene
                    trackTimeout(setTimeout(() => {
                        if (ytPlayer && ytPlayerReady && currentRoomData && currentRoomData.videoState && currentRoomData.videoState.isPlaying) {
                            const checkState = ytPlayer.getPlayerState();
                            if (checkState !== YT.PlayerState.PLAYING && checkState !== YT.PlayerState.BUFFERING) {
                                debugLog('⚠️ YouTube: play after seek failed, trying muted');
                                ytPlayer.mute();
                                ytPlayer.playVideo();
                                showUnmuteOverlay();
                            }
                        }
                    }, 500));
                }
            }, 300));
        }
        
        return; // Seek sonrası çık, rate ayarı yapma
        
    } else if (drift > 500 && state.isPlaying) {
        // Küçük sapmalarda playback rate ayarla (sadece oynatma durumundayken)
        const behind = currentTime < expectedTime;
        const newRate = behind ? 1.1 : 0.9;
        
        try {
            ytPlayer.setPlaybackRate(newRate);
            
            // 2 saniye sonra normale dön
            trackTimeout(setTimeout(() => {
                if (ytPlayer && ytPlayerReady) {
                    try {
                        ytPlayer.setPlaybackRate(1.0);
                    } catch (e) {}
                }
            }, 2000));
        } catch (e) {
            // Playback rate desteklenmiyorsa ignore et
        }
    } else if (drift <= 500) {
        // Sync iyi, playback rate'i normale al
        try {
            ytPlayer.setPlaybackRate(1.0);
        } catch (e) {}
    }
    
    // Drift UI güncelle
    updateSyncStatus(drift);
}