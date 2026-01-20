
function setupAdaptiveSource(url) {
    if (!videoElement) return;

    destroyAdaptiveStreaming();

    const type = getStreamType(url);

    if (type === 'hls') {
        if (window.Hls && Hls.isSupported()) {
            hlsInstance = new Hls({
                startLevel: 0, // start from lowest
                minAutoBitrate: 0, // allow lowest
                abrEwmaDefaultEstimate: 150000, // very low initial estimate (bps)
                abrBandWidthFactor: 0.9, // ✅ FIX: 0.8 -> 0.9 (kalite düşürme için daha muhafazakar)
                abrBandWidthUpFactor: 0.6 // ✅ FIX: 0.7 -> 0.6 (yukarı geçişte daha dikkatli)
            });

            hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => {
                applyHlsCap();
                updateQualityCapUI();
            });

            hlsInstance.attachMedia(videoElement);
            hlsInstance.loadSource(url);
            return;
        }

        // Safari / native HLS support
        videoElement.src = url;
        updateQualityCapUI();
        return;
    }

    if (type === 'dash') {
        if (window.dashjs && dashjs.MediaPlayer) {
            dashInstance = dashjs.MediaPlayer().create();

            dashInstance.updateSettings({
                streaming: {
                    abr: {
                        initialBitrate: { audio: -1, video: 150 }, // kbps
                        minBitrate: { audio: -1, video: 100 },
                        maxBitrate: { audio: -1, video: 2500 } // will be recalculated on init
                    },
                    buffer: {
                        fastSwitchEnabled: true
                    }
                }
            });

            dashInstance.on(dashjs.MediaPlayer.events.STREAM_INITIALIZED, () => {
                applyDashCap();
                updateQualityCapUI();
            });

            dashInstance.initialize(videoElement, url, false);
            return;
        }

        videoElement.src = url;
        updateQualityCapUI();
        return;
    }

    // Native progressive (mp4/webm/etc.)
    videoElement.src = url;
    updateQualityCapUI();
}
