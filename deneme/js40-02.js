        
        function startOwnerTasks() {
            // Önce mevcut owner interval'larını temizle (birikim önleme)
            clearOwnerTasks();
            
            ownerKeyframeInterval = setInterval(sendKeyframe, KEYFRAME_INTERVAL);
            ownerCleanupInterval = setInterval(cleanupOldData, 30000);
            
            trackInterval(ownerKeyframeInterval);
            trackInterval(ownerCleanupInterval);
            
            debugLog('👑 Owner tasks started');
        }

// VR video-texture-fix component kaldırıldı (2D mode)
// Artık A-Frame kullanılmıyor
