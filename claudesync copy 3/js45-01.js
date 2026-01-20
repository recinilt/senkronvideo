// ============================================
// YOUTUBE ARAMA SİSTEMİ
// YouTube Data API v3 ile video arama
// Oda sahibi odadan çıkmadan video değiştirebilir
// ============================================

// ==================== VARIABLES ====================
// ytSearchLoading ve ytSearchResults js02.js'de tanımlı

// ==================== YOUTUBE SEARCH FUNCTIONS ====================

// YouTube'da video ara
async function searchYouTube(query) {
    if (!query || query.trim() === '') {
        showYTSearchError('Arama terimi giriniz');
        return;
    }
    
    if (YOUTUBE_API_KEY === 'YOUR_API_KEY_HERE' || !YOUTUBE_API_KEY) {
        showYTSearchError('YouTube API Key ayarlanmamış! js02.js dosyasında YOUTUBE_API_KEY değerini güncelleyin.');
        return;
    }
    
    if (ytSearchLoading) return;
    
    ytSearchLoading = true;
    updateYTSearchUI('loading');
    
    try {
        const encodedQuery = encodeURIComponent(query.trim());
        const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoEmbeddable=true&maxResults=10&q=${encodedQuery}&key=${YOUTUBE_API_KEY}`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error.message || 'API hatası');
        }
        
        if (!data.items || data.items.length === 0) {
            showYTSearchError('Sonuç bulunamadı');
            ytSearchResults = [];
        } else {
            ytSearchResults = data.items;
            renderYTSearchResults(data.items);
        }
        
    } catch (error) {
        console.error('YouTube search error:', error);
        showYTSearchError('Arama hatası: ' + error.message);
    } finally {
        ytSearchLoading = false;
        updateYTSearchUI('idle');
    }
}

// Arama sonuçlarını göster
function renderYTSearchResults(items) {
    const container = document.getElementById('yt-search-results');
    if (!container) return;
    
    container.innerHTML = '';
    container.style.display = 'block';
    
    items.forEach((item, index) => {
        const videoId = item.id.videoId;
        const title = item.snippet.title;
        const channelTitle = item.snippet.channelTitle;
        const thumbnail = item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url;
        
        const resultItem = document.createElement('div');
        resultItem.className = 'yt-search-result-item';
        resultItem.innerHTML = `
            <img src="${thumbnail}" alt="${title}" class="yt-search-thumb">
            <div class="yt-search-info">
                <div class="yt-search-title">${escapeHtml(title)}</div>
                <div class="yt-search-channel">${escapeHtml(channelTitle)}</div>
            </div>
        `;
        
        resultItem.addEventListener('click', () => selectYTSearchResult(videoId, title));
        container.appendChild(resultItem);
    });
}