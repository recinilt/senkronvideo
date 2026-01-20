        
        function listenSyncState() {
            const ref = db.ref('rooms/' + currentRoomId + '/syncState');
            trackListener(ref);
            
            ref.on('value', (snapshot) => {
                const state = snapshot.val();
                
                if (state) {
                    applySyncState(state);
                } else {
                    if (syncState) {
                        clearSyncState();
                    }
                }
            });
        }
        
        function updateViewerPosition() {
            if (!currentUser || !currentRoomId) return;
            
            let currentPosition = 0;
            
            // YouTube veya normal video
            if (isYouTubeMode && ytPlayer && ytPlayerReady) {
                try {
                    currentPosition = ytPlayer.getCurrentTime() || 0;
                } catch (e) {
                    currentPosition = 0;
                }
            } else if (videoElement) {
                currentPosition = videoElement.currentTime || 0;
            }
            
            try {
                db.ref('rooms/' + currentRoomId + '/activeViewers/' + currentUser.uid + '/currentPosition')
                    .set(currentPosition)
                    .catch(() => {});
            } catch (error) {
                console.warn('Position update error:', error);
            }
        }
        
        // ✅ FIX #10: syncVideoState - recursive trigger önleme
        let isSyncingVideoState = false;
        
        

function syncVideoState() {
    if (!isRoomOwner) return;
    
    // YouTube veya normal video
    if (!isYouTubeMode && !videoElement) return;
    if (isYouTubeMode && (!ytPlayer || !ytPlayerReady)) return;

    if (isSyncingVideoState) {
        debugLog('⚠️ syncVideoState already in progress, skipping');
        return;
    }

    isSyncingVideoState = true;
    const serverTime = getServerTime();
    
    let isPlaying = false;
    let currentTime = 0;
    
    if (isYouTubeMode) {
        const state = ytPlayer.getPlayerState();
        isPlaying = state === YT.PlayerState.PLAYING;
        currentTime = ytPlayer.getCurrentTime() || 0;
    } else {
        isPlaying = !videoElement.paused;
        currentTime = videoElement.currentTime || 0;
    }

    db.ref(`rooms/${currentRoomId}/videoState`).update({
        isPlaying: isPlaying,
        currentTime: currentTime,
        startTimestamp: serverTime,
        lastUpdate: firebase.database.ServerValue.TIMESTAMP
    })
    .then(() => {
        isSyncingVideoState = false;
    })
    .catch((err) => {
        console.warn('Sync update error:', err);
        isSyncingVideoState = false;
    });
}

        // ==================== VIDEO SYNC (OPTIMIZED) ====================
        let lastVideoStateUpdate = 0;
        let previousVideoState = null;
