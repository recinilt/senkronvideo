// ==================== 2D SCENE ====================
// VR kaldırıldı, modern HTML5 video player

async function create2DScene() {
    // YouTube modu kontrolü
    isYouTubeMode = checkYouTubeMode();
    
    if (isYouTubeMode) {
        // YouTube 2D modu
        debugLog('🎬 YouTube mode detected - switching to 2D YouTube');
        await createYouTube2DScene();
        return;
    }

    // Normal video modu
    debugLog('🎬 Creating 2D video scene...');
    
    revokeCurrentVideoURL();
    
    // Video container'ı göster
    const videoContainer = document.getElementById('video-container');
    if (videoContainer) {
        videoContainer.classList.remove('hidden');
    }
    
    // UI overlay'i gizle
    const uiOverlay = getCachedElement('ui-overlay');
    if (uiOverlay) {
        uiOverlay.classList.add('hidden');
    }

    // Video element'i al
    videoElement = document.getElementById('video-player');
    if (!videoElement) {
        console.error('Video player element not found!');
        return;
    }
    
    videoElement.setAttribute('playsinline', '');
    videoElement.setAttribute('webkit-playsinline', '');
    
    // Listener tracking için array
    videoElement._listeners = [];

    const handleLoadedMetadata = () => {
        debugLog('📹 Video metadata loaded, duration:', videoElement.duration);
        updateVideoDuration();
    };

    const handleError = (e) => {
        console.error('Video error:', e);
        showVideoError('Video yüklenemedi');
    };
    
    const handleTimeUpdate = () => {
        updateVideoProgress();
    };

    videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);
    videoElement.addEventListener('error', handleError);
    videoElement.addEventListener('timeupdate', handleTimeUpdate);

    videoElement._listeners.push(
        { event: 'loadedmetadata', handler: handleLoadedMetadata },
        { event: 'error', handler: handleError },
        { event: 'timeupdate', handler: handleTimeUpdate }
    );

    // P2P mi yoksa URL mi kontrol et
    const isP2PRoom = currentRoomData.p2p && currentRoomData.p2p.magnetURI;
    
    if (isP2PRoom && !isRoomOwner) {
        // İzleyici: P2P ile TÜM VIDEO'yu indir
        try {
            // Kontrolleri devre dışı bırak
            disableAllControls();
            
            showP2PStatus('🔗 P2P bağlantısı kuruluyor...', 0);
            const videoFile = await joinP2PTorrent(currentRoomData.p2p.magnetURI);
            
            debugLog('✅ Video file ready, starting full download...');
            
            // TÜM DOSYAYI İNDİRMEYİ ZORLA
            videoFile.select(0, videoFile.length, true);
            
            // Torrent download progress izle
            const progressInterval = setInterval(() => {
                if (!currentTorrent) {
                    clearInterval(progressInterval);
                    return;
                }
                
                const progress = Math.round(currentTorrent.progress * 100);
                const downloaded = currentTorrent.downloaded;
                const total = currentTorrent.length;
                
                updateP2PStatus(`📥 İndiriliyor: %${progress} (${formatBytes(downloaded)} / ${formatBytes(total)})`, progress);
                
                const stats = `📥 ${formatBytes(currentTorrent.downloadSpeed)}/s | 📤 ${formatBytes(currentTorrent.uploadSpeed)}/s | 👥 ${currentTorrent.numPeers}`;
                updateP2PStats(stats);
                
                // %100 indiğinde Blob URL oluştur
                if (currentTorrent.progress === 1 && !currentVideoObjectURL) {
                    clearInterval(progressInterval);
                    
                    debugLog('✅ Download complete, creating Blob URL...');
                    updateP2PStatus('✅ İndirme tamamlandı, hazırlanıyor...', 100);
                    
                    // Blob URL oluştur
                    videoFile.getBlobURL((err, blobURL) => {
                        if (err) {
                            console.error('Blob URL error:', err);
                            updateP2PStatus('❌ Video hazırlanamadı', 0);
                            enableAllControls();
                            return;
                        }
                        
                        debugLog('✅ Blob URL created:', blobURL);
                        currentVideoObjectURL = blobURL;
                        videoElement.src = blobURL;
                        
                        // DOWNLOAD TAMAMLANDI - FLAG AKTİF
                        isP2PDownloadComplete = true;
                        
                        // Kontrolleri aktif et
                        enableAllControls();
                        
                        updateP2PStatus('✅ P2P video hazır!', 100);
                        
                        // Video hazır olduğunda Firebase state'e göre başlat
                        setTimeout(() => {
                            if (currentRoomData && currentRoomData.videoState && currentRoomData.videoState.isPlaying) {
                                videoElement.play().then(() => {
                                    debugLog('✅ P2P video auto-started');
                                }).catch(err => {
                                    console.warn('P2P autoplay failed:', err);
                                });
                            }
                        }, 1000);
                    });
                }
            }, 500);
            trackInterval(progressInterval);
            
        } catch (e) {
            console.error('P2P join error:', e);
            updateP2PStatus('❌ P2P hatası: ' + e.message, 0);
            enableAllControls();
        }
    } else if (isP2PRoom && isRoomOwner) {
        // Sahip: Zaten seed ediyoruz, lokal dosyayı kullan
        if (selectedLocalFile) {
            const objectURL = URL.createObjectURL(selectedLocalFile);
            currentVideoObjectURL = objectURL;
            videoElement.src = objectURL;
            showP2PStatus('📤 Paylaşılıyor...', 100);
            
            // Owner için P2P complete (lokal dosya)
            isP2PDownloadComplete = true;
        }
    } else {
        // Normal URL modu - P2P yok
        setupAdaptiveSource(currentRoomData.videoUrl);
        isP2PDownloadComplete = true;
    }

    // Owner event listeners
    const playListener = () => {
        if (syncState) return;
        if (currentRoomData.videoState && !currentRoomData.videoState.isPlaying) {
            syncVideoState();
        }
    };

    const pauseListener = () => {
        if (syncState) return;
        if (currentRoomData.videoState && currentRoomData.videoState.isPlaying) {
            syncVideoState();
        }
    };

    const seekedListener = () => {
        if (syncState || isSeeking) return;
        syncVideoState();
    };

    if (isRoomOwner) {
        videoElement.addEventListener('play', playListener);
        videoElement.addEventListener('pause', pauseListener);
        videoElement.addEventListener('seeked', seekedListener);

        videoElement._listeners.push(
            { event: 'play', handler: playListener },
            { event: 'pause', handler: pauseListener },
            { event: 'seeked', handler: seekedListener }
        );
    }

    // Room info güncelle
    update2DRoomInfo();
    
    // Progress bar click handler
    setupProgressBarHandlers();
    
    // Kontrol durumunu güncelle
    updateControlsForSync(false);
    
    debugLog('✅ 2D video scene created');
}

