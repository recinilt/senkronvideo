// ✅ MEMORY LEAK FIX: Object URL temizleme
        function revokeCurrentVideoURL() {
            if (currentVideoObjectURL) {
                URL.revokeObjectURL(currentVideoObjectURL);
                currentVideoObjectURL = null;
                debugLog('🧹 Object URL revoked');
            }
        }
        
        // ==================== P2P WebTorrent FUNCTIONS ====================
        
        // Video source tab değiştirme
        function switchVideoSourceTab(tab) {
            currentVideoSourceType = tab;
            
            const tabUrl = getCachedElement('tab-url');
            const tabLocal = getCachedElement('tab-local');
            const tabYoutube = getCachedElement('tab-youtube');
            const urlSection = getCachedElement('url-section');
            const localSection = getCachedElement('local-file-section');
            const youtubeSection = getCachedElement('youtube-section');
            
            // Tüm tabları deaktif et
            if (tabUrl) tabUrl.classList.remove('active');
            if (tabLocal) tabLocal.classList.remove('active');
            if (tabYoutube) tabYoutube.classList.remove('active');
            
            // Tüm section'ları gizle
            if (urlSection) urlSection.classList.add('hidden-tab');
            if (localSection) localSection.classList.remove('active');
            if (youtubeSection) youtubeSection.classList.remove('active');
            
            if (tab === 'url') {
                if (tabUrl) tabUrl.classList.add('active');
                if (urlSection) urlSection.classList.remove('hidden-tab');
            } else if (tab === 'local') {
                if (tabLocal) tabLocal.classList.add('active');
                if (localSection) localSection.classList.add('active');
            } else if (tab === 'youtube') {
                if (tabYoutube) tabYoutube.classList.add('active');
                if (youtubeSection) youtubeSection.classList.add('active');
            }
        }
        
        // YouTube URL'den video ID çıkar
        function extractYouTubeVideoId(url) {
            if (!url) return null;
            
            // Desteklenen formatlar:
            // https://www.youtube.com/watch?v=VIDEO_ID
            // https://youtu.be/VIDEO_ID
            // https://www.youtube.com/embed/VIDEO_ID
            // https://www.youtube.com/v/VIDEO_ID
            
            const patterns = [
                /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
                /^([a-zA-Z0-9_-]{11})$/ // Sadece video ID girilmişse
            ];
            
            for (const pattern of patterns) {
                const match = url.match(pattern);
                if (match && match[1]) {
                    return match[1];
                }
            }
            
            return null;
        }
        
        // YouTube URL mi kontrol et
        function isYouTubeUrl(url) {
            if (!url) return false;
            return extractYouTubeVideoId(url) !== null;
        }
        
        // P2P Client başlatma
        function initP2PClient() {
            if (p2pClient) return p2pClient;
            
            try {
                p2pClient = new WebTorrent();
                
                p2pClient.on('error', (err) => {
                    console.error('WebTorrent error:', err);
                    updateP2PStatus('❌ P2P Hatası: ' + err.message, 0);
                });
                
                debugLog('✅ WebTorrent client initialized');
                return p2pClient;
            } catch (e) {
                console.error('WebTorrent init error:', e);
                return null;
            }
        }