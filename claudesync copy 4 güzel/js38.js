
        
        function trackDrift() {
            // ✅ FIX: isHardSeeking kontrolü eklendi
            if (!videoElement || !currentRoomData || !currentRoomData.videoState || isSeeking || isHardSeeking) return;

            try {
                const state = currentRoomData.videoState;
                const serverTime = getServerTime();
                const expectedTime = state.isPlaying 
                    ? state.currentTime + (serverTime - state.startTimestamp) / 1000 
                    : state.currentTime;

                const drift = (videoElement.currentTime - expectedTime) * 1000;

                if (lastDriftValue === null || Math.abs(drift - lastDriftValue) > 1000) {
                    if (shouldUpdateFirebase()) {
                        queueFirebaseUpdate('activeViewers/' + currentUser.uid + '/currentDrift', drift);
                    }
                    lastDriftValue = drift;
                }
            } catch (error) {
                console.warn('Drift tracking error:', error);
            }
        }

        
        function updatePresence() {
            if (!currentUser || !currentRoomId) return;
            
            try {
                queueFirebaseUpdate(
                    'activeViewers/' + currentUser.uid + '/lastSeen',
                    firebase.database.ServerValue.TIMESTAMP
                );
            } catch (error) {
                console.warn('Presence update error:', error);
            }
        }
