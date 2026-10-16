#!/bin/bash
echo "==> Thoroughly cleaning port 3000 and PM2..."
npx pm2 delete jsibra-app || true
npx pm2 kill || true
fuser -k 3000/tcp || true
pkill -9 -f node || true
sleep 2

echo "==> Building Next.js app..."
npm run build

echo "==> Starting PM2..."
npx pm2 start node_modules/next/dist/bin/next --name "jsibra-app" -- start -p 3000

echo "==> Done:"
npx pm2 list
