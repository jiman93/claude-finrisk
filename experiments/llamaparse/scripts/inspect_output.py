#!/usr/bin/env python3
"""Inspect LlamaParse output to understand structure."""

import argparse
import json
import re
from pathlib import Path


def extract_toc(text: str) -> list[dict]:
    """Extract table of contents from markdown text.

    Looks for patterns like:
    - Item 1. Business
    - Item 1A. Risk Factors
    - PART I, PART II, etc.
    """
    toc_entries = []

    # Pattern for PART headings
    part_pattern = re.compile(r'^(PART\s+[IVX]+)\s*$', re.MULTILINE | re.IGNORECASE)
    for match in part_pattern.finditer(text):
        toc_entries.append({
            "type": "part",
            "heading": match.group(1).strip(),
            "position": match.start()
        })

    # Pattern for Item headings (Item 1, Item 1A, etc.)
    item_pattern = re.compile(
        r'^(Item\s+\d+[A-Z]?\.?\s+[^\n]+)',
        re.MULTILINE | re.IGNORECASE
    )
    for match in item_pattern.finditer(text):
        heading = match.group(1).strip()
        # Clean up extra whitespace
        heading = re.sub(r'\s+', ' ', heading)
        toc_entries.append({
            "type": "item",
            "heading": heading,
            "position": match.start()
        })

    # Sort by position
    toc_entries.sort(key=lambda x: x["position"])

    return toc_entries


def extract_page_markers(text: str) -> list[int]:
    """Extract page number markers if present."""
    # Look for common page marker patterns
    patterns = [
        r'Page\s+(\d+)',
        r'\[Page\s+(\d+)\]',
        r'<!-- page (\d+) -->',
    ]

    page_numbers = set()
    for pattern in patterns:
        for match in re.finditer(pattern, text, re.IGNORECASE):
            page_numbers.add(int(match.group(1)))

    return sorted(page_numbers)


def inspect_markdown(md_path: Path) -> dict:
    """Inspect a LlamaParse markdown output."""
    text = md_path.read_text(encoding="utf-8")

    print(f"\n{'='*60}")
    print(f"INSPECTING: {md_path.name}")
    print(f"{'='*60}\n")

    # Basic stats
    char_count = len(text)
    line_count = text.count('\n') + 1
    word_count = len(text.split())

    print(f"[STATS]")
    print(f"  Characters: {char_count:,}")
    print(f"  Lines: {line_count:,}")
    print(f"  Words: {word_count:,}")

    # Extract TOC
    toc = extract_toc(text)
    print(f"\n[TABLE OF CONTENTS] Found {len(toc)} entries:")
    for i, entry in enumerate(toc[:20], 1):  # Show first 20
        print(f"  {i:2d}. [{entry['type'].upper():4s}] {entry['heading']}")
    if len(toc) > 20:
        print(f"  ... and {len(toc) - 20} more")

    # Check for page markers
    pages = extract_page_markers(text)
    print(f"\n[PAGE MARKERS] Found {len(pages)} page markers")
    if pages:
        print(f"  Range: {min(pages)} - {max(pages)}")
        print(f"  First 10: {pages[:10]}")

    # Sample first 1000 chars
    print(f"\n[SAMPLE TEXT] First 1000 characters:")
    print("-" * 60)
    print(text[:1000])
    print("-" * 60)

    # Check for Item 1A
    item1a_pattern = re.compile(r'Item\s+1A\.?\s+Risk\s+Factors', re.IGNORECASE)
    item1a_matches = list(item1a_pattern.finditer(text))

    print(f"\n[ITEM 1A CHECK]")
    if item1a_matches:
        print(f"  ✅ Found {len(item1a_matches)} occurrences of 'Item 1A. Risk Factors'")
        # Extract context around first match
        first_match = item1a_matches[0]
        start = max(0, first_match.start() - 100)
        end = min(len(text), first_match.end() + 500)
        context = text[start:end]
        print(f"\n  Context:")
        print("  " + "-" * 58)
        for line in context.split('\n'):
            print(f"  {line}")
        print("  " + "-" * 58)
    else:
        print(f"  ❌ Item 1A. Risk Factors NOT FOUND")

    return {
        "file": str(md_path),
        "char_count": char_count,
        "line_count": line_count,
        "word_count": word_count,
        "toc_entries": len(toc),
        "page_markers": len(pages),
        "item1a_found": len(item1a_matches) > 0
    }


def inspect_json(json_path: Path) -> dict:
    """Inspect a LlamaParse JSON output."""
    data = json.loads(json_path.read_text(encoding="utf-8"))

    print(f"\n{'='*60}")
    print(f"INSPECTING: {json_path.name}")
    print(f"{'='*60}\n")

    print(f"[METADATA]")
    print(f"  Ticker: {data.get('ticker', 'N/A')}")
    print(f"  Parsed at: {data.get('parsed_at', 'N/A')}")
    print(f"  Duration: {data.get('duration_seconds', 'N/A')}s")
    print(f"  Documents: {data.get('document_count', 0)}")

    documents = data.get("documents", [])
    if documents:
        print(f"\n[DOCUMENTS]")
        for i, doc in enumerate(documents[:5], 1):  # Show first 5
            text = doc.get("text", "")
            print(f"  Doc {i}:")
            print(f"    Chars: {len(text):,}")
            print(f"    Preview: {text[:100]}...")

    return {
        "file": str(json_path),
        "document_count": data.get("document_count", 0),
        "total_chars": data.get("total_chars", 0)
    }


def main():
    parser = argparse.ArgumentParser(description="Inspect LlamaParse output")
    parser.add_argument("file_path", type=Path, help="Path to .md or .json file")

    args = parser.parse_args()

    if not args.file_path.exists():
        print(f"ERROR: File not found: {args.file_path}")
        exit(1)

    if args.file_path.suffix == ".md":
        result = inspect_markdown(args.file_path)
    elif args.file_path.suffix == ".json":
        result = inspect_json(args.file_path)
    else:
        print(f"ERROR: Unsupported file type: {args.file_path.suffix}")
        print("Supported: .md, .json")
        exit(1)

    print(f"\n{'='*60}")
    print("INSPECTION COMPLETE")
    print(f"{'='*60}\n")


if __name__ == "__main__":
    main()
