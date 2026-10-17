#!/bin/bash
# Deploy aman: hanya menyentuh proses "jsibra-app". Service lain (room-api di :3100, /api/ae di :3005) tidak ikut dimatikan.
set -euo pipefail
cd "$(dirname "$0")"

echo "==> Install dependency (sesuai package-lock)..."
npm ci

echo "==> Build Next.js..."
npm run build

echo "==> Jalankan ulang jsibra-app via PM2..."
if npx pm2 describe jsibra-app >/dev/null 2>&1; then
  npx pm2 reload jsibra-app --update-env
else
  npx pm2 start node_modules/next/dist/bin/next --name "jsibra-app" -- start -p 3000
fi
npx pm2 save

echo "==> Status:"
npx pm2 list
