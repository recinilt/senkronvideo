
// ==================== UNMUTE OVERLAY (User Gesture için) ====================

// "Sesi Aç" overlay'ini göster
function showUnmuteOverlay() {
    // Mevcut overlay varsa kaldır
    hideUnmuteOverlay();
    
    const overlay = document.createElement('div');
    overlay.id = 'youtube-unmute-overlay';
    overlay.innerHTML = `
        <div class="unmute-content">
            <div class="unmute-icon">🔊</div>
            <div class="unmute-text">Sesi Açmak İçin Dokunun</div>
            <div class="unmute-subtext">Video sessiz oynatılıyor</div>
        </div>
    `;
    
    // Tıklama event'i - user gesture ile unmute
    overlay.addEventListener('click', handleUnmuteClick);
    overlay.addEventListener('touchstart', handleUnmuteClick);
    
    // Overlay stillerini ekle (inline)
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        cursor: pointer;
    `;
    
    const content = overlay.querySelector('.unmute-content');
    if (content) {
        content.style.cssText = `
            text-align: center;
            color: white;
            padding: 40px;
            background: rgba(102, 126, 234, 0.9);
            border-radius: 20px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.5);
        `;
    }
    
    const icon = overlay.querySelector('.unmute-icon');
    if (icon) {
        icon.style.cssText = `
            font-size: 80px;
            margin-bottom: 20px;
        `;
    }
    
    const text = overlay.querySelector('.unmute-text');
    if (text) {
        text.style.cssText = `
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 10px;
        `;
    }
    
    const subtext = overlay.querySelector('.unmute-subtext');
    if (subtext) {
        subtext.style.cssText = `
            font-size: 16px;
            opacity: 0.8;
        `;
    }
    
    document.body.appendChild(overlay);
    debugLog('🔊 Unmute overlay shown');
}