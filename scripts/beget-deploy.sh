#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SITE_ROOT="$(cd "$PROJECT_DIR/.." && pwd)"
PUBLIC_ROOT="$SITE_ROOT/public_html"

cd "$PROJECT_DIR"
test -f .env.production

npm ci --ignore-scripts
node --env-file=.env.production scripts/db-init.mjs
npm run build

rm -rf .next/standalone/public .next/standalone/.next/static
mkdir -p .next/standalone/.next .next/standalone/tmp "$PUBLIC_ROOT"
cp -R public .next/standalone/public
cp -R .next/static .next/standalone/.next/static
cp .env.production .next/standalone/.env.production

NODE_BINARY="$(command -v node)"
APP_ROOT="$(realpath .next/standalone)"
printf '%s\n' \
  "PassengerNodejs $NODE_BINARY" \
  "PassengerAppRoot $APP_ROOT" \
  "PassengerAppType node" \
  "PassengerStartupFile server.js" \
  "PassengerFriendlyErrorPages off" \
  > "$PUBLIC_ROOT/.htaccess"

touch .next/standalone/tmp/restart.txt
echo "Motisquad deployed successfully."
