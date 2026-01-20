
        function setCommandSourceSelf() {
            if (commandSourceTimeoutId) {
                clearTimeout(commandSourceTimeoutId);
            }
            lastCommandSource = 'self';
            commandSourceTimeoutId = setTimeout(() => {
                lastCommandSource = null;
                commandSourceTimeoutId = null;
            }, 2000);
        }

        function updateVideoState(updates) {
            if (videoStateUpdateDebounce) {
                clearTimeout(videoStateUpdateDebounce);
            }
            
            videoStateUpdateDebounce = setTimeout(() => {
                setCommandSourceSelf();
                db.ref(`rooms/${currentRoomId}/videoState`).update(updates);
                videoStateUpdateDebounce = null;
            }, 200);
        }


function seekBackward() {
    if (!isRoomOwner || !videoElement) return;

    pendingSeekAmount -= 10;

    if (seekDebounceTimer) {
        clearTimeout(seekDebounceTimer);
    }

    seekDebounceTimer = setTimeout(() => {
        executeSeek('backward', pendingSeekAmount);
        seekDebounceTimer = null;
        pendingSeekAmount = 0;
    }, 500);
}

function seekForward() {
    if (!isRoomOwner || !videoElement) return;

    pendingSeekAmount += 10;

    if (seekDebounceTimer) {
        clearTimeout(seekDebounceTimer);
    }

    seekDebounceTimer = setTimeout(() => {
        executeSeek('forward', pendingSeekAmount);
        seekDebounceTimer = null;
        pendingSeekAmount = 0;
    }, 500);
}
