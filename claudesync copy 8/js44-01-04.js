
// ==================== YOUTUBE PLAYER CONTROLS ====================

// YouTube video oynat
function ytPlayVideo() {
    if (!isRoomOwner || !ytPlayer || !ytPlayerReady) return;
    
    lastCommandSource = 'self';
    ytPlayer.playVideo();
    
    // ✅ FIX: Firebase'e isPlaying: true yaz
    const currentTime = ytPlayer.getCurrentTime();
    const serverTime = getServerTime();
    
    db.ref('rooms/' + currentRoomId + '/videoState').update({
        isPlaying: true,
        currentTime: currentTime,
        startTimestamp: serverTime,
        lastUpdate: firebase.database.ServerValue.TIMESTAMP
    });
    
    debugLog('▶️ YouTube play command sent to Firebase');
    
    trackTimeout(setTimeout(() => {
        lastCommandSource = null;
    }, 500));
}

// YouTube video duraklat
function ytPauseVideo() {
    if (!isRoomOwner || !ytPlayer || !ytPlayerReady) return;
    
    lastCommandSource = 'self';
    ytPlayer.pauseVideo();
    
    const currentTime = ytPlayer.getCurrentTime();
    
    db.ref('rooms/' + currentRoomId + '/videoState').update({
        isPlaying: false,
        currentTime: currentTime,
        startTimestamp: getServerTime(),
        lastUpdate: firebase.database.ServerValue.TIMESTAMP,
        'keyframes': null,
        'syncState': null
    });
    
    trackTimeout(setTimeout(() => {
        lastCommandSource = null;
    }, 500));
}