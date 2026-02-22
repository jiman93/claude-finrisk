#!/bin/bash

# Script to open SQLite database with a GUI tool
# Usage: ./scripts/open_db_gui.sh

set -e

DB_PATH="src/backend/finrisk.db"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
DB_FULL_PATH="$PROJECT_ROOT/$DB_PATH"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Opening SQLite Database GUI"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Database: $DB_FULL_PATH"
echo ""

# Check if database exists
if [ ! -f "$DB_FULL_PATH" ]; then
    echo "❌ Error: Database not found at $DB_FULL_PATH"
    exit 1
fi

echo "Database size: $(du -h "$DB_FULL_PATH" | cut -f1)"
echo ""

# Try different GUI tools in order of preference
echo "Checking for available SQLite GUI tools..."
echo ""

# 1. Check for DB Browser for SQLite (sqlitebrowser)
if command -v sqlitebrowser &> /dev/null; then
    echo "✅ Found: DB Browser for SQLite"
    echo "Opening database..."
    sqlitebrowser "$DB_FULL_PATH" &
    echo "✅ Database opened in DB Browser for SQLite"
    exit 0
fi

# 2. Check for TablePlus (macOS)
if [ -d "/Applications/TablePlus.app" ]; then
    echo "✅ Found: TablePlus"
    echo "Opening database..."
    open -a TablePlus "$DB_FULL_PATH"
    echo "✅ Database opened in TablePlus"
    exit 0
fi

# 3. Check for DBeaver (macOS)
if [ -d "/Applications/DBeaver.app" ]; then
    echo "✅ Found: DBeaver"
    echo "Opening database..."
    open -a DBeaver "$DB_FULL_PATH"
    echo "✅ Database opened in DBeaver"
    exit 0
fi

# 4. Check for SQLiteStudio (macOS)
if [ -d "/Applications/SQLiteStudio.app" ]; then
    echo "✅ Found: SQLiteStudio"
    echo "Opening database..."
    open -a SQLiteStudio "$DB_FULL_PATH"
    echo "✅ Database opened in SQLiteStudio"
    exit 0
fi

# 5. Fall back to browser-based tool (sqlite-web)
echo "⚠️  No GUI tool found. Checking for sqlite-web (browser-based)..."
if command -v sqlite_web &> /dev/null; then
    echo "✅ Found: sqlite-web"
    echo "Starting web interface at http://localhost:8080"
    echo "Press Ctrl+C to stop the server"
    echo ""
    sqlite_web "$DB_FULL_PATH"
    exit 0
fi

# 6. No GUI available - provide instructions
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "❌ No SQLite GUI tool found"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Please install one of the following tools:"
echo ""
echo "1️⃣  DB Browser for SQLite (Recommended - Free)"
echo "   brew install --cask db-browser-for-sqlite"
echo "   or download from: https://sqlitebrowser.org/"
echo ""
echo "2️⃣  TablePlus (Commercial - Free trial)"
echo "   brew install --cask tableplus"
echo "   or download from: https://tableplus.com/"
echo ""
echo "3️⃣  sqlite-web (Browser-based - Free)"
echo "   pip install sqlite-web"
echo "   Then run: sqlite_web $DB_FULL_PATH"
echo ""
echo "4️⃣  SQLite CLI (Text-based - Always available)"
echo "   sqlite3 $DB_FULL_PATH"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "💡 Quick install recommendation:"
echo "   brew install --cask db-browser-for-sqlite"
echo "   Then run this script again."
echo ""

exit 1
