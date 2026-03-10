#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────────────────
# run_study.sh — Start backend, frontend, and ngrok tunnel for remote sessions
#
# Prerequisites:
#   1. Install ngrok: https://ngrok.com/download  (or: choco install ngrok)
#   2. Sign up for free account and run: ngrok config add-authtoken <TOKEN>
#   3. Backend venv and frontend node_modules must already be set up
#
# Usage:
#   ./run_study.sh          # starts everything, prints the public URL
#   Ctrl+C                  # stops all processes
# ──────────────────────────────────────────────────────────────────────────────
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Check ngrok is installed
if ! command -v ngrok &>/dev/null; then
  echo "ERROR: ngrok is not installed."
  echo "  Install: https://ngrok.com/download"
  echo "  Or:      choco install ngrok"
  exit 1
fi

cleanup() {
  echo ""
  echo "Shutting down..."
  kill $PID_BACKEND $PID_FRONTEND $PID_NGROK 2>/dev/null || true
  wait 2>/dev/null
  echo "Done."
}
trap cleanup EXIT

# ── 1. Start backend ──
echo "[1/3] Starting backend..."
"$ROOT_DIR/run_backend.sh" &
PID_BACKEND=$!
sleep 2

# ── 2. Start frontend (empty VITE_API_URL so it uses relative URLs via Vite proxy) ──
echo "[2/3] Starting frontend..."
VITE_API_URL="" "$ROOT_DIR/run_frontend.sh" &
PID_FRONTEND=$!
sleep 3

# ── 3. Start ngrok tunnel ──
echo "[3/3] Starting ngrok tunnel..."
ngrok http 5173 --log=stdout > /tmp/ngrok.log 2>&1 &
PID_NGROK=$!
sleep 3

# Extract public URL
NGROK_URL=$(curl -s http://127.0.0.1:4040/api/tunnels | grep -o '"public_url":"https://[^"]*' | head -1 | cut -d'"' -f4)

if [[ -z "$NGROK_URL" ]]; then
  echo "WARNING: Could not detect ngrok URL. Check http://127.0.0.1:4040"
else
  echo ""
  echo "════════════════════════════════════════════════════════════"
  echo "  Study URL (share with participant):  $NGROK_URL"
  echo "  Admin monitor:                       http://localhost:5173"
  echo "════════════════════════════════════════════════════════════"
  echo ""
fi

echo "Press Ctrl+C to stop all services."
wait
