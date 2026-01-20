        
        // Dosya seçme event'leri
        function setupFileInput() {
            const fileInput = document.getElementById('local-video-file');
            const dropZone = document.getElementById('file-drop-zone');
            const fileNameDisplay = document.getElementById('selected-file-name');
            
            if (fileInput) {
                fileInput.addEventListener('change', (e) => {
                    const file = e.target.files[0];
                    if (file) {
                        selectedLocalFile = file;
                        if (fileNameDisplay) {
                            fileNameDisplay.textContent = '✅ ' + file.name + ' (' + formatBytes(file.size) + ')';
                        }
                        debugLog('📁 File selected:', file.name, file.size);
                    }
                });
            }
            
            if (dropZone) {
                dropZone.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    dropZone.classList.add('dragover');
                });
                
                dropZone.addEventListener('dragleave', () => {
                    dropZone.classList.remove('dragover');
                });
                
                dropZone.addEventListener('drop', (e) => {
                    e.preventDefault();
                    dropZone.classList.remove('dragover');
                    
                    const file = e.dataTransfer.files[0];
                    if (file && file.type.startsWith('video/')) {
                        selectedLocalFile = file;
                        if (fileNameDisplay) {
                            fileNameDisplay.textContent = '✅ ' + file.name + ' (' + formatBytes(file.size) + ')';
                        }
                        debugLog('📁 File dropped:', file.name, file.size);
                    }
                });
            }
        }
