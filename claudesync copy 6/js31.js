        
        // ✅ Bu fonksiyon artık kullanılmıyor - yeni sistem executeSyncPlay kullanıyor
        // Backward compatibility için tutuluyor
        function executeSync(state) {
            debugLog('⚠️ executeSync called but deprecated, redirecting to executeSyncPlay');
            
            if (state) {
                executeSyncPlay(state);
            }
        }
