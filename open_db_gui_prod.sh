#!/bin/bash
set -e

SERVER="root@167.172.94.125"
REMOTE_PORT=8080
LOCAL_PORT=8080

echo "Starting sqlite-web on server..."
ssh "$SERVER" "
  docker rm -f db-gui 2>/dev/null || true
  docker run -d --rm --name db-gui \
    -p 127.0.0.1:${REMOTE_PORT}:8080 \
    -v finrisk_db_data:/data \
    coleifer/sqlite-web \
    sqlite_web /data/finrisk.db --host 0.0.0.0 --port 8080
"

echo "Opening tunnel — GUI will be at http://localhost:${LOCAL_PORT}"
echo "Press Ctrl+C to close the tunnel and stop the GUI."

# Open browser after a short delay
(sleep 2 && open "http://localhost:${LOCAL_PORT}") &

# SSH tunnel — forwards local port to server's localhost
# Ctrl+C here also runs the cleanup trap
cleanup() {
  echo ""
  echo "Stopping db-gui on server..."
  ssh "$SERVER" "docker stop db-gui 2>/dev/null || true"
}
trap cleanup EXIT

ssh -N -L "${LOCAL_PORT}:localhost:${REMOTE_PORT}" "$SERVER"
