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
        
        debugLog('✅ Accepting ownership request, transferring to:', newOwnerUid);
        
        // 1. İsteği güncelle
        await db.ref(`rooms/${currentRoomId}/ownershipRequests/${requestId}`).update({
            status: 'accepted'
        });
        
        // 2. Oda sahibini değiştir - listenOwnerChange() bunu dinliyor ve gerekli state güncellemelerini yapacak
        await db.ref(`rooms/${currentRoomId}`).update({
            owner: newOwnerUid
        });
        
        // 3. Modal'ı kapat
        hideOwnershipRequestModal();
        
        // 4. İsteği temizle (biraz bekle ki yeni owner görsün)
        trackTimeout(setTimeout(() => {
            db.ref(`rooms/${currentRoomId}/ownershipRequests/${requestId}`).remove().catch(() => {});
        }, 2000));
        
        debugLog('✅ Ownership transfer initiated to:', newOwnerUid);
        
    } catch (error) {
        console.error('Accept ownership error:', error);
        alert('Transfer başarısız: ' + error.message);
    }
}