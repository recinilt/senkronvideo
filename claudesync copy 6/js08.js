function queueRAF(callback) {
            rafQueue.push(callback);
            if (!rafScheduled) {
                rafScheduled = true;
                requestAnimationFrame(() => {
                    const callbacks = rafQueue.splice(0);
                    rafScheduled = false;
                    callbacks.forEach(cb => {
                        try { cb(); } catch(e) { console.warn('RAF callback error:', e); }
                    });
                });
            }
        }
        
        
        function getServerTime() {
            return Date.now() + clockOffset;
        }
        
        // DOM Element Caching
        function getCachedElement(id) {
            if (!cachedElements[id]) {
                cachedElements[id] = document.getElementById(id);
            }
            return cachedElements[id];
        }
        
        function clearElementCache() {
            cachedElements = {};
        }
        
        // ==================== MEMORY LEAK PREVENTION ====================
        function trackInterval(id) {
            if (id) activeIntervals.push(id);
            return id;
        }
        
        function trackTimeout(id) {
            if (id) activeTimeouts.push(id);
            return id;
        }
        
        function trackListener(ref) {
            if (ref) firebaseListeners.push(ref);
            return ref;
        }
        
        // ✅ FIX #7 & #11: Tüm interval'ları temizle
        function clearAllIntervals() {
            // Buffer countdown temizle
            if (bufferCountdownInterval) {
                clearInterval(bufferCountdownInterval);
                bufferCountdownInterval = null;
            }
            
            // Countdown interval temizle
            if (countdownInterval) {
                clearInterval(countdownInterval);
                countdownInterval = null;
            }
            
            // Seek debounce timer temizle
            if (seekDebounceTimer) {
                clearTimeout(seekDebounceTimer);
                seekDebounceTimer = null;
            }
            
            // P2P update interval temizle
            if (p2pUpdateInterval) {
                clearInterval(p2pUpdateInterval);
                p2pUpdateInterval = null;
            }
            
            // ✅ VR Seek bar update interval temizle
            if (seekBarUpdateInterval) {
                clearInterval(seekBarUpdateInterval);
                seekBarUpdateInterval = null;
            }
            
            activeIntervals.forEach(id => clearInterval(id));
            activeIntervals.length = 0;
        }