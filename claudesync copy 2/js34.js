// ✅ FIX #5 & #6: syncVideo - main thread blokajı ve DOM thrashing azaltma
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

            debugLog(`Sync - Expected: ${expectedTime}, Current: ${currentTime}, Drift: ${drift}, Playing: ${state.isPlaying}`);

            if (!state.isPlaying) {
                if (!videoElement.paused) {
                    videoElement.pause();
                }
                videoElement.playbackRate = 1.0;

                // ✅ FIX #6: isBuffering flag'i pause'da temizle
                if (isBuffering) {
                    if (bufferCountdownInterval) {
                        clearInterval(bufferCountdownInterval);
                        bufferCountdownInterval = null;
                    }
                    isBuffering = false;
                    const bufferEl = getCachedElement('buffer-countdown');
                    if (bufferEl) bufferEl.style.display = 'none';
                    debugLog('isBuffering cleared due to pause');
                }

                if (drift > 500) {
                    const alreadyAtPosition = Math.abs(videoElement.currentTime - expectedTime) < 0.5;
                    if (!alreadyAtPosition) {
                        debugLog(`Paused - seeking to owner position, ${expectedTime}`);
                        videoElement.currentTime = expectedTime;
                    }
                }
                return;
            }

            // PLAYING STATE SYNC
            if (drift <= TIER1_THRESHOLD) {
                if (videoElement.paused) {
                    videoElement.play().catch(err => console.warn('Play failed:', err));
                    // ✅ FIX: Timeout'u track et
                    trackTimeout(setTimeout(() => videoElement.play().catch(() => {}), 200));
                }
                videoElement.playbackRate = 1.0;
            } else if (drift <= TIER2_THRESHOLD) {
                if (videoElement.paused) {
                    videoElement.play().catch(() => {});
                }
                const behind = currentTime < expectedTime;
                videoElement.playbackRate = behind ? TIER2_LAGGING_SPEED : 0.95;
            } else if (drift <= TIER3_THRESHOLD) {
                if (videoElement.paused) {
                    videoElement.play().catch(() => {});
                }
                const behind = currentTime < expectedTime;
                videoElement.playbackRate = behind ? TIER3_LAGGING_SPEED : 0.90;
            } else if (drift <= 3000) {
                // 1.5-3 saniye arası drift
                if (videoElement.paused) {
                    videoElement.play().catch(() => {});
                }
                const behind = currentTime < expectedTime;
                videoElement.playbackRate = behind ? 1.25 : 0.85;
            } else if (drift <= LARGE_DRIFT_THRESHOLD) {
                // 3-9 saniye arası drift - daha agresif playbackRate
                if (videoElement.paused) {
                    videoElement.play().catch(() => {});
                }
                const behind = currentTime < expectedTime;
                videoElement.playbackRate = behind ? 1.5 : 0.75;
            } else {
                // Large drift (9+ seconds) - Hard seek with throttle
                const now = Date.now();
                if (now - lastHardSeekTime < HARD_SEEK_MIN_INTERVAL || isHardSeeking) {
                    debugLog(`Hard seek throttled or in progress, using playbackRate`);
                    if (videoElement.paused) {
                        videoElement.play().catch(() => {});
                    }
                    const behind = currentTime < expectedTime;
                    videoElement.playbackRate = behind ? 1.75 : 0.65; // ✅ FIX: Daha agresif
                    return;
                }

                debugLog(`Large drift detected, ${drift}ms - initiating buffer-wait`);
                isBuffering = true;
                isHardSeeking = true; // ✅ FIX: Hard seek başlıyor
                lastHardSeekTime = now;

                const BUFFER_ADVANCE = 9; // ✅ FIX: 7 -> 9 saniye
                const targetSeek = expectedTime - BUFFER_ADVANCE;
                const clampedTarget = Math.max(0, Math.min(duration, targetSeek));

                videoElement.pause();
                
                // ✅ FIX: seeked event ile isHardSeeking'i temizle
                const onHardSeeked = () => {
                    videoElement.removeEventListener('seeked', onHardSeeked);
                    isHardSeeking = false;
                    debugLog('✅ Hard seek completed (syncVideo)');
                };
                videoElement.addEventListener('seeked', onHardSeeked);
                
                videoElement.currentTime = clampedTarget;
                lastSyncedPosition = clampedTarget;
                bufferTargetTime = Date.now() + (BUFFER_ADVANCE * 1000);
                
                // ✅ FIX: Timeout fallback - seeked event gelmezse temizle - TRACKED
                trackTimeout(setTimeout(() => {
                    if (isHardSeeking) {
                        videoElement.removeEventListener('seeked', onHardSeeked);
                        isHardSeeking = false;
                        debugLog('⚠️ Hard seek timeout (syncVideo)');
                    }
                }, 3000));

                // ✅ INTERVAL FIX: DOM element'i döngü dışında cache'le
                const countdownEl = getCachedElement('buffer-countdown');
                if (countdownEl) countdownEl.style.display = 'block';

                // ✅ FIX #11: Mevcut interval'ı temizle
                if (bufferCountdownInterval) {
                    clearInterval(bufferCountdownInterval);
                    bufferCountdownInterval = null;
                }

                bufferCountdownInterval = setInterval(() => {
                    const remaining = Math.max(0, bufferTargetTime - Date.now());
                    const seconds = Math.ceil(remaining / 1000);

                    // ✅ countdownEl döngü dışında cache'lendi
                    if (countdownEl) {
                        countdownEl.textContent = `${seconds}s`;
                    }

                    if (remaining <= 0) {
                        clearInterval(bufferCountdownInterval);
                        bufferCountdownInterval = null;
                        isBuffering = false;

                        if (countdownEl) countdownEl.style.display = 'none';

                        if (currentRoomData.videoState && currentRoomData.videoState.isPlaying) {
                            videoElement.play().catch(() => {});
                            videoElement.playbackRate = 1.0;
                            debugLog(`Buffer complete - auto-started`);
                        }
                    }
                }, 100);
            }
        }