#!/bin/bash
set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DB_PATH="$ROOT_DIR/src/backend/finrisk.db"

if [ ! -f "$DB_PATH" ]; then
    echo "Error: Database not found at $DB_PATH"
    exit 1
fi

# Install sqlite-web into backend venv if missing
if [[ -f "$ROOT_DIR/src/backend/.venv/Scripts/activate" ]]; then
    source "$ROOT_DIR/src/backend/.venv/Scripts/activate"
else
    source "$ROOT_DIR/src/backend/.venv/bin/activate"
fi

if ! command -v sqlite_web &> /dev/null; then
    echo "Installing sqlite-web..."
    pip install sqlite-web
fi

echo "Opening database GUI at http://localhost:8080"
sqlite_web "$DB_PATH"
