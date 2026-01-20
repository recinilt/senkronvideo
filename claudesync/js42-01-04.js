
// Sahiplik isteği modalı göster
function showOwnershipRequestModal(requestId, request) {
    // Mevcut modal varsa kapat
    hideOwnershipRequestModal();
    
    const modal = document.createElement('div');
    modal.id = 'ownership-request-modal';
    modal.className = 'ownership-modal-overlay';
    
    const remainingTime = Math.max(0, Math.ceil((request.expiresAt - Date.now()) / 1000));
    
    modal.innerHTML = `
        <div class="ownership-modal">
            <div class="ownership-modal-header">
                <span>🙋 Sahiplik İsteği</span>
                <span id="ownership-modal-timer">${remainingTime}s</span>
            </div>
            <div class="ownership-modal-body">
                <p>Bir katılımcı oda sahipliği istiyor.</p>
                <p class="ownership-modal-uid">Kullanıcı: ${request.fromUid.substring(0, 8)}...</p>
            </div>
            <div class="ownership-modal-buttons">
                <button class="ownership-btn-accept" onclick="acceptOwnershipRequest('${requestId}')">✅ Kabul Et</button>
                <button class="ownership-btn-reject" onclick="rejectOwnershipRequest('${requestId}')">❌ Reddet</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    currentRequestModal = modal;
    
    // Timer güncelle
    const timerEl = document.getElementById('ownership-modal-timer');
    const timerInterval = setInterval(() => {
        const remaining = Math.max(0, Math.ceil((request.expiresAt - Date.now()) / 1000));
        if (timerEl) {
            timerEl.textContent = `${remaining}s`;
        }
        
        if (remaining <= 0) {
            clearInterval(timerInterval);
            hideOwnershipRequestModal();
        }
    }, 1000);
    trackInterval(timerInterval);
}

// Modal'ı kapat
function hideOwnershipRequestModal() {
    const modal = document.getElementById('ownership-request-modal');
    if (modal) {
        modal.remove();
    }
    currentRequestModal = null;
}