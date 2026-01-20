async function showRoomList() {
            try {
                if (!auth.currentUser) {
                    await auth.signInAnonymously();
                }
                
                const roomsSnapshot = await db.ref('rooms').limitToLast(20).once('value');
                const roomList = getCachedElement('room-list');
                roomList.innerHTML = '';
                
                const rooms = [];
                const roomsToDelete = [];
                
                roomsSnapshot.forEach(child => {
                    const roomData = child.val();
                    const viewerCount = roomData.activeViewers ? Object.keys(roomData.activeViewers).length : 0;
                    
                    if (viewerCount === 0) {
                        roomsToDelete.push(child.key);
                    } else {
                        rooms.push({ id: child.key, data: roomData, viewers: viewerCount });
                    }
                });
                
                roomsToDelete.forEach(roomId => {
                    db.ref('rooms/' + roomId).remove();
                });
                
                if (rooms.length === 0) {
                    roomList.innerHTML = '<p style="text-align: center; opacity: 0.7;">Aktif oda bulunamadı</p>';
                } else {
                    rooms.forEach(room => {
                        const isP2P = room.data.p2p && room.data.p2p.magnetURI;
                        const isYouTube = room.data.youtube && room.data.youtube.videoId;
                        const isPasswordProtected = room.data.passwordHash ? true : false;
                        
                        let modeLabel = '';
                        let modeDetails = '';
                        
                        if (isP2P) {
                            modeLabel = '🔗 P2P';
                            modeDetails = '| 📁 ' + room.data.p2p.fileName;
                        } else if (isYouTube) {
                            modeLabel = '▶️ YouTube';
                            modeDetails = '| 📺 2D Watch Party';
                        }
                        
                        // Şifreli oda ikonu
                        const lockIcon = isPasswordProtected ? '🔒 ' : '';
                        
                        const roomDiv = document.createElement('div');
                        roomDiv.className = 'room-item';
                        if (isPasswordProtected) {
                            roomDiv.classList.add('room-locked');
                        }
                        roomDiv.innerHTML = `
                            <div class="room-name">${lockIcon}${room.data.name} ${modeLabel}</div>
                            <div class="room-details">👥 ${room.viewers} izleyici ${modeDetails}</div>
                        `;
                        // attemptJoinRoom kullan - şifre kontrolü yapar
                        roomDiv.onclick = () => attemptJoinRoom(room.id);
                        roomList.appendChild(roomDiv);
                    });
                }
                
                getCachedElement('create-room-section').classList.add('hidden');
                getCachedElement('room-list-section').classList.remove('hidden');
                
            } catch (error) {
                console.error('❌ Oda listesi hatası:', error);
                alert('Odalar yüklenirken hata oluştu: ' + error.message + '\n\nLütfen Firebase Rules ayarlarınızı kontrol edin.');
            }
        }