
function destroyAdaptiveStreaming() {
    try {
        if (hlsInstance) {
            hlsInstance.destroy();
            hlsInstance = null;
        }
    } catch (e) {}

    try {
        if (dashInstance) {
            dashInstance.reset();
            dashInstance = null;
        }
    } catch (e) {}
}

function updateQualityCapUI() {
    const label = getCachedElement('quality-cap-label');
    if (label) label.textContent = `Max: ${abrMaxHeightCap}p`;

    const upBtn = getCachedElement('btn-quality-up');
    const downBtn = getCachedElement('btn-quality-down');
    if (upBtn) upBtn.disabled = abrMaxHeightCap >= 720;
    if (downBtn) downBtn.disabled = abrMaxHeightCap <= QUALITY_CAPS[0];
}

function setMaxQualityCap(newCap) {
    abrMaxHeightCap = Math.max(QUALITY_CAPS[0], Math.min(720, newCap));
    updateQualityCapUI();
    applyAdaptiveCap();
}

function increaseMaxQuality() {
    const idx = QUALITY_CAPS.indexOf(abrMaxHeightCap);
    const next = idx === -1 ? 720 : QUALITY_CAPS[Math.min(QUALITY_CAPS.length - 1, idx + 1)];
    setMaxQualityCap(next);
}

function decreaseMaxQuality() {
    const idx = QUALITY_CAPS.indexOf(abrMaxHeightCap);
    const next = idx === -1 ? 480 : QUALITY_CAPS[Math.max(0, idx - 1)];
    setMaxQualityCap(next);
}

function applyAdaptiveCap() {
    if (hlsInstance) {
        applyHlsCap();
    }
    if (dashInstance) {
        applyDashCap();
    }
}

function applyHlsCap() {
    if (!hlsInstance || !hlsInstance.levels || hlsInstance.levels.length === 0) return;

    let capIndex = -1;
    for (let i = 0; i < hlsInstance.levels.length; i++) {
        const h = hlsInstance.levels[i].height || 0;
        if (h > 0 && h <= abrMaxHeightCap) capIndex = i;
    }

    if (capIndex === -1) {
        // If levels don't expose height, just cap to the top level (best effort)
        capIndex = hlsInstance.levels.length - 1;
    }

    hlsInstance.autoLevelCapping = capIndex;

    // If currently above cap, force next segment down
    if (hlsInstance.currentLevel > capIndex) {
        hlsInstance.nextAutoLevel = capIndex;
    }
}

function normalizeKbps(value) {
    if (!isFinite(value) || isNaN(value)) return null;
    // dash.js commonly uses kbps, but guard if bits/s slipped in
    if (value > 100000) return Math.round(value / 1000);
    return Math.round(value);
}
