// handleVRButton - backward compatibility için tutuluyor
// Artık VR panel yok ama eski kodlar bu fonksiyonu çağırabilir
function handleVRButton(action) {
            if (!isRoomOwner) return;
            
            switch(action) {
                case 'play':
                    playVideo();
                    break;
                case 'pause':
                    pauseVideo();
                    break;
                case 'stop':
                    stopVideo();
                    break;
                case 'rewind':
                    seekBackward();
                    break;
                case 'forward':
                    seekForward();
                    break;
            }
        }
        
        // ==================== VIDEO CONTROLS (OWNER ONLY) ====================
        let playPromisePending = false;
