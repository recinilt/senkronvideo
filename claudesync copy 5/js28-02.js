        
        // Sync isteğini onayla
        async function approveSyncRequest(requestId) {
            if (!currentRoomId || !isRoomOwner) return;
            
            try {
                // İsteği sil
                await db.ref('rooms/' + currentRoomId + '/syncRequests/' + requestId).remove();
                
                hideSyncRequestModal();
                
                // Owner sync başlat
                await executeOwnerSync();
                
                debugLog('✅ Sync request approved');
                
            } catch (error) {
                console.error('Approve sync error:', error);
            }
        }
        
        // Sync isteğini reddet
        async function rejectSyncRequest(requestId) {
            if (!currentRoomId || !isRoomOwner) return;
            
            try {
                await db.ref('rooms/' + currentRoomId + '/syncRequests/' + requestId).update({
                    status: 'rejected'
                });
                
                // 3 saniye sonra sil
                trackTimeout(setTimeout(() => {
                    db.ref('rooms/' + currentRoomId + '/syncRequests/' + requestId).remove().catch(() => {});
                }, 3000));
                
                hideSyncRequestModal();
                
                debugLog('❌ Sync request rejected');
                
            } catch (error) {
                console.error('Reject sync error:', error);
            }
        }
        
        // Viewer için kendi sync isteğinin durumunu dinle
        function listenMySyncRequestStatus() {
            if (!currentRoomId || !currentUser || isRoomOwner) return;
            
            const ref = db.ref('rooms/' + currentRoomId + '/syncRequests/' + currentUser.uid);
            trackListener(ref);
            
            ref.on('value', (snapshot) => {
                if (!snapshot.exists()) {
                    // İstek silindi (onaylandı veya timeout)
                    if (pendingSyncRequest) {
                        pendingSyncRequest = null;
                        enableSyncButton();
                    }
                    return;
                }
                
                const request = snapshot.val();
                
                if (request.status === 'rejected') {
                    debugLog('😔 Sync request rejected');
                    pendingSyncRequest = null;
                    enableSyncButton();
                    updateSyncUI('❌ İstek reddedildi');
                    
                    // 3 saniye sonra normal duruma dön
                    trackTimeout(setTimeout(() => {
                        updateSyncUI('');
                    }, 3000));
                }
            });
        }
        
        // Sync request cleanup
        function cleanupSyncRequests() {
            if (syncRequestListener) {
                syncRequestListener.off();
                syncRequestListener = null;
            }
            
            hideSyncRequestModal();
            
            pendingSyncRequest = null;
            
            if (syncPlayAtTimeTimeout) {
                clearTimeout(syncPlayAtTimeTimeout);
                syncPlayAtTimeTimeout = null;
            }
            
            debugLog('🧹 Sync request cleanup completed');
        }