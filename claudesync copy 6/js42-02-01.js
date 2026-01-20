// Sahiplik isteğini kabul et
async function acceptOwnershipRequest(requestId) {
    if (!currentRoomId || !isRoomOwner) return;
    
    try {
        const requestSnapshot = await db.ref(`rooms/${currentRoomId}/ownershipRequests/${requestId}`).once('value');
        const request = requestSnapshot.val();
        
        if (!request || request.status !== 'pending') {
            alert('Bu istek artık geçerli değil.');
            hideOwnershipRequestModal();
            return;
        }
        
        const newOwnerUid = request.fromUid;
        
        // Transfer işlemi
        ownerTransferInProgress = true;
        
        // 1. İsteği güncelle
        await db.ref(`rooms/${currentRoomId}/ownershipRequests/${requestId}`).update({
            status: 'accepted'
        });
        
        // 2. Oda sahibini değiştir
        await db.ref(`rooms/${currentRoomId}`).update({
            owner: newOwnerUid
        });
        
        // 3. Viewer bilgilerini güncelle
        await db.ref(`rooms/${currentRoomId}/activeViewers/${newOwnerUid}`).update({
            isOwner: true
        });
        
        await db.ref(`rooms/${currentRoomId}/activeViewers/${currentUser.uid}`).update({
            isOwner: false
        });
        
        // 4. Lokal state güncelle
        isRoomOwner = false;
        currentRoomData.owner = newOwnerUid;
        
        // 5. Owner task'larını durdur
        clearOwnerTasks();
        
        // 6. Ownership request listener'ı durdur
        if (ownershipRequestListener) {
            ownershipRequestListener.off();
            ownershipRequestListener = null;
        }
        
        if (ownershipRequestTimeoutInterval) {
            clearInterval(ownershipRequestTimeoutInterval);
            ownershipRequestTimeoutInterval = null;
        }
        
        // ✅ FIX: Sync request listener'ı durdur (eski sahip artık dinlememeli)
        cleanupSyncRequests();
        
        // 7. Keyframe listener'ı başlat (artık viewer'ız)
        listenKeyframes();
        
        // ✅ FIX: Kendi sync isteğimizin durumunu dinlemeye başla (artık viewer'ız)
        listenMySyncRequestStatus();
        
        // 8. UI güncelle
        updateRoomInfoDisplay();
        updateOwnershipRequestButton();
        
        // ✅ FIX: Kontrolleri güncelle (VR butonları disabled olsun)
        updateControlsForSync(false);
        
        // ✅ FIX: YouTube modundaysa ek kontrolleri güncelle (arama çubuğu gizlensin)
        if (isYouTubeMode) {
            updateYouTubeControls();
        }
        
        // 9. İsteği temizle
        await db.ref(`rooms/${currentRoomId}/ownershipRequests/${requestId}`).remove();
        
        debugLog('✅ Ownership transferred to:', newOwnerUid);
        
        hideOwnershipRequestModal();
        ownerTransferInProgress = false;
        
    } catch (error) {
        console.error('Accept ownership error:', error);
        alert('Transfer başarısız: ' + error.message);
        ownerTransferInProgress = false;
    }
}