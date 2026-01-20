#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
JS Dosya Bölücü ve HTML Güncelleyici
- Dizindeki JS dosyalarını tarar
- Max satır sayısını aşanları akıllıca böler (fonksiyonları bozmadan)
- HTML dosyalarındaki referansları günceller (document.write formatı dahil)
"""

import os
import re
import glob
from pathlib import Path


def detect_encoding(file_path):
    """
    Dosyanın encoding'ini tespit eder.
    BOM'a bakarak veya UTF-8 validasyonu yaparak.
    """
    with open(file_path, 'rb') as f:
        raw = f.read()
    
    # UTF-8 BOM kontrolü
    if raw[:3] == b'\xef\xbb\xbf':
        return 'utf-8-sig', raw[3:]  # BOM'u atla
    
    # UTF-16 BE BOM
    if raw[:2] == b'\xfe\xff':
        return 'utf-16-be', raw[2:]
    
    # UTF-16 LE BOM
    if raw[:2] == b'\xff\xfe':
        return 'utf-16-le', raw[2:]
    
    # UTF-8 validation
    try:
        raw.decode('utf-8')
        return 'utf-8', raw
    except UnicodeDecodeError:
        pass
    
    # Fallback: windows-1254 (Türkçe)
    return 'windows-1254', raw


def read_file_utf8(file_path):
    """
    Dosyayı okur, encoding'i tespit eder ve UTF-8 string olarak döndürür.
    BOM varsa kaldırır.
    """
    encoding, raw_data = detect_encoding(file_path)
    
    try:
        if encoding in ['utf-8', 'utf-8-sig']:
            text = raw_data.decode('utf-8')
        elif encoding == 'utf-16-be':
            text = raw_data.decode('utf-16-be')
        elif encoding == 'utf-16-le':
            text = raw_data.decode('utf-16-le')
        else:
            text = raw_data.decode(encoding, errors='replace')
    except UnicodeDecodeError:
        # Son çare: UTF-8 with replacement
        text = raw_data.decode('utf-8', errors='replace')
    
    # String seviyesinde BOM karakteri kontrolü
    if text and text[0] == '\ufeff':
        text = text[1:]
    
    return text


def write_file_utf8_no_bom(file_path, content):
    """
    Dosyayı UTF-8 BOM'suz olarak yazar.
    """
    # String başında BOM varsa kaldır
    if content and content[0] == '\ufeff':
        content = content[1:]
    
    # UTF-8 BOM'suz olarak yaz
    with open(file_path, 'w', encoding='utf-8', newline='\n') as f:
        f.write(content)


def split_js_into_units(js_content):
    """
    JS kodunu mantıksal birimlere (unit) ayırır.
    Süslü parantez derinliğini takip ederek fonksiyonları/objeleri bozmaz.
    """
    if not js_content.strip():
        return []
    
    lines = js_content.split('\n')
    units = []
    current = []
    brace_depth = 0
    in_string = False
    string_char = None
    in_multi_comment = False
    
    for line in lines:
        current.append(line)
        
        i = 0
        while i < len(line):
            char = line[i]
            next_char = line[i + 1] if i + 1 < len(line) else ''
            
            # Tek satır yorum kontrolü
            if not in_string and not in_multi_comment and char == '/' and next_char == '/':
                break  # Satırın geri kalanını atla
            
            # Çok satırlı yorum başlangıcı
            if not in_string and not in_multi_comment and char == '/' and next_char == '*':
                in_multi_comment = True
                i += 2
                continue
            
            # Çok satırlı yorum bitişi
            if in_multi_comment and char == '*' and next_char == '/':
                in_multi_comment = False
                i += 2
                continue
            
            if in_multi_comment:
                i += 1
                continue
            
            # String kontrolü
            if char in ['"', "'", '`'] and (i == 0 or line[i-1] != '\\'):
                if not in_string:
                    in_string = True
                    string_char = char
                elif char == string_char:
                    in_string = False
                    string_char = None
            
            # String içinde değilsek parantez say
            if not in_string:
                if char == '{':
                    brace_depth += 1
                elif char == '}':
                    brace_depth = max(0, brace_depth - 1)
            
            i += 1
        
        trimmed = line.strip()
        # Brace derinliği 0 ve satır ; veya } ile bitiyorsa unit tamamdır
        if brace_depth == 0 and not in_string and not in_multi_comment:
            if trimmed.endswith(';') or trimmed.endswith('}'):
                units.append('\n'.join(current) + '\n')
                current = []
    
    # Kalan satırlar varsa ekle
    if current:
        units.append('\n'.join(current) + '\n')
    
    # Çok kısa unit'leri birleştir (30 karakterden az olanları)
    merged = []
    buffer = ''
    for unit in units:
        if len(unit.strip()) < 30:
            buffer += unit
        else:
            if buffer:
                merged.append(buffer)
                buffer = ''
            merged.append(unit)
    if buffer:
        merged.append(buffer)
    
    return [u for u in merged if u.strip()]


def pack_units_into_parts(units, max_lines):
    """
    Unit'leri max satır sayısını aşmayacak şekilde parçalara ayırır.
    """
    if not units:
        return ['']
    
    parts = []
    current_part = []
    current_line_count = 0
    
    for unit in units:
        unit_lines = unit.count('\n') + (0 if unit.endswith('\n') else 1)
        
        # Eğer mevcut parça + yeni unit max'ı aşıyorsa yeni parça başlat
        if current_line_count > 0 and current_line_count + unit_lines > max_lines:
            parts.append('\n'.join(current_part) if current_part else '')
            current_part = []
            current_line_count = 0
        
        current_part.append(unit.rstrip('\n'))
        current_line_count += unit_lines
    
    # Son parçayı ekle
    if current_part:
        parts.append('\n'.join(current_part))
    
    return parts


def get_new_filenames(original_name, part_count):
    """
    Orijinal dosya adından yeni dosya adları üretir.
    js33.js -> js33-01.js, js33-02.js, js33-03.js
    """
    stem = Path(original_name).stem  # js33
    suffix = Path(original_name).suffix  # .js
    
    new_names = []
    for i in range(1, part_count + 1):
        new_names.append(f"{stem}-{i:02d}{suffix}")
    
    return new_names


def fix_all_script_closing_tags(html_content):
    """
    VSCode syntax highlighting icin tum script closing tag'lerini duzelir.
    Ornek: <\\/script> veya <\\/script> -> <' + '/script>
    """
    # Farklı varyasyonları düzelt
    result = html_content
    
    # <\\/script> -> <' + '/script>  (çift backslash)
    result = result.replace("<\\\\/script>", "<' + '/script>")
    
    # <\/script> -> <' + '/script>  (tek backslash)
    result = result.replace("<\\/script>", "<' + '/script>")
    
    return result


def update_html_references(html_content, old_filename, new_filenames):
    """
    HTML icindeki JS referansini yeni dosyalarla degistirir.
    Hem normal script src hem de document.write formatini destekler.
    Desteklenen formatlar: backslash-slash, double-backslash-slash, concatenation
    """
    updated = html_content
    
    # Dosya adı (js24.js)
    escaped_filename = re.escape(old_filename)
    
    # Pattern 1: document.write formatı - TÜM varyasyonları yakala
    # <\/script> veya <\\/script> veya <' + '/script>
    pattern_docwrite = (
        r"(document\.write\s*\(\s*['\"]<script[^>]*src=['\"])(" + escaped_filename + r")(\?[^'\"]*)?(['\"][^>]*>)(<\\?\\?/script>|<'\s*\+\s*'/script>)(['\"])\s*(\)\s*;?)"
    )
    
    def replace_docwrite(match):
        prefix = match.group(1)       # document.write('<script src="
        filename = match.group(2)     # js24.js
        query = match.group(3) or ''  # ?v=' + v + '
        mid = match.group(4)          # ">
        script_close = match.group(5) # <\/script> veya <' + '/script>
        quote = match.group(6)        # '
        closing = match.group(7)      # );
        
        # VSCode uyumlu format kullan
        fixed_close = "<' + '/script>"
        
        new_lines = []
        for new_name in new_filenames:
            new_lines.append(f"{prefix}{new_name}{query}{mid}{fixed_close}{quote}{closing}")
        return '\n'.join(new_lines)
    
    updated = re.sub(pattern_docwrite, replace_docwrite, updated, flags=re.IGNORECASE)
    
    # Pattern 2: Normal <script src="js24.js"></script>
    pattern_script = (
        r'(<script[^>]*src=["\'])(' + escaped_filename + r')(\?[^"\']*)?(["\'][^>]*></script>)'
    )
    
    def replace_script(match):
        prefix = match.group(1)    # <script src="
        filename = match.group(2)  # js24.js
        query = match.group(3) or ''  # ?v=123
        suffix = match.group(4)    # "></script>
        
        new_tags = []
        for new_name in new_filenames:
            new_tags.append(f'{prefix}{new_name}{query}{suffix}')
        return '\n'.join(new_tags)
    
    updated = re.sub(pattern_script, replace_script, updated, flags=re.IGNORECASE)
    
    return updated


def process_directory(directory, max_lines):
    """
    Ana işlem fonksiyonu.
    """
    # Dizindeki tüm JS dosyalarını bul
    js_files = glob.glob(os.path.join(directory, '*.js'))
    
    if not js_files:
        print("Bu dizinde JS dosyası bulunamadı.")
        return
    
    print(f"\n{len(js_files)} adet JS dosyası bulundu.")
    print("-" * 50)
    
    # Bölünen dosyaları takip et: {eski_ad: [yeni_adlar]}
    split_files = {}
    
    # Her JS dosyasını kontrol et
    for js_path in sorted(js_files):
        filename = os.path.basename(js_path)
        
        # UTF-8 BOM'suz olarak oku
        content = read_file_utf8(js_path)
        
        line_count = content.count('\n') + 1
        
        if line_count <= max_lines:
            print(f"✓ {filename}: {line_count} satır (bölünmedi)")
            continue
        
        print(f"\n▶ {filename}: {line_count} satır (bölünecek)")
        
        # Unit'lere ayır
        units = split_js_into_units(content)
        print(f"  → {len(units)} adet kod bloğu bulundu")
        
        # Parçalara ayır
        parts = pack_units_into_parts(units, max_lines)
        part_count = len(parts)
        
        if part_count <= 1:
            print(f"  → Tek parça olarak kaldı (fonksiyonlar bölünemez)")
            continue
        
        # Yeni dosya adları oluştur
        new_names = get_new_filenames(filename, part_count)
        split_files[filename] = new_names
        
        print(f"  → {part_count} parçaya bölündü:")
        
        # Yeni dosyaları yaz (UTF-8 BOM'suz)
        for i, (part_content, new_name) in enumerate(zip(parts, new_names)):
            new_path = os.path.join(directory, new_name)
            part_lines = part_content.count('\n') + 1
            
            write_file_utf8_no_bom(new_path, part_content)
            
            print(f"     • {new_name} ({part_lines} satır)")
        
        # Orijinal dosyayı sil
        os.remove(js_path)
        print(f"  → Orijinal {filename} silindi")
    
    # HTML dosyalarını güncelle
    html_files = glob.glob(os.path.join(directory, '*.html')) + glob.glob(os.path.join(directory, '*.htm'))
    
    if not html_files:
        print("\n" + "=" * 50)
        print("Bu dizinde HTML dosyası bulunamadı.")
        return
    
    print("\n" + "=" * 50)
    print("HTML dosyaları güncelleniyor...")
    print("-" * 50)
    
    for html_path in html_files:
        html_filename = os.path.basename(html_path)
        
        # UTF-8 BOM'suz olarak oku
        html_content = read_file_utf8(html_path)
        
        original_content = html_content
        changes = []
        
        for old_name, new_names in split_files.items():
            # Dosya adı HTML'de var mı kontrol et
            if old_name in html_content:
                html_content = update_html_references(html_content, old_name, new_names)
                changes.append(f"{old_name} → {', '.join(new_names)}")
        
        # Tüm <\/script> ifadelerini VSCode-friendly formata çevir
        html_content = fix_all_script_closing_tags(html_content)
        
        if html_content != original_content:
            # UTF-8 BOM'suz olarak yaz
            write_file_utf8_no_bom(html_path, html_content)
            print(f"✓ {html_filename} güncellendi (UTF-8 BOM'suz):")
            for change in changes:
                print(f"    {change}")
            if not changes:
                print(f"    (script tag'leri düzeltildi)")
        else:
            print(f"- {html_filename}: Değişiklik yok")
    
    print("\n" + "=" * 50)
    print("İşlem tamamlandı!")
    print(f"Bölünen dosya sayısı: {len(split_files)}")
    total_new = sum(len(v) for v in split_files.values())
    print(f"Oluşturulan yeni dosya sayısı: {total_new}")


def main():
    print("=" * 50)
    print("   JS DOSYA BÖLÜCÜ & HTML GÜNCELLEYİCİ")
    print("=" * 50)
    
    # Çalışma dizini
    directory = os.getcwd()
    print(f"\nÇalışma dizini: {directory}")
    
    # Max satır sayısı al
    while True:
        try:
            max_lines = int(input("\nMaksimum satır sayısı girin: "))
            if max_lines < 10:
                print("En az 10 satır olmalı!")
                continue
            break
        except ValueError:
            print("Geçerli bir sayı girin!")
    
    # İşlemi başlat
    process_directory(directory, max_lines)


if __name__ == '__main__':
    main()