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
                // ✅ FIX: YouTube - seek sonrası PLAYING state bekle, sonra temizle
                
                // Önce seek yap
                ytPlayer.seekTo(state.syncedSeekPosition, true);
                debugLog('🎯 YouTube seek to:', state.syncedSeekPosition);
                
                // ✅ FIX: 500ms bekle (seek tamamlansın), sonra play
                trackTimeout(setTimeout(() => {
                    if (!ytPlayer || !ytPlayerReady) {
                        clearSyncState();
                        return;
                    }
                    
                    ytPlayer.playVideo();
                    debugLog('▶️ YouTube play after seek delay');
                    
                    // ✅ FIX: PLAYING state'i bekle
                    const checkPlayingInterval = setInterval(() => {
                        if (!ytPlayer || !ytPlayerReady) {
                            clearInterval(checkPlayingInterval);
                            clearSyncState();
                            return;
                        }
                        
                        const ytState = ytPlayer.getPlayerState();
                        
                        if (ytState === YT.PlayerState.PLAYING) {
                            // Video oynatılıyor - sync başarılı
                            clearInterval(checkPlayingInterval);
                            debugLog('✅ YouTube sync play successful, state: PLAYING');
                            
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
                                clearSyncState();
                            }
                        } else if (ytState === YT.PlayerState.BUFFERING) {
                            // Hala buffering, bekle
                            debugLog('⏳ YouTube still buffering...');
                        } else if (ytState === YT.PlayerState.PAUSED || ytState === YT.PlayerState.CUED) {
                            // Pause veya cued - tekrar play dene
                            ytPlayer.playVideo();
                            debugLog('🔄 YouTube retry play, state:', ytState);
                        }
                    }, 200);
                    trackInterval(checkPlayingInterval);
                    
                    // ✅ FIX: 5 saniye timeout - takılmayı önle
                    trackTimeout(setTimeout(() => {
                        clearInterval(checkPlayingInterval);
                        if (syncModeActive) {
                            debugLog('⚠️ YouTube sync timeout - forcing clear');
                            clearSyncState();
                        }
                    }, 5000));
                    
                }, 500)); // 500ms seek delay
                
            } else {
                // Normal video
                videoElement.currentTime = state.syncedSeekPosition;
                
                // ✅ FIX: seeked event bekle, sonra play
                const onSyncSeeked = () => {
                    videoElement.removeEventListener('seeked', onSyncSeeked);
                    
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
                };
                
                videoElement.addEventListener('seeked', onSyncSeeked);
                
                // Timeout fallback
                trackTimeout(setTimeout(() => {
                    videoElement.removeEventListener('seeked', onSyncSeeked);
                    if (syncModeActive) {
                        debugLog('⚠️ Video sync timeout');
                        clearSyncState();
                    }
                }, 3000));
            }
        }
        
        function startSyncCountdown() {
            // Bu fonksiyon artık kullanılmıyor ama backward compatibility için tutuluyor
            if (!isRoomOwner || !syncState) return;
            
            // Direkt sync başlat
            executeOwnerSync();
        }