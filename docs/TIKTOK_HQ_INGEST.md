# TikTok Studio HQ Ingest & Cloud Canvas Bypass Architecture

Dokumentasi teknis mendalam mengenai arsitektur internal pipeline ingest TikTok Studio (ByteDance web uploader), penyebab degradasi kualitas video ke 720p, dan mekanisme **Faststart Remux + Payload Interceptor** untuk mempertahankan kualitas murni 1080p 120 FPS tanpa re-encoding barbar.

---

## 1. Latar Belakang Masalah (Root Cause di TikTok Studio)

Banyak kreator video, video editor, dan motion graphic designer mengeluhkan bahwa video yang di-export dengan kualitas tinggi (1080p 60/120 FPS, bitrate 20–50 Mbps) dari Adobe Premiere Pro, After Effects, atau DaVinci Resolve mengalami penurunan kualitas drastis ketika diunggah melalui browser desktop (`tiktok.com/tiktokstudio`).

### Mengapa ini terjadi?
1. **Cloud Canvas Video Editor Otomatis Aktif**:  
   Secara default, web client TikTok Studio menyertakan parameter `cloud_edit_is_use_video_canvas: true` dan konfigurasi `canvas_config` pada request publish API mereka. Fitur ini memaksa server ByteDance memuat video ke cloud canvas editor yang secara otomatis **men-downscale resolusi video ke 720p 30/60 FPS** demi kompatibilitas rendering cloud.
2. **Posisi Atom `moov` di Akhir File (Non-Faststart)**:  
   Renderer video standar menulis atom `moov` (metadata durasi, resolusi, dan index chunk) di bagian paling akhir file MP4 (setelah data frame gambar `mdat`). Akibatnya, server web TikTok tidak bisa mem-parsing struktur stream sebelum seluruh file terunggah, sehingga video dialihkan ke pipeline transcoding darurat.

---

## 2. Arsitektur Solusi Dua Lapis (Two-Tier HQ Bypass)

Solusi yang dibangun di **jsibra.me** terdiri dari dua komponen yang saling melengkapi:

```
[ Video Asli ]
      │
      ▼
┌────────────────────────────────────────────────────────┐
│ Lapis 1: Web Optimizer (jsibra.me/tools/hq-optimizer) │
│ - Faststart Atom Relocation (moov dipindah ke depan)   │
│ - Chunk Offset Recalculation (stco & co64 shifted)     │
│ - Anchor Metadata Injection (+24 bytes udta)           │
└────────────────────────────────────────────────────────┘
      │
      ▼
[ Video_HQ.mp4 ]
      │
      ▼
┌────────────────────────────────────────────────────────┐
│ Lapis 2: Userscript (TikTok Studio Hook)               │
│ - Intercept window.fetch & XMLHttpRequest              │
│ - Mematikan cloud_edit_is_use_video_canvas -> false    │
│ - Mengunci video_quality_score -> 1.0                  │
│ - Mengunci is_high_quality -> true                     │
│ - Memverifikasi metadata anchor jsibra.me              │
└────────────────────────────────────────────────────────┘
      │
      ▼
[ Server TikTok Menerima Direct Pass-Through HQ 1080p ]
```

---

## 3. Bedah Teknis Lapis 1: MP4 Atom Restructuring

Format MP4 (ISO/IEC 14496-12 ISO Base Media File Format) tersusun atas blok-blok biner terstruktur yang disebut **atom / box**:
- `ftyp`: File type & compatibility container.
- `mdat`: Media data (berisi stream biner video H.264/HEVC dan audio AAC).
- `moov`: Metadata container (berisi informasi track, durasi, timebase, dan index chunk offset).

### Algoritma Faststart Remux (Pure Client-Side JavaScript):
1. **Parsing Atom Biner**:
   Memindai header 8 byte setiap atom (`[uint32 length][4 chars tag]`).
