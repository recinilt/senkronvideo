function pauseVideo() {
            if (!isRoomOwner || !videoElement) return;
            
            if (playPromisePending) {
                const checkAndPause = () => {
                    if (!playPromisePending) {
                        executePause();
                    } else {
                        setTimeout(checkAndPause, 50);
                    }
                };
                setTimeout(checkAndPause, 50);
                return;
            }
            
            executePause();
        }
        
        function executePause() {
            if (!videoElement) return;
            
            lastCommandSource = 'self';
            
            videoElement.pause();
            
            const currentPos = videoElement.currentTime;
            
            const updates = {
                'videoState/isPlaying': false,
                'videoState/currentTime': currentPos,
                'videoState/startTimestamp': getServerTime(),
                'videoState/lastUpdate': firebase.database.ServerValue.TIMESTAMP,
                'keyframes': null,
                'syncState': null
            };
            
            db.ref('rooms/' + currentRoomId).update(updates).then(() => {
                debugLog('⏸️ Pause broadcasted, keyframes/syncState cleared');
            }).catch(err => console.warn('Pause update error:', err));
            
            // ✅ FIX: Timeout'u track et
            trackTimeout(setTimeout(() => {
                lastCommandSource = null;
            }, 300));
        }
        
        // ✅ YENİ: Stop fonksiyonu - video'yu durdur ve başa sar
        function stopVideo() {
            if (!isRoomOwner || !videoElement) return;
            
            if (playPromisePending) {
                const checkAndStop = () => {
                    if (!playPromisePending) {
                        executeStop();
                    } else {
                        setTimeout(checkAndStop, 50);
                    }
                };
                setTimeout(checkAndStop, 50);
                return;
            }
            
            executeStop();
        }
        
        function executeStop() {
            if (!videoElement) return;
            
            lastCommandSource = 'self';
            
            videoElement.pause();
            videoElement.currentTime = 0;
            
            const updates = {
                'videoState/isPlaying': false,
                'videoState/currentTime': 0,
                'videoState/startTimestamp': getServerTime(),
                'videoState/lastUpdate': firebase.database.ServerValue.TIMESTAMP,
                'keyframes': null,
                'syncState': null
            };
            
            db.ref('rooms/' + currentRoomId).update(updates).then(() => {
                debugLog('⏹️ Stop broadcasted, video reset to beginning');
            }).catch(err => console.warn('Stop update error:', err));
            
            // ✅ FIX: Timeout'u track et
            trackTimeout(setTimeout(() => {
                lastCommandSource = null;
            }, 300));
        }