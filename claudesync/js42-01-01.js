// ============================================
// OWNERSHIP REQUEST SİSTEMİ
// Katılımcılar oda sahipliği isteyebilir
// Kuyruk sistemi, timeout, cooldown destekli
// ============================================

// ==================== OWNERSHIP REQUEST FUNCTIONS ====================

// Ownership request butonu durumunu güncelle
function updateOwnershipRequestButton() {
    const btn = getCachedElement('btn-request-ownership');
    if (!btn) return;
    
    if (isRoomOwner) {
        btn.disabled = true;
        btn.style.opacity = '0.4';
        btn.style.cursor = 'not-allowed';
        btn.textContent = '👑 Oda Sahibisin';
    } else {
        // Cooldown kontrolü
        const now = Date.now();
        const timeSinceLastRequest = now - lastOwnershipRequestTime;
        
        if (timeSinceLastRequest < OWNERSHIP_REQUEST_COOLDOWN && lastOwnershipRequestTime > 0) {
            const remainingCooldown = Math.ceil((OWNERSHIP_REQUEST_COOLDOWN - timeSinceLastRequest) / 1000);
            btn.disabled = true;
            btn.style.opacity = '0.6';
            btn.textContent = `⏳ ${remainingCooldown}s bekle`;
            
            // Cooldown timer
            const cooldownInterval = setInterval(() => {
                const remaining = Math.ceil((OWNERSHIP_REQUEST_COOLDOWN - (Date.now() - lastOwnershipRequestTime)) / 1000);
                if (remaining <= 0) {
                    clearInterval(cooldownInterval);
                    btn.disabled = false;
                    btn.style.opacity = '1';
                    btn.style.cursor = 'pointer';
                    btn.textContent = '🙋 Sahiplik İste';
                } else {
                    btn.textContent = `⏳ ${remaining}s bekle`;
                }
            }, 1000);
            trackInterval(cooldownInterval);
        } else {
            btn.disabled = false;
            btn.style.opacity = '1';
            btn.style.cursor = 'pointer';
            btn.textContent = '🙋 Sahiplik İste';
        }
    }
}