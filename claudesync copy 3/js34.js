// ✅ FIX: syncVideo - YouTube gibi basitleştirildi, buffer countdown kaldırıldı
        function syncVideo() {
            // ✅ YouTube modunda farklı sync kullan
            if (isYouTubeMode) {
                syncYouTubeVideo();
                return;
            }
            
            // ✅ FIX: isHardSeeking kontrolü eklendi
            if (isRoomOwner || isSeeking || isHardSeeking) return;
            if (!videoElement || !currentRoomData || !currentRoomData.videoState) return;

            if (syncState && syncState.isBuffering) return;

            // ✅ YENİ: P2P indirme tamamlanmadıysa sync yapma
            const isP2PMode = currentRoomData.p2p && currentRoomData.p2p.magnetURI;
            if (isP2PMode && !isP2PDownloadComplete) {
                debugLog('⚠️ P2P downloading, sync disabled');
                return;
            }

            // NORMAL SYNC LOGIC (P2P complete veya URL modu)
            const state = currentRoomData.videoState;
            const serverTime = getServerTime();
            let expectedTime = state.currentTime; 

            if (state.isPlaying) {
                const elapsed = (serverTime - state.startTimestamp) / 1000;
                // ✅ FIX: elapsed NaN/Infinity validation (max 24 saat)
                if (!isFinite(elapsed) || elapsed < 0 || elapsed > 86400) {
                    debugLog('⚠️ Invalid elapsed time, skipping sync');
                    return;
                }
                expectedTime = state.currentTime + elapsed;
            }

            const duration = videoElement.duration || Infinity;
            expectedTime = Math.max(0, Math.min(duration, expectedTime));

            const currentTime = videoElement.currentTime;
            const drift = Math.abs(currentTime - expectedTime) * 1000;

            debugLog(`Sync - Expected: ${expectedTime.toFixed(2)}, Current: ${currentTime.toFixed(2)}, Drift: ${drift.toFixed(0)}ms, Playing: ${state.isPlaying}`);

            // PAUSED STATE
            if (!state.isPlaying) {
                if (!videoElement.paused) {
                    videoElement.pause();
                }
                videoElement.playbackRate = 1.0;

                if (drift > 500) {
                    const alreadyAtPosition = Math.abs(videoElement.currentTime - expectedTime) < 0.5;
                    if (!alreadyAtPosition) {
                        debugLog(`Paused - seeking to owner position: ${expectedTime.toFixed(2)}`);
                        videoElement.currentTime = expectedTime;
                    }
                }
                return;
            }

            // PLAYING STATE - YouTube gibi basit sync
            if (drift <= TIER1_THRESHOLD) {
                // 0-300ms: Mükemmel sync
                if (videoElement.paused) {
                    videoElement.play().catch(() => {});
                }
                videoElement.playbackRate = 1.0;
                
            } else if (drift <= TIER2_THRESHOLD) {
                // 300-800ms: Hafif playback rate ayarı
                if (videoElement.paused) {
                    videoElement.play().catch(() => {});
                }
                const behind = currentTime < expectedTime;
                videoElement.playbackRate = behind ? 1.1 : 0.9;
                
            } else if (drift <= LARGE_DRIFT_THRESHOLD) {
                // 800-2000ms: Daha agresif playback rate
                if (videoElement.paused) {
                    videoElement.play().catch(() => {});
                }
                const behind = currentTime < expectedTime;
                videoElement.playbackRate = behind ? 1.15 : 0.85;
                
            } else {
                // 2000ms+: Hard seek (YouTube gibi, buffer yok)
                const now = Date.now();
                
                // Cooldown kontrolü
                if (now - lastHardSeekTime < HARD_SEEK_MIN_INTERVAL) {
                    debugLog('⏳ Hard seek cooldown active, using playbackRate');
                    if (videoElement.paused) {
                        videoElement.play().catch(() => {});
                    }
                    const behind = currentTime < expectedTime;
                    videoElement.playbackRate = behind ? 1.2 : 0.8;
                    return;
                }
                
                // Hard seek (YouTube gibi direkt)
                debugLog(`🔄 Hard seek - drift: ${drift.toFixed(0)}ms, target: ${expectedTime.toFixed(2)}`);
                
                isHardSeeking = true;
                lastHardSeekTime = now;
                
                // Seeked event ile flag temizle
                const onHardSeeked = () => {
                    videoElement.removeEventListener('seeked', onHardSeeked);
                    isHardSeeking = false;
                    videoElement.playbackRate = 1.0;
                    
                    // Seek sonrası play (state.isPlaying true ise)
                    if (state.isPlaying && videoElement.paused) {
                        videoElement.play().catch(() => {});
                    }
                    debugLog('✅ Hard seek completed');
                };
                videoElement.addEventListener('seeked', onHardSeeked);
                
                videoElement.currentTime = expectedTime;
                lastSyncedPosition = expectedTime;
                
                // Timeout fallback
                trackTimeout(setTimeout(() => {
                    if (isHardSeeking) {
                        videoElement.removeEventListener('seeked', onHardSeeked);
                        isHardSeeking = false;
                        debugLog('⚠️ Hard seek timeout');
                    }
                }, 3000));
            }
        }