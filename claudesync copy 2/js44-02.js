
// YouTube video stop (başa sar)
function ytStopVideo() {
    if (!isRoomOwner || !ytPlayer || !ytPlayerReady) return;
    
    lastCommandSource = 'self';
    ytPlayer.pauseVideo();
    ytPlayer.seekTo(0, true);
    
    db.ref('rooms/' + currentRoomId + '/videoState').update({
        isPlaying: false,
        currentTime: 0,
        startTimestamp: getServerTime(),
        lastUpdate: firebase.database.ServerValue.TIMESTAMP
    });
    
    trackTimeout(setTimeout(() => {
        lastCommandSource = null;
    }, 500));
}

// YouTube seek
function ytSeekTo(seconds, allowSeekAhead) {
    if (!ytPlayer || !ytPlayerReady) return;
    
    ytPlayer.seekTo(seconds, allowSeekAhead !== false);
}

// YouTube geri sar
function ytSeekBackward() {
    if (!isRoomOwner || !ytPlayer || !ytPlayerReady) return;
    
    const currentTime = ytPlayer.getCurrentTime();
    const newTime = Math.max(0, currentTime - 10);
    
    lastCommandSource = 'self';
    ytPlayer.seekTo(newTime, true);
    ytPlayer.pauseVideo();
    
    db.ref('rooms/' + currentRoomId + '/videoState').update({
        isPlaying: false,
        currentTime: newTime,
        startTimestamp: getServerTime(),
        lastUpdate: firebase.database.ServerValue.TIMESTAMP
    });
    
    debugLog('⏪ YouTube seek backward to:', newTime);
    
    trackTimeout(setTimeout(() => {
        lastCommandSource = null;
    }, 500));
}

// YouTube ileri sar
function ytSeekForward() {
    if (!isRoomOwner || !ytPlayer || !ytPlayerReady) return;
    
    const currentTime = ytPlayer.getCurrentTime();
    const duration = ytPlayer.getDuration();
    const newTime = Math.min(duration, currentTime + 10);
    
    lastCommandSource = 'self';
    ytPlayer.seekTo(newTime, true);
    ytPlayer.pauseVideo();
    
    db.ref('rooms/' + currentRoomId + '/videoState').update({
        isPlaying: false,
        currentTime: newTime,
        startTimestamp: getServerTime(),
        lastUpdate: firebase.database.ServerValue.TIMESTAMP
    });
    
    debugLog('⏩ YouTube seek forward to:', newTime);
    
    trackTimeout(setTimeout(() => {
        lastCommandSource = null;
    }, 500));
}

// ==================== YOUTUBE SYNC ====================

// ✅ FIX: YouTube video state'ini uygula (SADECE ilk yüklemede 1 kere)
function applyYouTubeVideoState(state) {
    if (!ytPlayer || !ytPlayerReady || !state) {
        debugLog('⚠️ applyYouTubeVideoState: player not ready or no state');
        return;
    }
    
    // ✅ FIX: Bu fonksiyon artık kullanılmıyor, sync interval hallediyor
    debugLog('ℹ️ applyYouTubeVideoState called but sync interval handles this');
}