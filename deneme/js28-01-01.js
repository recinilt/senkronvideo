        // ==================== SYNC MECHANISM ====================
        
        function initiateSync() {
            if (!currentRoomId || !currentUser) return;
            
            // YouTube veya normal video kontrolü
            if (!isYouTubeMode && !videoElement) return;
            if (isYouTubeMode && (!ytPlayer || !ytPlayerReady)) return;
            
            debugLog('🔄 Sync initiated by user, isOwner:', isRoomOwner);
            
            const syncBtn = getCachedElement('btn-sync');
            const ytSyncBtn = document.getElementById('yt-btn-sync');
            if (syncBtn) syncBtn.disabled = true;
            if (ytSyncBtn) ytSyncBtn.disabled = true;
            
            if (isRoomOwner) {
                // Owner direkt sync başlatır
                executeOwnerSync();
            } else {
                // Viewer izin isteği gönderir
                sendSyncRequest();
            }
        }
        
        // Owner direkt sync başlatır
        async function executeOwnerSync() {
            try {
                const targetPosition = await calculateSyncPosition();
                const playAtTime = getServerTime() + SYNC_PLAY_DELAY;
                
                // Firebase'e yaz
                await db.ref('rooms/' + currentRoomId + '/syncState').set({
                    syncedSeekPosition: targetPosition,
                    playAtTime: playAtTime,
                    initiatedBy: currentUser.uid,
                    initiatedAt: firebase.database.ServerValue.TIMESTAMP
                });
                
                debugLog('✅ Owner sync started, playAtTime:', playAtTime, 'position:', targetPosition);
                
            } catch (error) {
                console.error('Owner sync error:', error);
                enableSyncButton();
            }
        }
        
        // Sync pozisyonunu hesapla
        async function calculateSyncPosition() {
            const snapshot = await db.ref('rooms/' + currentRoomId + '/activeViewers').once('value');
            const viewers = snapshot.val();
            
            const positions = [];
            
            // Kendi pozisyonumu ekle
            if (isYouTubeMode && ytPlayer && ytPlayerReady) {
                positions.push(ytPlayer.getCurrentTime());
            } else if (videoElement) {
                positions.push(videoElement.currentTime);
            }
            
            // Diğer viewer pozisyonlarını ekle
            if (viewers) {
                Object.keys(viewers).forEach(uid => {
                    if (uid !== currentUser.uid && viewers[uid].currentPosition !== undefined) {
                        positions.push(viewers[uid].currentPosition);
                    }
                });
            }
            
            let minPosition = Math.min(...positions);
            
            // Validation
            if (!isFinite(minPosition) || isNaN(minPosition)) {
                if (isYouTubeMode && ytPlayer && ytPlayerReady) {
                    minPosition = ytPlayer.getCurrentTime() || 0;
                } else if (videoElement) {
                    minPosition = videoElement.currentTime || 0;
                } else {
                    minPosition = 0;
                }
            }
            
            // En geridekinden 4 saniye çıkar
            const targetPosition = Math.max(0, minPosition - 4);
            
            debugLog('📍 Positions:', positions, '→ Target:', targetPosition);
            
            return targetPosition;
        }