// ==================== ROOM MANAGEMENT ====================
        async function createRoom() {
            const roomName = getCachedElement('room-name').value.trim();
            const videoUrl = getCachedElement('video-url').value.trim();
            const youtubeUrl = getCachedElement('youtube-url') ? getCachedElement('youtube-url').value.trim() : '';
            const screenSize = getCachedElement('screen-size').value;
            const environment = getCachedElement('environment').value;
            const roomPassword = getCachedElement('room-password') ? getCachedElement('room-password').value : '';
            
            // Mod kontrolü
            const isP2PMode = currentVideoSourceType === 'local';
            const isYouTubeModeSelected = currentVideoSourceType === 'youtube';
            
            if (!roomName) {
                alert('Lütfen oda adı giriniz!');
                return;
            }
            
            if (!isP2PMode && !isYouTubeModeSelected && !videoUrl) {
                alert('Lütfen video URL giriniz!');
                return;
            }
            
            if (isP2PMode && !selectedLocalFile) {
                alert('Lütfen bir video dosyası seçiniz!');
                return;
            }
            
            // YouTube modunda URL zorunlu DEĞİL - arama ile video seçilebilir
            // Zorunluluk kaldırıldı
            
            try {
                const userCredential = await auth.signInAnonymously();
                currentUser = userCredential.user;
                
                let finalVideoUrl = videoUrl;
                let magnetURI = null;
                let ytVideoId = null;
                
                // P2P modunda dosyayı seed et
                if (isP2PMode && selectedLocalFile) {
                    try {
                        magnetURI = await seedLocalVideo(selectedLocalFile);
                        finalVideoUrl = 'p2p://' + magnetURI; // P2P marker
                        debugLog('✅ Magnet URI created:', magnetURI);
                    } catch (e) {
                        console.error('Seed error:', e);
                        alert('Video paylaşımı başlatılamadı: ' + e.message);
                        return;
                    }
                }
                
                // YouTube modunda video ID çıkar (varsa)
                if (isYouTubeModeSelected) {
                    ytVideoId = extractYouTubeVideoId(youtubeUrl);
                    // ytVideoId null olabilir - sorun değil
                    if (ytVideoId) {
                        finalVideoUrl = 'youtube://' + ytVideoId;
                        debugLog('✅ YouTube video ID:', ytVideoId);
                    } else {
                        finalVideoUrl = 'youtube://'; // Marker, video sonra seçilecek
                        debugLog('ℹ️ YouTube mode - video will be selected via search');
                    }
                }
                
                // Şifre hash'le (boşsa null döner)
                const passwordHash = await hashPassword(roomPassword);
                
                const roomRef = db.ref('rooms').push();
                currentRoomId = roomRef.key;
                
                const roomData = {
                    name: roomName,
                    owner: currentUser.uid,
                    videoUrl: finalVideoUrl,
                    screenSize: screenSize,
                    environment: environment,
                    passwordHash: passwordHash,
                    createdAt: firebase.database.ServerValue.TIMESTAMP,
                    videoState: {
                        isPlaying: false,
                        currentTime: 0,
                        startTimestamp: 0,
                        lastUpdate: firebase.database.ServerValue.TIMESTAMP
                    }
                };
                
                // P2P modunda magnet URI'yi ayrı kaydet
                if (magnetURI) {
                    roomData.p2p = {
                        magnetURI: magnetURI,
                        fileName: selectedLocalFile.name,
                        fileSize: selectedLocalFile.size
                    };
                }
                
                // YouTube modunda video bilgilerini kaydet
                if (isYouTubeModeSelected) {
                    roomData.youtube = {
                        videoId: ytVideoId || '', // null yerine boş string
                        originalUrl: youtubeUrl || ''
                    };
                }
                
                await roomRef.set(roomData);
                
                await joinRoom(currentRoomId);
            } catch (error) {
                console.error('❌ Oda oluşturma hatası:', error);
                alert('Oda oluşturulamadı: ' + error.message);
            }
        }