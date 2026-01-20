        
        function updateControlsForSync(inSync) {
            // 2D Video kontrolleri
            const playBtn = getCachedElement('btn-play');
            const pauseBtn = getCachedElement('btn-pause');
            const stopBtn = getCachedElement('btn-stop');
            const rewindBtn = getCachedElement('btn-rewind');
            const forwardBtn = getCachedElement('btn-forward');
            const syncBtn = getCachedElement('btn-sync');
            
            // YouTube kontrolleri
            const ytPlayBtn = document.getElementById('yt-btn-play');
            const ytPauseBtn = document.getElementById('yt-btn-pause');
            const ytStopBtn = document.getElementById('yt-btn-stop');
            const ytRewindBtn = document.getElementById('yt-btn-rewind');
            const ytForwardBtn = document.getElementById('yt-btn-forward');
            const ytSyncBtn = document.getElementById('yt-btn-sync');
            
            if (inSync) {
                // Sync modunda tüm kontroller disabled
                if (playBtn) playBtn.disabled = true;
                if (pauseBtn) pauseBtn.disabled = true;
                if (stopBtn) stopBtn.disabled = true;
                if (rewindBtn) rewindBtn.disabled = true;
                if (forwardBtn) forwardBtn.disabled = true;
                if (syncBtn) syncBtn.disabled = true;
                
                if (ytPlayBtn) ytPlayBtn.disabled = true;
                if (ytPauseBtn) ytPauseBtn.disabled = true;
                if (ytStopBtn) ytStopBtn.disabled = true;
                if (ytRewindBtn) ytRewindBtn.disabled = true;
                if (ytForwardBtn) ytForwardBtn.disabled = true;
                if (ytSyncBtn) ytSyncBtn.disabled = true;
                
            } else {
                // Normal mod - owner/viewer'a göre ayarla
                const ownerOnlyBtns = [playBtn, pauseBtn, stopBtn, rewindBtn, forwardBtn];
                const ytOwnerOnlyBtns = [ytPlayBtn, ytPauseBtn, ytStopBtn, ytRewindBtn, ytForwardBtn];
                
                ownerOnlyBtns.forEach(btn => {
                    if (btn) {
                        btn.disabled = !isRoomOwner;
                        btn.style.opacity = isRoomOwner ? '1' : '0.5';
                        btn.style.cursor = isRoomOwner ? 'pointer' : 'not-allowed';
                    }
                });
                
                ytOwnerOnlyBtns.forEach(btn => {
                    if (btn) {
                        btn.disabled = !isRoomOwner;
                        btn.style.opacity = isRoomOwner ? '1' : '0.5';
                        btn.style.cursor = isRoomOwner ? 'pointer' : 'not-allowed';
                    }
                });
                
                // Sync butonu herkes için açık
                if (syncBtn) {
                    syncBtn.disabled = false;
                    syncBtn.style.opacity = '1';
                    syncBtn.style.cursor = 'pointer';
                }
                if (ytSyncBtn) {
                    ytSyncBtn.disabled = false;
                    ytSyncBtn.style.opacity = '1';
                    ytSyncBtn.style.cursor = 'pointer';
                }
            }
        }