// Backward compatibility - eski fonksiyon adı
async function create3DScene() {
    return create2DScene();
}

// Room info güncelle (2D mode)
function update2DRoomInfo() {
    const roomNameEl = document.getElementById('video-room-name');
    const viewerCountEl = document.getElementById('video-viewer-count');
    
    if (roomNameEl && currentRoomData) {
        roomNameEl.textContent = currentRoomData.name + (isRoomOwner ? ' 👑' : '');
    }
    
    // Legacy element'leri de güncelle
    const legacyRoomName = getCachedElement('room-name-display');
    if (legacyRoomName && currentRoomData) {
        legacyRoomName.textContent = currentRoomData.name + (isRoomOwner ? ' 👑' : '');
    }
    
    // Viewer count güncelle
    if (viewerCountEl && currentRoomId) {
        db.ref('rooms/' + currentRoomId + '/activeViewers').once('value')
            .then(snapshot => {
                const count = snapshot.numChildren();
                viewerCountEl.textContent = `👥 ${count} izleyici`;
                
                const legacyCount = getCachedElement('viewer-count');
                if (legacyCount) {
                    legacyCount.textContent = `👥 ${count} izleyici`;
                }
            })
            .catch(() => {});
    }
}

// Video progress bar handlers
function setupProgressBarHandlers() {
    const progressBar = document.getElementById('video-progress-bar');
    if (!progressBar) return;
    
    let isDragging = false;
    
    const handleProgressClick = (e) => {
        if (!videoElement || !videoElement.duration || !isRoomOwner) return;
        
        const rect = progressBar.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        const time = percent * videoElement.duration;
        
        seekToTime(time);
    };
    
    const handleProgressDrag = (e) => {
        if (!isDragging || !videoElement || !videoElement.duration || !isRoomOwner) return;
        
        const rect = progressBar.getBoundingClientRect();
        const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        
        // Preview time update
        const fill = document.getElementById('video-progress-fill');
        const handle = document.getElementById('video-progress-handle');
        if (fill) fill.style.width = (percent * 100) + '%';
        if (handle) handle.style.left = (percent * 100) + '%';
    };
    
    progressBar.addEventListener('click', handleProgressClick);
    
    progressBar.addEventListener('mousedown', (e) => {
        if (!isRoomOwner) return;
        isDragging = true;
        handleProgressDrag(e);
    });
    
    document.addEventListener('mousemove', (e) => {
        if (isDragging) handleProgressDrag(e);
    });
    
    document.addEventListener('mouseup', (e) => {
        if (isDragging && isRoomOwner) {
            isDragging = false;
            
            const rect = progressBar.getBoundingClientRect();
            const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
            const time = percent * videoElement.duration;
            
            seekToTime(time);
        }
    });
    
    // Touch support
    progressBar.addEventListener('touchstart', (e) => {
        if (!isRoomOwner) return;
        e.preventDefault();
        const touch = e.touches[0];
        const rect = progressBar.getBoundingClientRect();
        const percent = (touch.clientX - rect.left) / rect.width;
        const time = percent * videoElement.duration;
        seekToTime(time);
    });
}

