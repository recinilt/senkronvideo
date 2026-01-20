// ============================================
// ŞİFRE KORUMALI ODA SİSTEMİ
// SHA-256 hash ile oda şifresi
// ============================================

// ==================== SHA-256 HASH ====================

// Web Crypto API ile SHA-256 hash
async function hashPassword(password) {
    if (!password || password.trim() === '') return null;
    
    try {
        const msgUint8 = new TextEncoder().encode(password.trim());
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return hashHex;
    } catch (error) {
        console.error('Hash error:', error);
        return null;
    }
}

// ==================== ŞİFRE MODAL ====================

// Şifre girişi için modal göster
function showPasswordModal(roomId, roomName) {
    // Mevcut modal varsa kaldır
    hidePasswordModal();
    
    const modal = document.createElement('div');
    modal.id = 'password-modal';
    modal.className = 'password-modal-overlay';
    
    modal.innerHTML = `
        <div class="password-modal">
            <div class="password-modal-header">
                <span>🔒 Şifreli Oda</span>
                <button class="password-modal-close" onclick="hidePasswordModal()">✕</button>
            </div>
            <div class="password-modal-body">
                <p>Bu oda şifre korumalıdır.</p>
                <p class="password-modal-room-name">${escapeHtmlForModal(roomName)}</p>
                <div class="password-input-group">
                    <input type="password" id="room-password-input" placeholder="Oda şifresini girin" autocomplete="off">
                </div>
                <div id="password-error" class="password-error" style="display: none;">
                    ❌ Hatalı şifre
                </div>
            </div>
            <div class="password-modal-buttons">
                <button class="password-btn-cancel" onclick="hidePasswordModal()">İptal</button>
                <button class="password-btn-enter" onclick="verifyAndJoinRoom('${roomId}')">Giriş Yap</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Input'a focus
    const input = document.getElementById('room-password-input');
    if (input) {
        input.focus();
        
        // Enter tuşu ile giriş
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                verifyAndJoinRoom(roomId);
            } else if (e.key === 'Escape') {
                hidePasswordModal();
            }
        });
    }
    
    // Dışarı tıklayınca kapat
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            hidePasswordModal();
        }
    });
    
    debugLog('🔒 Password modal shown for room:', roomName);
}

// Modal'ı kapat
function hidePasswordModal() {
    const modal = document.getElementById('password-modal');
    if (modal) {
        modal.remove();
    }
}

// Şifreyi doğrula ve odaya katıl
async function verifyAndJoinRoom(roomId) {
    const input = document.getElementById('room-password-input');
    const errorEl = document.getElementById('password-error');
    
    if (!input) return;
    
    const enteredPassword = input.value;
    
    if (!enteredPassword || enteredPassword.trim() === '') {
        if (errorEl) {
            errorEl.textContent = '❌ Şifre giriniz';
            errorEl.style.display = 'block';
        }
        return;
    }
    
    // Butonu disable et
    const enterBtn = document.querySelector('.password-btn-enter');
    if (enterBtn) {
        enterBtn.disabled = true;
        enterBtn.textContent = '⏳ Kontrol ediliyor...';
    }
    
    try {
        // Girilen şifreyi hash'le
        const enteredHash = await hashPassword(enteredPassword);
        
        // Firebase'den oda şifresini al
        const roomSnapshot = await db.ref('rooms/' + roomId + '/passwordHash').once('value');
        const storedHash = roomSnapshot.val();
        
        if (enteredHash === storedHash) {
            // Şifre doğru
            debugLog('✅ Password correct for room:', roomId);
            hidePasswordModal();
            joinRoom(roomId);
        } else {
            // Şifre yanlış
            debugLog('❌ Password incorrect for room:', roomId);
            if (errorEl) {
                errorEl.textContent = '❌ Hatalı şifre';
                errorEl.style.display = 'block';
            }
            input.value = '';
            input.focus();
            
            // Butonu tekrar aktif et
            if (enterBtn) {
                enterBtn.disabled = false;
                enterBtn.textContent = 'Giriş Yap';
            }
        }
    } catch (error) {
        console.error('Password verification error:', error);
        if (errorEl) {
            errorEl.textContent = '❌ Doğrulama hatası';
            errorEl.style.display = 'block';
        }
        
        // Butonu tekrar aktif et
        if (enterBtn) {
            enterBtn.disabled = false;
            enterBtn.textContent = 'Giriş Yap';
        }
    }
}

// HTML escape (XSS önleme) - modal için
function escapeHtmlForModal(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Odanın şifreli olup olmadığını kontrol et ve uygun şekilde katıl
async function attemptJoinRoom(roomId) {
    try {
        // Önce odanın şifre durumunu kontrol et
        const roomSnapshot = await db.ref('rooms/' + roomId).once('value');
        const roomData = roomSnapshot.val();
        
        if (!roomData) {
            alert('Oda bulunamadı!');
            return;
        }
        
        // Şifreli mi kontrol et
        if (roomData.passwordHash) {
            // Şifreli oda - modal göster
            showPasswordModal(roomId, roomData.name);
        } else {
            // Şifresiz oda - direkt katıl
            joinRoom(roomId);
        }
    } catch (error) {
        console.error('Room access error:', error);
        alert('Odaya erişim hatası: ' + error.message);
    }
}

debugLog('✅ Room Password System loaded');