2. **Relokasi Box `moov`**:
   Jika atom `moov` berada setelah atom `mdat`, posisinya dipindahkan tepat di belakang atom `ftyp`.
3. **Rekalkulasi Chunk Offset (`stco` / `co64`)**:
   Karena `moov` dipindahkan ke depan, seluruh offset fisik data frame di dalam `mdat` bergeser sejauh ukuran `moov` ditambah payload anchor.
   - Untuk tabel 32-bit (`stco`):
     $$\text{Offset}_{\text{baru}} = \text{Offset}_{\text{lama}} + \text{moovBox.length} + \text{anchorSize}$$
   - Untuk tabel 64-bit (`co64`):
     Dihitung menggunakan unsigned 64-bit integer (`BigInt`).
4. **Anchor Metadata Injection**:
   Menyuntikkan box `udta` berukuran 24 bytes berisi identifikasi `jsibra.me/tiktok`. Karena hanya metadata yang disuntikkan, overhead file hanya **+24 bytes**, dan seluruh piksel video 100% utuh tanpa re-encoding.

---

## 4. Bedah Teknis Lapis 2: Payload Interceptor (Userscript)

Userscript berjalan di background browser saat membuka `tiktok.com/tiktokstudio` dan membajak 3 API browser penting:

### 1. Hook `window.fetch` & `XMLHttpRequest.prototype.send`:
Mencegat payload HTTP POST saat tombol publish diklik:
```javascript
function normalizePayload(payload) {
  // 1. Hapus config canvas cloud editor
  delete payload.canvas_config;
  delete payload.draft;
  delete payload.vedit_segment_info;

  // 2. Matikan paksa cloud canvas
  payload.cloud_edit_is_use_video_canvas = false;
  payload.psg_vsp_aud = true;

  // 3. Kunci parameter kualitas tinggi
  if (Array.isArray(payload.single_post_req_list)) {
    payload.single_post_req_list.forEach((req) => {
      req.psg_vsp_aud = true;
      const info = req?.single_post_feature_info;
      if (info) {
        info.cloud_edit_is_use_video_canvas = false;
        info.has_original_audio = 1;
        info.video_quality_score = 1.0;
        info.is_high_quality = true;
      }
    });
  }
}
```

### 2. Hook `JSON.stringify`:
Mencegat objek konfigurasi internal sebelum di-serialize menjadi string JSON oleh React runtime TikTok.

### 3. File Input & Drop Verifier:
Ketika video di-drop ke area uploader TikTok Studio:
- Userscript membaca 8 MB awal dan 8 MB akhir file via `file.slice().arrayBuffer()`.
- Memindai keberadaan string anchor `jsibra.me` atau `cutefish.my.id`.
- Jika terverifikasi, file langsung diteruskan dengan status **"Patched HQ"**.
- Jika belum dipatch, modal interaktif muncul mengingatkan user untuk mengoptimasi videonya terlebih dahulu.

---

## 5. Cara Penggunaan

1. **Pasang Userscript**:
   - Buka browser desktop (Chrome / Edge / Brave / Firefox).
   - Pasang ekstensi **Tampermonkey** atau **Violentmonkey**.
   - Pasang script via tautan: `https://jsibra.me/userscript/tiktok-cloud-disabler.user.js`.
2. **Optimasi Video**:
   - Buka web tool: `https://jsibra.me/tools/hq-optimizer`.
   - Tarik & lepas file video hasil export (`.mp4`, `.mov`).
   - Klik **"Proses Video Sekarang"** (selesai dalam 1–2 detik).
   - Download file hasil optimasi (`[nama]_hq.mp4`).
3. **Upload ke TikTok Studio**:
   - Buka `https://www.tiktok.com/tiktokstudio/upload`.
   - Di pojok kanan bawah akan muncul indikator hijau: **"TikTok Studio HQ • Active"**.
   - Tarik file video `_hq.mp4`. Kualitas 1080p dan 120 FPS akan dipertahankan murni tanpa kompresi canvas.
