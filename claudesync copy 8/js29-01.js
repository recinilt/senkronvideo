function applySyncState(state) {
            if (!state) return;
            
            // YouTube veya normal video kontrolü
            if (!isYouTubeMode && !videoElement) return;
            if (isYouTubeMode && (!ytPlayer || !ytPlayerReady)) return;
            
            // Validation
            if (state.syncedSeekPosition !== undefined && state.syncedSeekPosition !== null) {
                if (!isFinite(state.syncedSeekPosition) || isNaN(state.syncedSeekPosition)) {
                    debugLog('⚠️ Invalid syncedSeekPosition in applySyncState');
                    return;
                }
            }
            
            syncState = state;
            syncModeActive = true;
            
            debugLog('🔄 Applying sync state, playAtTime:', state.playAtTime, 'position:', state.syncedSeekPosition);
            
            // ✅ FIX: Sadece pause yap, seekTo YAPMA (executeSyncPlay'de yapılacak)
            // Çift seekTo sorunu bu şekilde çözülüyor
            if (isYouTubeMode) {
                ytPlayer.pauseVideo();
                // seekTo kaldırıldı - executeSyncPlay'de tek seferde yapılacak
            } else {
                videoElement.pause();
                // seekTo kaldırıldı - executeSyncPlay'de tek seferde yapılacak
            }
            
            // Kontrolleri disable et
            updateControlsForSync(true);
            
            // playAtTime varsa, o zamana kadar bekle
            if (state.playAtTime) {
                const serverTime = getServerTime();
                const delay = state.playAtTime - serverTime;
                
                debugLog('⏱️ Will play in', delay, 'ms');
                
                if (delay > 0) {
                    updateSyncUI(`⏱️ ${Math.ceil(delay / 1000)}s sonra başlayacak...`);
                    
                    // Kalan süreyi göster
                    const countdownEl = getCachedElement('sync-countdown');
                    if (countdownEl) {
                        countdownEl.style.display = 'block';
                    }
                    
                    // Countdown interval
                    if (countdownInterval) {
                        clearInterval(countdownInterval);
                        countdownInterval = null;
                    }
                    
                    countdownInterval = setInterval(() => {
                        const remaining = state.playAtTime - getServerTime();
                        const seconds = Math.ceil(remaining / 1000);
                        
                        if (countdownEl) {
                            countdownEl.textContent = `${seconds}...`;
                        }
                        updateSyncUI(`⏱️ ${seconds}s sonra başlayacak...`);
                        
                        if (remaining <= 0) {
                            clearInterval(countdownInterval);
                            countdownInterval = null;
                        }
                    }, 100);
                    trackInterval(countdownInterval);
                    
                    // playAtTime'da oynat
                    if (syncPlayAtTimeTimeout) {
                        clearTimeout(syncPlayAtTimeTimeout);
                    }
                    
                    syncPlayAtTimeTimeout = setTimeout(() => {
                        executeSyncPlay(state);
                    }, delay);
                    trackTimeout(syncPlayAtTimeTimeout);
                    
                } else {
                    // Zaman geçmiş, hemen başlat
                    executeSyncPlay(state);
                }
            }
        }