// Seek to specific time
function seekToTime(time) {
    if (!videoElement || !videoElement.duration || !isRoomOwner) return;
    
    const targetTime = Math.max(0, Math.min(videoElement.duration, time));
    
    lastCommandSource = 'self';
    videoElement.pause();
    videoElement.currentTime = targetTime;
    
    const serverTime = getServerTime();
    db.ref('rooms/' + currentRoomId + '/videoState').update({
        isPlaying: false,
        currentTime: targetTime,
        startTimestamp: serverTime,
        lastUpdate: firebase.database.ServerValue.TIMESTAMP
    });
    
    debugLog('⏩ Seek to:', targetTime.toFixed(2), 'saniye');
    
    trackTimeout(setTimeout(() => {
        lastCommandSource = null;
    }, 300));
}

// Video progress güncelle
function updateVideoProgress() {
    if (!videoElement) return;
    
    const current = videoElement.currentTime;
    const duration = videoElement.duration;
    
    if (duration > 0 && isFinite(duration)) {
        const percent = (current / duration) * 100;
        
        const fill = document.getElementById('video-progress-fill');
        const handle = document.getElementById('video-progress-handle');
        const currentTimeEl = document.getElementById('video-current-time');
        
        if (fill) fill.style.width = percent + '%';
        if (handle) handle.style.left = percent + '%';
        if (currentTimeEl) currentTimeEl.textContent = formatTime(current);
    }
}

// Video duration güncelle
function updateVideoDuration() {
    if (!videoElement) return;
    
    const durationEl = document.getElementById('video-duration');
    if (durationEl && videoElement.duration && isFinite(videoElement.duration)) {
        durationEl.textContent = formatTime(videoElement.duration);
    }
}

// Time format helper
function formatTime(seconds) {
    if (!isFinite(seconds) || isNaN(seconds)) return '0:00';
    
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hrs > 0) {
        return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Video error göster
function showVideoError(message) {
    const wrapper = document.querySelector('.video-player-wrapper');
    if (wrapper) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'video-overlay';
        errorDiv.style.display = 'block';
        errorDiv.style.fontSize = '18px';
        errorDiv.style.color = '#f87171';
        errorDiv.textContent = '❌ ' + message;
        wrapper.appendChild(errorDiv);
    }
}

// Volume kontrolleri
function toggleMute() {
    if (!videoElement) return;
    
    videoElement.muted = !videoElement.muted;
    
    const muteBtn = document.getElementById('btn-mute');
    if (muteBtn) {
        muteBtn.textContent = videoElement.muted ? '🔇' : '🔊';
    }
}

function setVolume(value) {
    if (!videoElement) return;
    
    videoElement.volume = parseFloat(value);
    
    if (videoElement.muted && value > 0) {
        videoElement.muted = false;
    }
    
    const muteBtn = document.getElementById('btn-mute');
    if (muteBtn) {
        muteBtn.textContent = videoElement.volume === 0 || videoElement.muted ? '🔇' : '🔊';
    }
}

// Fullscreen kontrolü
function toggleFullscreen() {
    const container = document.getElementById('video-container');
    if (!container) return;
    
    if (document.fullscreenElement || document.webkitFullscreenElement) {
        // Fullscreen'den çık
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        }
        container.classList.remove('fullscreen');
    } else {
        // Fullscreen'e gir
        if (container.requestFullscreen) {
            container.requestFullscreen();
        } else if (container.webkitRequestFullscreen) {
            container.webkitRequestFullscreen();
        } else if (videoElement && videoElement.webkitEnterFullscreen) {
            // iOS Safari fallback
            videoElement.webkitEnterFullscreen();
        }
        container.classList.add('fullscreen');
    }
}

// Fullscreen değişikliği dinle
document.addEventListener('fullscreenchange', () => {
    const container = document.getElementById('video-container');
    if (container) {
        if (!document.fullscreenElement) {
            container.classList.remove('fullscreen');
        }
    }
});

document.addEventListener('webkitfullscreenchange', () => {
    const container = document.getElementById('video-container');
    if (container) {
        if (!document.webkitFullscreenElement) {
            container.classList.remove('fullscreen');
        }
    }
});

debugLog('✅ 2D Scene module loaded');
