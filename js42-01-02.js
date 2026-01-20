// Sahiplik isteği gönder
async function sendOwnershipRequest() {
    if (!currentRoomId || !currentUser || isRoomOwner) {
        debugLog('⚠️ Cannot send ownership request');
        return;
    }
    
    // Cooldown kontrolü
    const now = Date.now();
    if (now - lastOwnershipRequestTime < OWNERSHIP_REQUEST_COOLDOWN && lastOwnershipRequestTime > 0) {
        const remaining = Math.ceil((OWNERSHIP_REQUEST_COOLDOWN - (now - lastOwnershipRequestTime)) / 1000);
        alert(`Lütfen ${remaining} saniye bekleyin.`);
        return;
    }
    
    // Mevcut pending isteğim var mı kontrol et
    const existingRequest = await db.ref(`rooms/${currentRoomId}/ownershipRequests`)
        .orderByChild('fromUid')
        .equalTo(currentUser.uid)
        .once('value');
    
    if (existingRequest.exists()) {
        let hasPending = false;
        existingRequest.forEach(child => {
            if (child.val().status === 'pending') {
                hasPending = true;
            }
        });
        
        if (hasPending) {
            alert('Zaten bekleyen bir isteğiniz var.');
            return;
        }
    }
    
    try {
        const requestRef = db.ref(`rooms/${currentRoomId}/ownershipRequests`).push();
        
        await requestRef.set({
            fromUid: currentUser.uid,
            timestamp: firebase.database.ServerValue.TIMESTAMP,
            status: 'pending',
            expiresAt: Date.now() + OWNERSHIP_REQUEST_TIMEOUT
        });
        
        pendingOwnershipRequest = requestRef.key;
        
        debugLog('✅ Ownership request sent:', requestRef.key);
        
        // ✅ FIX: Her iki buton için durumu güncelle
        const buttonIds = ['btn-request-ownership', 'yt-btn-request-ownership'];
        buttonIds.forEach(btnId => {
            const btn = btnId === 'btn-request-ownership' 
                ? getCachedElement(btnId) 
                : document.getElementById(btnId);
            if (btn) {
                btn.disabled = true;
                btn.style.opacity = '0.6';
                btn.textContent = '⏳ İstek gönderildi...';
            }
        });
        
        // Timeout kontrolü - istek 60sn sonra otomatik silinir
        trackTimeout(setTimeout(async () => {
            if (pendingOwnershipRequest === requestRef.key) {
                const snapshot = await requestRef.once('value');
                if (snapshot.exists() && snapshot.val().status === 'pending') {
                    await requestRef.remove();
                    debugLog('⏰ Ownership request expired');
                    pendingOwnershipRequest = null;
                    updateOwnershipRequestButton();
                }
            }
        }, OWNERSHIP_REQUEST_TIMEOUT));
        
    } catch (error) {
        console.error('Ownership request error:', error);
        alert('İstek gönderilemedi: ' + error.message);
    }
}