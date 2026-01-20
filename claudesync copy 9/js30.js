        
        // ✅ Bu fonksiyon artık kullanılmıyor - yeni sistem playAtTime kullanıyor
        // Backward compatibility için tutuluyor
        function startSyncCountdownFromState(state) {
            // Yeni sistemde bu fonksiyon çağrılmıyor
            // applySyncState içinde playAtTime ile yönetiliyor
            debugLog('⚠️ startSyncCountdownFromState called but deprecated');
            
            if (state && state.playAtTime) {
                // Yeni sisteme yönlendir
                applySyncState(state);
            }
        }
