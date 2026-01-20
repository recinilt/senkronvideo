        
        // Sync istek modalı göster
        function showSyncRequestModal(requestId, request) {
            // Mevcut modal varsa kapat
            hideSyncRequestModal();
            
            const modal = document.createElement('div');
            modal.id = 'sync-request-modal';
            modal.className = 'sync-modal-overlay';
            
            const remainingTime = Math.max(0, Math.ceil((request.expiresAt - Date.now()) / 1000));
            
            modal.innerHTML = `
                <div class="sync-modal">
                    <div class="sync-modal-header">
                        <span>🔄 Senkronizasyon İsteği</span>
                        <span id="sync-modal-timer">${remainingTime}s</span>
                    </div>
                    <div class="sync-modal-body">
                        <p>Bir katılımcı herkesi senkronize etmek istiyor.</p>
                        <p class="sync-modal-uid">Kullanıcı: ${request.fromUid.substring(0, 8)}...</p>
                    </div>
                    <div class="sync-modal-buttons">
                        <button class="sync-btn-accept" onclick="approveSyncRequest('${requestId}')">✅ Onayla</button>
                        <button class="sync-btn-reject" onclick="rejectSyncRequest('${requestId}')">❌ Reddet</button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            currentSyncRequestModal = modal;
            
            // Timer güncelle
            const timerEl = document.getElementById('sync-modal-timer');
            const timerInterval = setInterval(() => {
                const remaining = Math.max(0, Math.ceil((request.expiresAt - Date.now()) / 1000));
                if (timerEl) {
                    timerEl.textContent = `${remaining}s`;
                }
                
                if (remaining <= 0) {
                    clearInterval(timerInterval);
                    hideSyncRequestModal();
                }
            }, 1000);
            trackInterval(timerInterval);
        }
        
        // Modal'ı kapat
        function hideSyncRequestModal() {
            const modal = document.getElementById('sync-request-modal');
            if (modal) {
                modal.remove();
            }
            currentSyncRequestModal = null;
        }