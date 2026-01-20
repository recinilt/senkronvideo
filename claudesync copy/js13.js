        
        // Magnet URI'den video indir (izleyici için)
        async function joinP2PTorrent(magnetURI) {
            return new Promise((resolve, reject) => {
                if (!magnetURI) {
                    reject(new Error('Magnet URI bulunamadı'));
                    return;
                }
                
                initP2PClient();
                
                if (!p2pClient) {
                    reject(new Error('WebTorrent başlatılamadı'));
                    return;
                }
                
                showP2PStatus('🔍 Torrent aranıyor...', 0);
                
                const opts = {
                    announce: WEBTORRENT_TRACKERS
                };
                
                p2pClient.add(magnetURI, opts, (torrent) => {
                    currentTorrent = torrent;
                    
                    debugLog('✅ Torrent joined:', torrent.infoHash);
                    debugLog('📁 Files:', torrent.files.map(f => f.name));
                    
                    // Video dosyasını bul
                    const videoFile = torrent.files.find(file => {
                        const ext = file.name.split('.').pop().toLowerCase();
                        return ['mp4', 'webm', 'mkv', 'ogv', 'mov', 'avi'].includes(ext);
                    });
                    
                    if (!videoFile) {
                        reject(new Error('Video dosyası bulunamadı'));
                        return;
                    }
                    
                    // Progress güncelleme
                    p2pUpdateInterval = setInterval(() => {
                        if (currentTorrent) {
                            const progress = Math.round(currentTorrent.progress * 100);
                            const stats = `📥 ${formatBytes(currentTorrent.downloadSpeed)}/s | 📤 ${formatBytes(currentTorrent.uploadSpeed)}/s | 👥 ${currentTorrent.numPeers}`;
                            updateP2PStatus(`📥 İndiriliyor: %${progress}`, progress);
                            updateP2PStats(stats);
                            
                            if (currentTorrent.progress === 1) {
                                updateP2PStatus('✅ Tamamlandı - Paylaşılıyor', 100);
                            }
                        }
                    }, 500);
                    trackInterval(p2pUpdateInterval);
                    
                    resolve(videoFile);
                });
                
                // Timeout
                setTimeout(() => {
                    if (!currentTorrent) {
                        reject(new Error('Torrent bağlantı zaman aşımı'));
                    }
                }, 60000);
            });
        }
