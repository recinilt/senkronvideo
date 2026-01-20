        
        function playVideo() {
            if (!isRoomOwner || !videoElement) return;
            
            if (syncState && syncState.isBuffering) {
                startSyncCountdown();
                return;
            }
            
            if (playPromisePending) return;
            playPromisePending = true;
            
            lastCommandSource = 'self';
            
            const playPromise = videoElement.play();
            
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    playPromisePending = false;
                    const serverTime = getServerTime();
                    
                    db.ref('rooms/' + currentRoomId + '/videoState').update({
                        isPlaying: true,
                        currentTime: videoElement.currentTime,
                        startTimestamp: serverTime,
                        lastUpdate: firebase.database.ServerValue.TIMESTAMP
                    });
                    
                    // ✅ FIX: Timeout'u track et
                    trackTimeout(setTimeout(() => {
                        lastCommandSource = null;
                    }, 300));
                }).catch(error => {
                    playPromisePending = false;
                    lastCommandSource = null;
                    
                    if (error.name === 'NotAllowedError') {
                        console.warn('Autoplay blocked - user interaction required');
                    } else if (error.name !== 'AbortError') {
                        console.warn('Play error:', error);
                    }
                });
            } else {
                playPromisePending = false;
                const serverTime = getServerTime();
                db.ref('rooms/' + currentRoomId + '/videoState').update({
                    isPlaying: true,
                    currentTime: videoElement.currentTime,
                    startTimestamp: serverTime,
                    lastUpdate: firebase.database.ServerValue.TIMESTAMP
                });
                // ✅ FIX: Timeout'u track et
                trackTimeout(setTimeout(() => { lastCommandSource = null; }, 300));
            }
        }
