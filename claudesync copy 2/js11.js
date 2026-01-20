// P2P Client temizleme
        function destroyP2PClient() {
            if (p2pUpdateInterval) {
                clearInterval(p2pUpdateInterval);
                p2pUpdateInterval = null;
            }
            
            if (currentTorrent) {
                try {
                    currentTorrent.destroy();
                } catch (e) {}
                currentTorrent = null;
            }
            
            if (p2pClient) {
                try {
                    p2pClient.destroy();
                } catch (e) {}
                p2pClient = null;
            }
            
            // ✅ YENİ: Flag'i reset et
            isP2PDownloadComplete = false;
            
            hideP2PStatus();
            debugLog('🧹 P2P client destroyed');
        }