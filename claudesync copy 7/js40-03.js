

        // ==================== INIT ====================
        document.addEventListener('DOMContentLoaded', () => {
            console.log('🎬 Sinema ULTRA - Watch Party v4.0 (2D Mode)');
            updateQualityCapUI();
            setupFileInput(); // P2P dosya seçim event'lerini kur
            
            // VR scene event'leri kaldırıldı (artık 2D mode)
            
            // Keyboard listener
            keydownHandler = (e) => {
                if (!currentRoomId || !isRoomOwner) return;
                
                // Input alanına focus varsa klavye kısayollarını devre dışı bırak
                const activeElement = document.activeElement;
                const isInputFocused = activeElement && (
                    activeElement.tagName === 'INPUT' || 
                    activeElement.tagName === 'TEXTAREA' ||
                    activeElement.isContentEditable
                );
                
                if (isInputFocused) {
                    return; // Input'a yazıyorken kısayolları çalıştırma
                }
                
                // YouTube modunda da klavye kısayolları çalışsın
                if (isYouTubeMode) {
                    switch(e.key) {
                        case ' ':
                            e.preventDefault();
                            if (ytPlayer && ytPlayerReady) {
                                const state = ytPlayer.getPlayerState();
                                if (state === YT.PlayerState.PLAYING) {
                                    ytPauseVideo();
                                } else {
                                    ytPlayVideo();
                                }
                            }
                            break;
                        case 'ArrowLeft':
                            e.preventDefault();
                            ytSeekBackward();
                            break;
                        case 'ArrowRight':
                            e.preventDefault();
                            ytSeekForward();
                            break;
                        case 'f':
                        case 'F':
                            e.preventDefault();
                            toggleFullscreen();
                            break;
                    }
                    return;
                }
                
                // Normal video modu
                switch(e.key) {
                    case ' ':
                        e.preventDefault();
                        if (videoElement && videoElement.paused) {
                            playVideo();
                        } else {
                            pauseVideo();
                        }
                        break;
                    case 'ArrowLeft':
                        e.preventDefault();
                        seekBackward();
                        break;
                    case 'ArrowRight':
                        e.preventDefault();
                        seekForward();
                        break;
                    case 'f':
                    case 'F':
                        e.preventDefault();
                        toggleFullscreen();
                        break;
                    case 'm':
                    case 'M':
                        e.preventDefault();
                        toggleMute();
                        break;
                }
            };
            
            document.addEventListener('keydown', keydownHandler);
        });
        
        // Cleanup on page unload
        window.addEventListener('beforeunload', () => {
            fullCleanup();
        });
