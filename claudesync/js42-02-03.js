
// Ownership request cleanup
function cleanupOwnershipRequests() {
    if (ownershipRequestListener) {
        ownershipRequestListener.off();
        ownershipRequestListener = null;
    }
    
    if (ownershipRequestTimeoutInterval) {
        clearInterval(ownershipRequestTimeoutInterval);
        ownershipRequestTimeoutInterval = null;
    }
    
    hideOwnershipRequestModal();
    
    pendingOwnershipRequest = null;
    lastOwnershipRequestTime = 0;
    
    debugLog('🧹 Ownership request cleanup completed');
}

// Ownership request sistemi başlat
function initOwnershipRequestSystem() {
    if (isRoomOwner) {
        listenOwnershipRequests();
    } else {
        listenMyOwnershipRequestStatus();
    }
    
    updateOwnershipRequestButton();
    
    debugLog('✅ Ownership request system initialized');
}

debugLog('✅ Ownership Request System loaded');