// fullCleanup - tüm temizlikler (2D mode)
        function fullCleanup() {
            // ABR cleanup
            destroyAdaptiveStreaming();
            
            // P2P cleanup
            destroyP2PClient();

            // Ownership request cleanup
            if (typeof cleanupOwnershipRequests === 'function') {
                cleanupOwnershipRequests();
            }
            
            // Sync request cleanup
            if (typeof cleanupSyncRequests === 'function') {
                cleanupSyncRequests();
            }
            
            // YouTube player cleanup
            if (typeof destroyYouTubePlayer === 'function') {
                destroyYouTubePlayer();
            }

            // Flush pending Firebase updates first
            if (firebaseBatchTimeout) {
                clearTimeout(firebaseBatchTimeout);
                flushFirebaseUpdates();
            }
            
            // Owner task'larını temizle
            clearOwnerTasks();
            
            clearAllIntervals();
            clearAllTimeouts();
            clearAllListeners();
            clearElementCache();
            
            // Keyboard listener kaldır
            if (keydownHandler) {
                document.removeEventListener('keydown', keydownHandler);
                keydownHandler = null;
            }
            
            // onDisconnect referansını iptal et
            if (currentOnDisconnectRef) {
                currentOnDisconnectRef.cancel().catch(() => {});
                currentOnDisconnectRef = null;
            }
            
            // Object URL temizle
            revokeCurrentVideoURL();
            
            // Remove from active viewers
            if (currentRoomId && currentUser) {
                db.ref('rooms/' + currentRoomId + '/activeViewers/' + currentUser.uid).remove().catch(() => {});
            }
            
            pendingFirebaseUpdates = {};
            
            // Reset tracking variables
            lastHardSeekTime = 0;
            lastSyncedPosition = 0;
            isJoiningRoom = false;
            isHardSeeking = false;
            ownerTransferInProgress = false;
            selectedLocalFile = null;
            currentVideoSourceType = 'url';
            
            // Ownership request değişkenlerini sıfırla
            lastOwnershipRequestTime = 0;
            pendingOwnershipRequest = null;
            
            // Sync request değişkenlerini sıfırla
            pendingSyncRequest = null;
            
            // YouTube değişkenlerini sıfırla
            isYouTubeMode = false;
            youtubeVideoId = null;
            ytPlayerReady = false;
            lastYTSyncTime = 0;
            
            debugLog('🧹 Full cleanup completed');
        }
