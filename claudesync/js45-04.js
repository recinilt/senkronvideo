
// Arama butonuna tıklama
function handleYTSearchClick() {
    const input = document.getElementById('yt-search-input');
    if (input && input.value.trim()) {
        searchYouTube(input.value);
    }
}

// Dışarı tıklayınca sonuçları kapat
document.addEventListener('click', (e) => {
    const searchContainer = document.getElementById('yt-search-container');
    if (searchContainer && !searchContainer.contains(e.target)) {
        hideYTSearchResults();
    }
});

debugLog('✅ YouTube Search modülü yüklendi');