function listenVideoState() {
            const ref = db.ref(`rooms/${currentRoomId}/videoState`);
            trackListener(ref);

            ref.on('value', snapshot => {
                const newState = snapshot.val();
                if (!newState) return;

                if (syncModeActive) {
                    debugLog('Ignoring video state update - sync mode active');
                    return;
                }

                if (lastCommandSource === 'self') {
                    debugLog('Ignoring self-triggered video state update');
                    return;
                }

                const oldState = previousVideoState;

                if (oldState &&
                    oldState.isPlaying === newState.isPlaying &&
                    Math.abs(oldState.currentTime - newState.currentTime) < 0.1 &&
                    oldState.startTimestamp === newState.startTimestamp) {
                    return;
                }

                // ✅ FIX: JSON.parse/stringify yerine shallow copy (daha hızlı)
                previousVideoState = {
                    isPlaying: newState.isPlaying,
                    currentTime: newState.currentTime,
                    startTimestamp: newState.startTimestamp,
                    lastUpdate: newState.lastUpdate
                };
                currentRoomData.videoState = newState;

                // ✅ YouTube modunda farklı işle
                if (isYouTubeMode) {
                    if (!isRoomOwner && ytPlayer && ytPlayerReady) {
                        // ✅ FIX: applyYouTubeVideoState yerine syncYouTubeVideo kullan
                        // applyYouTubeVideoState sadece onReady'de 1 kere çağrılmalı
                        syncYouTubeVideo();
                    }
                    return;
                }

                if (!isRoomOwner) {
                    const now = Date.now();

                    // ✅ FIX: Pause komutu - throttle bypass
                    if (oldState && oldState.isPlaying && !newState.isPlaying) {
                        debugLog('Pause command detected - syncing immediately (bypass throttle)');
                        lastVideoStateUpdate = now;
                        syncVideo();
                        return;
                    }

                    // ✅ FIX: Play komutu - throttle bypass (stop sonrası hızlı play sorunu için)
                    if (oldState && !oldState.isPlaying && newState.isPlaying) {
                        debugLog('Play command detected - syncing immediately (bypass throttle)');
                        lastVideoStateUpdate = now;
                        syncVideo();
                        return;
                    }

                    if (now - lastVideoStateUpdate < SYNCCHECKINTERVAL) return;

                    lastVideoStateUpdate = now;
                    syncVideo();
                }
            });
        }