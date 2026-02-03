#!/bin/sh

# Generate runtime config from environment variables
cat > /usr/share/nginx/html/config.js << EOF
window.__RUNTIME_CONFIG__ = {
  VITE_HA_URL: "${VITE_HA_URL:-http://strau15machine:8123}",
  VITE_HA_WS_URL: "${VITE_HA_WS_URL:-ws://strau15machine:8123/api/websocket}",
  VITE_HA_TOKEN: "${VITE_HA_TOKEN:-}",
  VITE_CHOREQUEST_URL: "${VITE_CHOREQUEST_URL:-http://strau15machine:8007}",
  VITE_CHOREQUEST_TOKEN: "${VITE_CHOREQUEST_TOKEN:-}"
};
EOF

echo "Runtime config generated:"
cat /usr/share/nginx/html/config.js

# Start nginx
exec nginx -g 'daemon off;'
