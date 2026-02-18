#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/src/backend"
VENV_PATH="$BACKEND_DIR/.venv"
DB_PATH="$BACKEND_DIR/finrisk.db"
PORT="${1:-8081}"

if [[ ! -d "$VENV_PATH" ]]; then
  echo "Backend venv not found at: $VENV_PATH"
  echo "Run run_backend.sh first to set up the environment."
  exit 1
fi

if [[ ! -f "$DB_PATH" ]]; then
  echo "Database not found at: $DB_PATH"
  echo "Start the backend first to create the database."
  exit 1
fi

if [[ -f "$VENV_PATH/Scripts/activate" ]]; then
  source "$VENV_PATH/Scripts/activate"
else
  source "$VENV_PATH/bin/activate"
fi

# Install sqlite-web if missing
if ! python -c "import sqlite_web" 2>/dev/null; then
  echo "Installing sqlite-web..."
  pip install sqlite-web
fi

echo "Opening SQLite GUI at http://127.0.0.1:$PORT"
exec sqlite_web "$DB_PATH" --port "$PORT" --no-browser
