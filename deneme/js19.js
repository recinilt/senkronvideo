        
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
                
                // Sahip ayrılma listener'ı - herkes için
                listenOwnerLeft();
                
                if (isRoomOwner) {
                    startOwnerTasks();
                    // Sync isteklerini dinle
                    listenSyncRequests();
                } else {
                    listenKeyframes();
                    // Kendi sync isteğimin durumunu dinle
                    listenMySyncRequestStatus();
                }
                
                // Start all periodic tasks
                startPeriodicTasks();
                
                // Ownership request sistemini başlat
                initOwnershipRequestSystem();
                
                isJoiningRoom = false;
                
            } catch (error) {
                console.error('❌ Odaya katılma hatası:', error);
                alert('Odaya katılınamadı: ' + error.message);
                isJoiningRoom = false;
            }
        }
