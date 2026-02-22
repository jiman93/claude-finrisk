#!/usr/bin/env python3
"""
Inspect participant assignments in the database.
Usage: python scripts/inspect_assignments.py
"""

import json
import sqlite3
from pathlib import Path
from typing import Any


def connect_db() -> sqlite3.Connection:
    """Connect to the SQLite database."""
    db_path = Path(__file__).parent.parent / "src" / "backend" / "finrisk.db"
    if not db_path.exists():
        raise FileNotFoundError(f"Database not found at {db_path}")
    return sqlite3.connect(str(db_path))


def get_assignments(conn: sqlite3.Connection) -> list[dict[str, Any]]:
    """Fetch all participant assignments."""
    cursor = conn.cursor()
    cursor.execute("""
        SELECT participant_id, "group", phases, status, override, updated_at
        FROM study_assignments
        ORDER BY participant_id
    """)

    rows = cursor.fetchall()
    assignments = []

    for row in rows:
        phases_data = json.loads(row[2]) if row[2] else []
        assignments.append({
            "participant_id": row[0],
            "group": row[1],
            "status": row[3],
            "override": bool(row[4]),
            "phases": phases_data,
            "updated_at": row[5],
        })

    return assignments


def extract_tickers(assignments: list[dict[str, Any]]) -> set[str]:
    """Extract all unique tickers from assignments."""
    tickers = set()
    for assignment in assignments:
        for phase in assignment.get("phases", []):
            ticker = phase.get("ticker")
            if ticker:
                tickers.add(ticker)
    return tickers


def print_assignments(assignments: list[dict[str, Any]]) -> None:
    """Print assignments in a readable format."""
    print("=" * 80)
    print("PARTICIPANT ASSIGNMENTS")
    print("=" * 80)
    print()

    if not assignments:
        print("⚠️  No assignments found in database")
        print()
        print("This might mean:")
        print("  1. Database is empty (fresh installation)")
        print("  2. Assignments haven't been generated yet")
        print("  3. Click 'Regenerate Defaults' in the Study Control Panel")
        print()
        return

    # Extract all tickers
    all_tickers = extract_tickers(assignments)

    print(f"📊 Total assignments: {len(assignments)}")
    print(f"🎯 Unique tickers: {sorted(all_tickers)}")
    print()

    # Check for old tickers
    old_tickers = {"JPM"}  # Tickers that should be removed
    found_old = old_tickers & all_tickers
    if found_old:
        print(f"⚠️  WARNING: Found old tickers: {found_old}")
        print("   → Click 'Regenerate Defaults' to update assignments")
        print()

    new_tickers = {"AMZN"}  # Tickers that should be present
    found_new = new_tickers & all_tickers
    if not found_new:
        print(f"⚠️  WARNING: Missing new tickers: {new_tickers - found_new}")
        print("   → Click 'Regenerate Defaults' to update assignments")
        print()

    print("-" * 80)
    print()

    # Print each assignment
    for assignment in assignments:
        participant_id = assignment["participant_id"]
        group = assignment["group"]
        status = assignment["status"]
        override = assignment["override"]
        phases = assignment.get("phases", [])

        # Extract ticker sequence
        ticker_sequence = " → ".join(
            phase.get("ticker", "?") for phase in phases
        )

        # Extract mode sequence
        mode_sequence = [phase.get("mode", "?") for phase in phases]
        mode_abbrev = [
            "BL" if m == "baseline" else
            "R" if m == "hitl_r" else
            "G" if m == "hitl_g" else
            "FULL" if m == "hitl_full" else "?"
            for m in mode_sequence
        ]

        # Color coding
        override_flag = "🔄" if override else "  "
        status_icon = "✅" if status == "completed" else "⏳" if status == "in_progress" else "⭕"

        print(f"{override_flag} {participant_id}  [{group}]  {status_icon} {status}")
        print(f"   Tickers: {ticker_sequence}")
        print(f"   Modes:   {' → '.join(mode_abbrev)}")
        print()


def print_table_info(conn: sqlite3.Connection) -> None:
    """Print database table information."""
    cursor = conn.cursor()

    # Get table schema
    cursor.execute("""
        SELECT sql FROM sqlite_master
        WHERE type='table' AND name='study_assignments'
    """)

    result = cursor.fetchone()
    if result:
        print("=" * 80)
        print("TABLE SCHEMA: study_assignments")
        print("=" * 80)
        print()
        print(result[0])
        print()


def main() -> None:
    """Main entry point."""
    try:
        conn = connect_db()

        # Get and print assignments
        assignments = get_assignments(conn)
        print_assignments(assignments)

        # Optionally print schema (uncomment if needed)
        # print_table_info(conn)

        conn.close()

    except FileNotFoundError as e:
        print(f"❌ Error: {e}")
        print()
        print("Make sure you're running this from the project root:")
        print("  python scripts/inspect_assignments.py")
        print()
    except sqlite3.Error as e:
        print(f"❌ Database error: {e}")
        print()
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        print()


if __name__ == "__main__":
    main()
