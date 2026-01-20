
// Unmute overlay'ini gizle
function hideUnmuteOverlay() {
    const overlay = document.getElementById('youtube-unmute-overlay');
    if (overlay) {
        overlay.removeEventListener('click', handleUnmuteClick);
        overlay.removeEventListener('touchstart', handleUnmuteClick);
        overlay.remove();
        debugLog('🔊 Unmute overlay hidden');
    }
}

// Unmute tıklama handler'ı (user gesture)
function handleUnmuteClick(e) {
    e.preventDefault();
    e.stopPropagation();
    
    if (ytPlayer && ytPlayerReady) {
        // ✅ User gesture ile unmute
        ytPlayer.unMute();
        ytPlayer.setVolume(100);
        
        // ✅ Eğer owner playing state'indeyse videoyu oynat
        if (currentRoomData && currentRoomData.videoState && currentRoomData.videoState.isPlaying) {
            ytPlayer.playVideo();
            debugLog('▶️ Video started with user gesture');
        }
        
        debugLog('🔊 Video unmuted with user gesture');
    }
    
    hideUnmuteOverlay();
}

debugLog('✅ YouTube IFrame API wrapper loaded');