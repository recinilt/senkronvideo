// ==================== YOUTUBE UI ====================

// YouTube 2D container oluştur
function createYouTube2DContainer() {
    // Mevcut container'ı temizle
    const existing = document.getElementById('youtube-2d-container');
    if (existing) existing.remove();
    
    const container = document.createElement('div');
    container.id = 'youtube-2d-container';
    container.innerHTML = `
        <div class="youtube-header">
            <div class="youtube-room-info">
                <span id="youtube-room-name"></span>
                <span id="youtube-viewer-count"></span>
            </div>
            <div class="youtube-vr-warning">
                ⚠️ YouTube modu: VR desteklenmiyor (2D Watch Party)
            </div>
        </div>
        
        <!-- ✅ YENİ: YouTube Arama Bölümü (Sadece Oda Sahibi) -->
        <div id="yt-search-container" class="yt-search-container" style="display: none;">
            <div class="yt-search-input-wrapper">
                <input type="text" id="yt-search-input" placeholder="Video ara... (karaoke, müzik, film...)" onkeydown="handleYTSearchKeydown(event)">
                <button id="yt-search-btn" onclick="handleYTSearchClick()">🔍</button>
            </div>
            <div id="yt-search-results" class="yt-search-results"></div>
        </div>
        
        <div class="youtube-player-wrapper">
            <div id="youtube-player-container"></div>
        </div>
        <div class="youtube-controls">
            <div class="youtube-progress-bar" id="youtube-progress-bar">
                <div class="youtube-progress-fill" id="youtube-progress-fill"></div>
            </div>
            <div class="youtube-control-buttons">
                <button id="yt-btn-play" onclick="ytPlayVideo()">▶️ Oynat</button>
                <button id="yt-btn-pause" onclick="ytPauseVideo()">⏸️ Duraklat</button>
                <button id="yt-btn-stop" onclick="ytStopVideo()">⏹️ Stop</button>
                <button id="yt-btn-rewind" onclick="ytSeekBackward()">⏪ -10s</button>
                <button id="yt-btn-forward" onclick="ytSeekForward()">⏩ +10s</button>
                <button id="yt-btn-sync" onclick="initiateSync()">🔄 Sync</button>
                <button id="yt-btn-request-ownership" onclick="sendOwnershipRequest()">🙋 Sahiplik İste</button>
                <button onclick="leaveRoom()">🚪 Çık</button>
            </div>
            <div class="youtube-time-info">
                <span id="youtube-time-display">0:00 / 0:00</span>
                <span id="youtube-sync-status" class="status-good">✅ Senkronize</span>
            </div>
        </div>
    `;
    
    document.body.appendChild(container);
    
    // A-Frame sahnesini gizle
    const scene = document.querySelector('a-scene');
    if (scene) {
        scene.style.display = 'none';
    }
    
    // Normal VR kontrollerini gizle
    const vrControls = getCachedElement('vr-controls');
    if (vrControls) vrControls.style.display = 'none';
    
    const roomInfo = getCachedElement('room-info');
    if (roomInfo) roomInfo.style.display = 'none';
    
    const syncStatus = getCachedElement('sync-status');
    if (syncStatus) syncStatus.style.display = 'none';
    
    debugLog('✅ YouTube 2D container created');
    return container;
}

// YouTube hata göster
function showYouTubeError(message) {
    const container = document.getElementById('youtube-player-container');
    if (container) {
        container.innerHTML = `
            <div class="youtube-error">
                <h3>❌ YouTube Hatası</h3>
                <p>${message}</p>
                <p style="font-size: 12px; opacity: 0.7;">Video gömülmeye izin vermiyor olabilir veya bölgenizde kısıtlı olabilir.</p>
            </div>
        `;
    }
}