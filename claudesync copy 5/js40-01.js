function cleanupOldData() {
            if (!currentRoomId || !isRoomOwner) return;
            
            try {
                const cutoffTime = Date.now() - 60000;
                
                db.ref('rooms/' + currentRoomId + '/keyframes').once('value')
                    .then(snapshot => {
                        if (snapshot.exists()) {
                            snapshot.forEach(child => {
                                const data = child.val();
                                if (data.timestamp && data.timestamp < cutoffTime) {
                                    child.ref.remove().catch(() => {});
                                }
                            });
                        }
                    })
                    .catch(() => {});
                
                db.ref('rooms/' + currentRoomId + '/activeViewers').once('value')
                    .then(snapshot => {
                        if (snapshot.exists()) {
                            snapshot.forEach(child => {
                                const viewer = child.val();
                                if (viewer.lastSeen && (Date.now() - viewer.lastSeen > 60000)) {
                                    child.ref.remove().catch(() => {});
                                }
                            });
                        }
                    })
                    .catch(() => {});
                
                debugLog('🧹 Cleanup old data');
            } catch (error) {
                console.warn('Cleanup error:', error);
            }
        }
        
        // ✅ FIX #12: updateSyncStatus - queueRAF ile DOM thrashing önle
        function updateSyncStatus(drift) {
            if (!shouldUpdateUI()) return;
            
            queueRAF(() => {
                const statusText = getCachedElement('sync-text');
                if (!statusText) return;
                
                if (drift < TIER1_THRESHOLD) {
                    statusText.textContent = '✅ Senkronize';
                    statusText.className = 'status-good';
                } else if (drift < TIER2_THRESHOLD) {
                    statusText.textContent = '⚠️ Hafif sapma';
                    statusText.className = 'status-warning';
                } else {
                    statusText.textContent = '❌ Senkronizasyon kaybı';
                    statusText.className = 'status-error';
                }
            });
        }
        
        // ==================== PERIODIC TASKS ====================
        function startPeriodicTasks() {
            trackInterval(setInterval(initClockSync, CLOCK_SYNC_INTERVAL));
            trackInterval(setInterval(trackDrift, DRIFT_UPDATE_INTERVAL));
            trackInterval(setInterval(updatePresence, PRESENCE_UPDATE_INTERVAL));
            trackInterval(setInterval(updateViewerCount, 10000));
            trackInterval(setInterval(updateViewerPosition, 5000));
            
            if (!isRoomOwner) {
                trackInterval(setInterval(checkOwnerPresence, 30000));
            }
            
            debugLog('✅ Periodic tasks started');
        }
        
        // ✅ FIX: Owner interval ID'lerini ayrı track et (birikim önleme)
        let ownerKeyframeInterval = null;
        let ownerCleanupInterval = null;
        
        function clearOwnerTasks() {
            if (ownerKeyframeInterval) {
                clearInterval(ownerKeyframeInterval);
                ownerKeyframeInterval = null;
            }
            if (ownerCleanupInterval) {
                clearInterval(ownerCleanupInterval);
                ownerCleanupInterval = null;
            }
            debugLog('🧹 Owner tasks cleared');
        }