
// Oda sahibi için: Gelen istekleri dinle
function listenOwnershipRequests() {
    if (!currentRoomId || !isRoomOwner) return;
    
    // Önceki listener'ı temizle
    if (ownershipRequestListener) {
        ownershipRequestListener.off();
        ownershipRequestListener = null;
    }
    
    ownershipRequestListener = db.ref(`rooms/${currentRoomId}/ownershipRequests`)
        .orderByChild('status')
        .equalTo('pending');
    
    trackListener(ownershipRequestListener);
    
    ownershipRequestListener.on('child_added', async (snapshot) => {
        const request = snapshot.val();
        const requestId = snapshot.key;
        
        if (!request || request.status !== 'pending') return;
        
        // Süresi dolmuş mu kontrol et
        if (request.expiresAt && Date.now() > request.expiresAt) {
            snapshot.ref.remove();
            return;
        }
        
        debugLog('📩 New ownership request from:', request.fromUid);
        
        // Modal göster
        showOwnershipRequestModal(requestId, request);
    });
    
    // Timeout interval - süresi dolan istekleri temizle
    if (ownershipRequestTimeoutInterval) {
        clearInterval(ownershipRequestTimeoutInterval);
    }
    
    ownershipRequestTimeoutInterval = setInterval(async () => {
        if (!currentRoomId || !isRoomOwner) return;
        
        const snapshot = await db.ref(`rooms/${currentRoomId}/ownershipRequests`).once('value');
        if (snapshot.exists()) {
            snapshot.forEach(child => {
                const req = child.val();
                if (req.expiresAt && Date.now() > req.expiresAt && req.status === 'pending') {
                    child.ref.remove();
                    debugLog('🧹 Expired request removed:', child.key);
                }
            });
        }
    }, 10000);
    trackInterval(ownershipRequestTimeoutInterval);
}