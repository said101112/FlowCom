#!/bin/sh
# Réécrit public/config.js à partir des variables d'environnement du conteneur,
# puis démarre le serveur SSR. Permet de configurer les URLs d'API et de socket
# au déploiement, sans reconstruire l'image.
set -eu

CONFIG_FILE="${CONFIG_FILE:-/app/dist/flowcom/browser/config.js}"

api_url="${API_URL:-/auth}"
socket_url="${SOCKET_URL:-}"

cat > "$CONFIG_FILE" <<EOF
/**
 * Généré au démarrage du conteneur - ne pas modifier à la main.
 */
window.__FLOWCOM_CONFIG__ = {
  apiUrl: '${api_url}',
  socketUrl: '${socket_url}',
};
EOF

echo "[flowcom-frontend] apiUrl=${api_url} socketUrl=${socket_url:-<same-origin>}"

exec node dist/flowcom/server/server.mjs
