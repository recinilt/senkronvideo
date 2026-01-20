// Sahiplik isteğini reddet
async function rejectOwnershipRequest(requestId) {
    if (!currentRoomId || !isRoomOwner) return;
    
    try {
        await db.ref(`rooms/${currentRoomId}/ownershipRequests/${requestId}`).update({
            status: 'rejected',
            rejectedAt: firebase.database.ServerValue.TIMESTAMP
        });
        
        debugLog('❌ Ownership request rejected:', requestId);
        
        // 5 saniye sonra sil
        trackTimeout(setTimeout(() => {
            db.ref(`rooms/${currentRoomId}/ownershipRequests/${requestId}`).remove().catch(() => {});
        }, 5000));
        
        hideOwnershipRequestModal();
        
    } catch (error) {
        console.error('Reject ownership error:', error);
    }
}

// Katılımcı için: İsteğin durumunu dinle
function listenMyOwnershipRequestStatus() {
    if (!currentRoomId || !currentUser || isRoomOwner) return;
    
    const ref = db.ref(`rooms/${currentRoomId}/ownershipRequests`)
        .orderByChild('fromUid')
        .equalTo(currentUser.uid);
    
    trackListener(ref);
    
    ref.on('child_changed', (snapshot) => {
        const request = snapshot.val();
        
        if (request.status === 'accepted') {
            // Sahiplik bana geçti!
            debugLog('🎉 Ownership accepted - I am now the owner!');
            
            isRoomOwner = true;
            currentRoomData.owner = currentUser.uid;
            
            // Owner task'larını başlat
            startOwnerTasks();
            
            // Ownership request listener'ı başlat
            listenOwnershipRequests();
            
            // ✅ FIX: Sync request listener'ı başlat (artık owner'ız)
            listenSyncRequests();
            
            // UI güncelle
            updateRoomInfoDisplay();
            updateOwnershipRequestButton();
            
            // ✅ FIX: Kontrolleri güncelle (VR butonları enabled olsun)
            updateControlsForSync(false);
            
            // ✅ FIX: YouTube modundaysa ek kontrolleri güncelle (arama çubuğu görünsün)
            if (isYouTubeMode) {
                updateYouTubeControls();
            }
            
            pendingOwnershipRequest = null;
            
        } else if (request.status === 'rejected') {
            // İstek reddedildi
            debugLog('😔 Ownership request rejected');
            
            lastOwnershipRequestTime = Date.now();
            pendingOwnershipRequest = null;
            
            // ✅ FIX: Her iki buton için cooldown'a girsin
            updateOwnershipRequestButton();
            
            alert('Sahiplik isteğiniz reddedildi. 2 dakika sonra tekrar deneyebilirsiniz.');
        }
    });
    
    ref.on('child_removed', (snapshot) => {
        // İstek silindi (timeout veya kabul sonrası)
        if (pendingOwnershipRequest === snapshot.key) {
            pendingOwnershipRequest = null;
            updateOwnershipRequestButton();
        }
    });
}