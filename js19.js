// joinRoom - race condition önleme (2D mode)
        async function joinRoom(roomId) {
            // Yarışma önleme - zaten katılım varsa çık
            if (isJoiningRoom) {
                debugLog('⚠️ Already joining a room, skipping duplicate call');
                return;
            }
            isJoiningRoom = true;
            
            try {
                if (!auth.currentUser) {
                    const userCredential = await auth.signInAnonymously();
                    currentUser = userCredential.user;
                } else {
                    currentUser = auth.currentUser;
                }
                
                // Önceki onDisconnect'i iptal et
                if (currentOnDisconnectRef) {
                    await currentOnDisconnectRef.cancel().catch(() => {});
                    currentOnDisconnectRef = null;
                }
                
                currentRoomId = roomId;
                const roomSnapshot = await db.ref('rooms/' + roomId).once('value');
                currentRoomData = roomSnapshot.val();
                
                if (!currentRoomData) {
                    alert('Oda bulunamadı!');
                    isJoiningRoom = false;
                    return;
                }
                
                // Sahiplik kontrolü: Mevcut owner ile karşılaştır
                isRoomOwner = currentUser.uid === currentRoomData.owner;
                
                // Add to active viewers
                const viewerRef = db.ref('rooms/' + roomId + '/activeViewers/' + currentUser.uid);
                await viewerRef.set({
                    joinedAt: firebase.database.ServerValue.TIMESTAMP,
                    lastSeen: firebase.database.ServerValue.TIMESTAMP,
                    isOwner: isRoomOwner,
                    currentDrift: 0
                });
                
                // onDisconnect referansını sakla
                currentOnDisconnectRef = viewerRef.onDisconnect();
                currentOnDisconnectRef.remove();
                
                await initClockSync();
                
                // 2D Scene oluştur (create3DScene yerine create2DScene)
                await create2DScene();
                
                // UI güncelle
                getCachedElement('ui-overlay').classList.add('hidden');
                
                // Legacy VR kontrolleri gizle (artık kullanılmıyor)
                const vrControls = getCachedElement('vr-controls');
                if (vrControls) vrControls.style.display = 'none';
                
                // Legacy elements
                const roomInfo = getCachedElement('room-info');
                if (roomInfo) roomInfo.style.display = 'none';
                
                const syncStatus = getCachedElement('sync-status');
                if (syncStatus) syncStatus.style.display = 'none';
                
                updateRoomInfoDisplay();
                listenVideoState();
                listenSyncState();
                
                // ✅ YENİ: Owner değişikliğini dinle (race condition çözümü)
                listenOwnerChange();
                
                // Sahip ayrılma listener'ı - herkes için
                listenOwnerLeft();
                
                if (isRoomOwner) {
                    startOwnerTasks();
                    // Sync isteklerini dinle
                    listenSyncRequests();
                    // Ownership isteklerini dinle
                    listenOwnershipRequests();
                } else {
                    listenKeyframes();
                    // Kendi sync isteğimin durumunu dinle
                    listenMySyncRequestStatus();
                    // Kendi ownership isteğimin durumunu dinle
                    listenMyOwnershipRequestStatus();
                }
                
                // Start all periodic tasks
                startPeriodicTasks();
                
                // Ownership request butonunu güncelle
                updateOwnershipRequestButton();
                
                isJoiningRoom = false;
                
            } catch (error) {
                console.error('❌ Odaya katılma hatası:', error);
                alert('Odaya katılınamadı: ' + error.message);
                isJoiningRoom = false;
            }
        }
        
        // ✅ YENİ: Owner değişikliğini dinle - race condition çözümü
        function listenOwnerChange() {
            if (!currentRoomId || !currentUser) return;
            
            const ref = db.ref('rooms/' + currentRoomId + '/owner');
            trackListener(ref);
            
            ref.on('value', (snapshot) => {
                const newOwnerUid = snapshot.val();
                if (!newOwnerUid) return;
                
                const wasOwner = isRoomOwner;
                const amINewOwner = newOwnerUid === currentUser.uid;
                
                // Değişiklik yoksa çık
                if (wasOwner === amINewOwner) return;
                
                debugLog('👑 Owner changed:', newOwnerUid, 'Am I owner?', amINewOwner);
                
                // State güncelle
                isRoomOwner = amINewOwner;
                currentRoomData.owner = newOwnerUid;
                
                if (amINewOwner && !wasOwner) {
                    // Ben yeni owner oldum
                    debugLog('🎉 I am now the owner!');
                    
                    // Keyframe listener'ı kapat (artık owner'ım)
                    db.ref('rooms/' + currentRoomId + '/keyframes').off();
                    
                    // Owner task'larını başlat
                    startOwnerTasks();
                    
                    // Ownership request listener'ı başlat
                    listenOwnershipRequests();
                    
                    // Sync request listener'ı başlat
                    listenSyncRequests();
                    
                } else if (!amINewOwner && wasOwner) {
                    // Ben artık owner değilim (sahipliği devrettim)
                    debugLog('📤 I am no longer the owner');
                    
                    // Owner task'larını durdur
                    clearOwnerTasks();
                    
                    // Ownership request listener'ı durdur
                    if (ownershipRequestListener) {
                        ownershipRequestListener.off();
                        ownershipRequestListener = null;
                    }
                    
                    if (ownershipRequestTimeoutInterval) {
                        clearInterval(ownershipRequestTimeoutInterval);
                        ownershipRequestTimeoutInterval = null;
                    }
                    
                    // Sync request listener'ı durdur
                    cleanupSyncRequests();
                    
                    // Keyframe listener'ı başlat (artık viewer'ım)
                    listenKeyframes();
                    
                    // Kendi isteklerimi dinlemeye başla
                    listenMySyncRequestStatus();
                    listenMyOwnershipRequestStatus();
                }
                
                // UI güncelle
                updateRoomInfoDisplay();
                updateOwnershipRequestButton();
                updateControlsForSync(false);
                
                // YouTube modundaysa ek kontrolleri güncelle
                if (isYouTubeMode) {
                    updateYouTubeControls();
                }
                
                // Active viewer'da isOwner güncelle
                db.ref('rooms/' + currentRoomId + '/activeViewers/' + currentUser.uid + '/isOwner')
                    .set(amINewOwner)
                    .catch(() => {});
            });
        }