
function applyDashCap() {
    if (!dashInstance) return;

    let list = [];
    try {
        list = dashInstance.getBitrateInfoListFor('video') || [];
    } catch (e) {
        list = [];
    }
    if (!list.length) return;

    const kbpsValues = list.map(i => normalizeKbps(i.bitrate)).filter(v => v !== null);
    if (!kbpsValues.length) return;

    const minKbps = Math.min(...kbpsValues);

    const candidates = list
        .filter(i => (i.height || 0) > 0 && i.height <= abrMaxHeightCap)
        .map(i => normalizeKbps(i.bitrate))
        .filter(v => v !== null);

    const maxKbps = candidates.length ? Math.max(...candidates) : minKbps;

    // Start low, keep min low, cap max to selected threshold
    dashInstance.updateSettings({
        streaming: {
            abr: {
                initialBitrate: { audio: -1, video: minKbps },
                minBitrate: { audio: -1, video: minKbps },
                maxBitrate: { audio: -1, video: maxKbps }
            },
            buffer: {
                fastSwitchEnabled: true
            }
        }
    });
}
