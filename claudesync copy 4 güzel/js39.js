function checkOwnerPresence() {
            if (!isRoomOwner && currentRoomData && currentUser) {
                db.ref('rooms/' + currentRoomId + '/activeViewers/' + currentRoomData.owner).once('value')
                    .then(snapshot => {
                        const ownerData = snapshot.val();
                        if (!ownerData || (Date.now() - ownerData.lastSeen > OWNER_PRESENCE_TIMEOUT)) {
                            db.ref('rooms/' + currentRoomId + '/activeViewers').once('value')
                                .then(viewersSnapshot => {
                                    const viewers = viewersSnapshot.val();
                                    if (viewers) {
                                        const newOwner = Object.keys(viewers)[0];
                                        if (newOwner === currentUser.uid) {
                                            db.ref('rooms/' + currentRoomId).update({ owner: newOwner });
                                            isRoomOwner = true;
                                            debugLog('👑 Ownership transferred to you');
                                        }
                                    }
                                });
                        }
                    })
                    .catch(() => {});
            }
        }
        
        // ==================== UI UPDATES (2D MODE) ====================
        function updateRoomInfoDisplay() {
            if (!currentRoomData) return;
            
            // 2D Video modu
            const videoRoomName = document.getElementById('video-room-name');
            if (videoRoomName) {
                videoRoomName.textContent = currentRoomData.name + (isRoomOwner ? ' 👑' : '');
            }
            
            // YouTube modu
            const ytRoomName = document.getElementById('youtube-room-name');
            if (ytRoomName) {
                ytRoomName.textContent = currentRoomData.name + (isRoomOwner ? ' 👑' : '');
            }
            
            // Legacy elements (backward compatibility)
            const legacyRoomName = getCachedElement('room-name-display');
            if (legacyRoomName) {
                legacyRoomName.textContent = currentRoomData.name + (isRoomOwner ? ' 👑' : '');
            }
            
            updateViewerCount();
        }
        
        // DOM thrashing azaltma - queueRAF kullan
        function updateViewerCount() {
            if (!currentRoomId || !shouldUpdateUI()) return;
            
            db.ref('rooms/' + currentRoomId + '/activeViewers').once('value')
                .then(snapshot => {
                    const count = snapshot.numChildren();
                    queueRAF(() => {
                        // 2D Video mode
                        const videoViewerCount = document.getElementById('video-viewer-count');
                        if (videoViewerCount) {
                            videoViewerCount.textContent = `👥 ${count} izleyici`;
                        }
                        
                        // YouTube mode
                        const ytViewerCount = document.getElementById('youtube-viewer-count');
                        if (ytViewerCount) {
                            ytViewerCount.textContent = `👥 ${count} izleyici`;
                        }
                        
                        // Legacy element
                        const viewerElement = getCachedElement('viewer-count');
                        if (viewerElement) {
                            viewerElement.textContent = `👥 ${count} izleyici`;
                        }
                    });
                })
                .catch(() => {});
        }
