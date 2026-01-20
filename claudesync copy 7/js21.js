// leaveRoom - tüm temizlikler (2D mode)
        function leaveRoom() {
            if (currentRoomId && currentUser) {
                db.ref('rooms/' + currentRoomId + '/activeViewers/' + currentUser.uid).remove();
            }
            
            // Clear sync state
            clearSyncState();
            
            // Video listener'larını temizle
            clearVideoListeners();
            
            // Ownership request cleanup
            cleanupOwnershipRequests();
            
            // YouTube player cleanup
            if (typeof destroyYouTubePlayer === 'function') {
                destroyYouTubePlayer();
            }
            
            // Full cleanup
            fullCleanup();
            
            // Clean up video element
            if (videoElement) {
                videoElement.pause();
                videoElement.removeAttribute('src');
                videoElement.load();
                // Video element'i silme, sadece reset et (2D mode'da element HTML'de sabit)
                videoElement = null;
            }
            
            // Video container'ı gizle
            const videoContainer = document.getElementById('video-container');
            if (videoContainer) {
                videoContainer.classList.add('hidden');
            }
            
            // UI overlay'i göster
            getCachedElement('ui-overlay').classList.remove('hidden');
            
            // Legacy elements (backward compatibility)
            const vrControls = getCachedElement('vr-controls');
            if (vrControls) vrControls.style.display = 'none';
            
            const roomInfo = getCachedElement('room-info');
            if (roomInfo) roomInfo.style.display = 'none';
            
            const syncStatus = getCachedElement('sync-status');
            if (syncStatus) syncStatus.style.display = 'none';
            
            const bufferEl = getCachedElement('buffer-countdown');
            if (bufferEl) bufferEl.style.display = 'none';
            
            hideP2PStatus();
            
            isBuffering = false;
            bufferTargetTime = null;
            
            currentRoomId = null;
            currentRoomData = null;
            isRoomOwner = false;
            lastDriftValue = null;
            
            // YouTube değişkenlerini sıfırla
            isYouTubeMode = false;
            youtubeVideoId = null;
            
            debugLog('🚪 Left room');
        }
