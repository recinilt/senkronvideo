        
        // P2P Status UI
        function showP2PStatus(text, progress) {
            const statusEl = getCachedElement('p2p-status');
            const textEl = getCachedElement('p2p-status-text');
            const fillEl = getCachedElement('p2p-progress-fill');
            
            if (statusEl) statusEl.style.display = 'block';
            if (textEl) textEl.textContent = text;
            if (fillEl) fillEl.style.width = progress + '%';
        }
        
        function updateP2PStatus(text, progress) {
            const textEl = getCachedElement('p2p-status-text');
            const fillEl = getCachedElement('p2p-progress-fill');
            
            if (textEl) textEl.textContent = text;
            if (fillEl) fillEl.style.width = progress + '%';
        }
        
        function updateP2PStats(stats) {
            const statsEl = getCachedElement('p2p-stats');
            if (statsEl) statsEl.textContent = stats;
        }
        
        function hideP2PStatus() {
            const statusEl = getCachedElement('p2p-status');
            if (statusEl) statusEl.style.display = 'none';
        }
        
        function formatBytes(bytes) {
            if (bytes === 0) return '0 B';
            const k = 1024;
            const sizes = ['B', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
        }
