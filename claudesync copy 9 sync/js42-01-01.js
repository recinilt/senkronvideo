// ============================================
// OWNERSHIP REQUEST SİSTEMİ
// Katılımcılar oda sahipliği isteyebilir
// Kuyruk sistemi, timeout, cooldown destekli
// ============================================

// ==================== OWNERSHIP REQUEST FUNCTIONS ====================

// Ownership request butonu durumunu güncelle
// ✅ FIX: Hem normal hem YouTube butonunu güncelle
function updateOwnershipRequestButton() {
    // Her iki buton ID'sini de güncelle
    const buttonIds = ['btn-request-ownership', 'yt-btn-request-ownership'];
    
    buttonIds.forEach(btnId => {
        const btn = btnId === 'btn-request-ownership' 
            ? getCachedElement(btnId) 
            : document.getElementById(btnId);
        
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
                
                // Cooldown timer - sadece bir kere başlat (ilk buton için)
                if (btnId === 'btn-request-ownership' || !document.getElementById('btn-request-ownership')) {
                    const cooldownInterval = setInterval(() => {
                        const remaining = Math.ceil((OWNERSHIP_REQUEST_COOLDOWN - (Date.now() - lastOwnershipRequestTime)) / 1000);
                        
                        // Her iki butonu da güncelle
                        buttonIds.forEach(id => {
                            const b = id === 'btn-request-ownership' 
                                ? getCachedElement(id) 
                                : document.getElementById(id);
                            if (!b) return;
                            
                            if (remaining <= 0) {
                                b.disabled = false;
                                b.style.opacity = '1';
                                b.style.cursor = 'pointer';
                                b.textContent = '🙋 Sahiplik İste';
                            } else {
                                b.textContent = `⏳ ${remaining}s bekle`;
                            }
                        });
                        
                        if (remaining <= 0) {
                            clearInterval(cooldownInterval);
                        }
                    }, 1000);
                    trackInterval(cooldownInterval);
                }
            } else if (pendingOwnershipRequest) {
                // ✅ FIX: Pending state göster
                btn.disabled = true;
                btn.style.opacity = '0.6';
                btn.textContent = '⏳ İstek gönderildi...';
            } else {
                btn.disabled = false;
                btn.style.opacity = '1';
                btn.style.cursor = 'pointer';
                btn.textContent = '🙋 Sahiplik İste';
            }
        }
    });
}