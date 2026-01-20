        
        // Sync play - playAtTime anında çağrılır
        function executeSyncPlay(state) {
            debugLog('🎬 Executing sync play at:', Date.now());
            
            // Countdown'ı temizle
            if (countdownInterval) {
                clearInterval(countdownInterval);
                countdownInterval = null;
            }
            
            const countdownEl = getCachedElement('sync-countdown');
            if (countdownEl) {
                countdownEl.style.display = 'none';
                countdownEl.textContent = '';
            }
            
            if (isYouTubeMode) {
                // YouTube
                ytPlayer.seekTo(state.syncedSeekPosition, true);
                ytPlayer.playVideo();
                
                debugLog('✅ YouTube sync play executed');
                
                // Owner Firebase güncelle
                if (isRoomOwner) {
                    const serverTime = getServerTime();
                    db.ref('rooms/' + currentRoomId + '/videoState').update({
                        isPlaying: true,
                        currentTime: state.syncedSeekPosition,
                        startTimestamp: serverTime,
                        lastUpdate: firebase.database.ServerValue.TIMESTAMP
                    }).then(() => {
                        clearSyncState();
                    });
                } else {
                    trackTimeout(setTimeout(() => {
                        clearSyncState();
                    }, 500));
                }
                
            } else {
                // Normal video
                videoElement.currentTime = state.syncedSeekPosition;
                
                videoElement.play().then(() => {
                    debugLog('✅ Sync play successful');
                    
                    if (isRoomOwner) {
                        const serverTime = getServerTime();
                        db.ref('rooms/' + currentRoomId + '/videoState').update({
                            isPlaying: true,
                            currentTime: state.syncedSeekPosition,
                            startTimestamp: serverTime,
                            lastUpdate: firebase.database.ServerValue.TIMESTAMP
                        }).then(() => {
                            clearSyncState();
                        });
                    } else {
                        trackTimeout(setTimeout(() => {
                            clearSyncState();
                        }, 500));
                    }
                }).catch(error => {
                    console.error('Sync play error:', error);
                    clearSyncState();
                });
            }
        }
        
        function startSyncCountdown() {
            // Bu fonksiyon artık kullanılmıyor ama backward compatibility için tutuluyor
            if (!isRoomOwner || !syncState) return;
            
            // Direkt sync başlat
            executeOwnerSync();
        }