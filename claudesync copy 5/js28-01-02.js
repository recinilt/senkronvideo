        
        // Viewer sync isteği gönderir
        async function sendSyncRequest() {
            try {
                // Mevcut pozisyonu hesapla
                let currentPosition = 0;
                if (isYouTubeMode && ytPlayer && ytPlayerReady) {
                    currentPosition = ytPlayer.getCurrentTime();
                } else if (videoElement) {
                    currentPosition = videoElement.currentTime;
                }
                
                // Firebase'e sync isteği yaz
                await db.ref('rooms/' + currentRoomId + '/syncRequests/' + currentUser.uid).set({
                    fromUid: currentUser.uid,
                    currentPosition: currentPosition,
                    timestamp: firebase.database.ServerValue.TIMESTAMP,
                    status: 'pending',
                    expiresAt: Date.now() + SYNC_REQUEST_TIMEOUT
                });
                
                pendingSyncRequest = currentUser.uid;
                
                debugLog('📤 Sync request sent');
                
                // UI güncelle
                updateSyncUI('⏳ Oda sahibinin onayı bekleniyor...');
                
                // Timeout
                trackTimeout(setTimeout(async () => {
                    if (pendingSyncRequest === currentUser.uid) {
                        const snapshot = await db.ref('rooms/' + currentRoomId + '/syncRequests/' + currentUser.uid).once('value');
                        if (snapshot.exists() && snapshot.val().status === 'pending') {
                            await db.ref('rooms/' + currentRoomId + '/syncRequests/' + currentUser.uid).remove();
                            debugLog('⏰ Sync request expired');
                            pendingSyncRequest = null;
                            enableSyncButton();
                            updateSyncUI('⏰ İstek zaman aşımına uğradı');
                        }
                    }
                }, SYNC_REQUEST_TIMEOUT));
                
            } catch (error) {
                console.error('Sync request error:', error);
                enableSyncButton();
            }
        }
        
        // Sync butonunu aktif et
        function enableSyncButton() {
            const syncBtn = getCachedElement('btn-sync');
            const ytSyncBtn = document.getElementById('yt-btn-sync');
            if (syncBtn) syncBtn.disabled = false;
            if (ytSyncBtn) ytSyncBtn.disabled = false;
        }
        
        // Owner için sync isteklerini dinle
        function listenSyncRequests() {
            if (!currentRoomId || !isRoomOwner) return;
            
            // Önceki listener'ı temizle
            if (syncRequestListener) {
                syncRequestListener.off();
                syncRequestListener = null;
            }
            
            syncRequestListener = db.ref('rooms/' + currentRoomId + '/syncRequests');
            trackListener(syncRequestListener);
            
            syncRequestListener.on('child_added', (snapshot) => {
                const request = snapshot.val();
                const requestId = snapshot.key;
                
                if (!request || request.status !== 'pending') return;
                
                // Süresi dolmuş mu kontrol et
                if (request.expiresAt && Date.now() > request.expiresAt) {
                    snapshot.ref.remove();
                    return;
                }
                
                debugLog('📩 New sync request from:', request.fromUid);
                
                // Modal göster
                showSyncRequestModal(requestId, request);
            });
        }