# jsibra-app

Halaman utama jsibra.me: Next.js yang menampilkan room 3D interaktif (`public/room/`) lewat iframe.

## Struktur
- `src/app/page.tsx` – iframe ke `/room/index.html`.
- `public/room/` – hasil build room 3D. Sumbernya ada di `../room-api` (`npm run build`, lalu salin isi `dist/` ke sini).
- `public/room-portfolio/`, `public/room.html` – varian lama; tidak dipakai halaman utama.
- `src/components/*`, `src/store/*` – versi React/R3F awal; saat ini tidak di-import.

## Menjalankan
```bash
npm ci
npm run dev      # lokal
npm run build && npm start
```

## Deploy
`./deploy.sh` – build + reload PM2 hanya untuk proses `jsibra-app` (tidak mematikan service lain).
Backend konten/admin: lihat `../room-api/DEPLOY.md`.
