#!/usr/bin/env python3
"""Ingest 10-K HTML filings into ChromaDB for local retrieval.

Reads 10-K HTML files referenced by the EDGAR manifest, chunks them by
page boundaries, embeds with sentence-transformers, and stores in a
ChromaDB persistent database.

Usage
-----
    python scripts/ingest_10k.py                         # All tickers
    python scripts/ingest_10k.py --tickers MSFT AAPL     # Specific tickers
    python scripts/ingest_10k.py --force                  # Re-index existing
    python scripts/ingest_10k.py --chroma-path ./data/chroma_db
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from html.parser import HTMLParser
from pathlib import Path

# ---------------------------------------------------------------------------
# Defaults
# ---------------------------------------------------------------------------

PROJECT_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_MANIFEST = PROJECT_ROOT / "data" / "metadata" / "edgar_10k_manifest.json"
DEFAULT_CHROMA_PATH = PROJECT_ROOT / "data" / "chroma_db"
DEFAULT_MODEL = "all-MiniLM-L6-v2"
DEFAULT_CHUNK_MAX_CHARS = 2000  # soft max per chunk (character count)


# ---------------------------------------------------------------------------
# HTML → plain-text helper
# ---------------------------------------------------------------------------

class _HTMLStripper(HTMLParser):
    """Minimal HTML-to-text converter."""

    def __init__(self) -> None:
        super().__init__()
        self._parts: list[str] = []
        self._skip = False

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag in {"script", "style"}:
            self._skip = True

    def handle_endtag(self, tag: str) -> None:
        if tag in {"script", "style"}:
            self._skip = False
        if tag in {"p", "div", "br", "tr", "li", "h1", "h2", "h3", "h4", "h5", "h6"}:
            self._parts.append("\n")

    def handle_data(self, data: str) -> None:
        if not self._skip:
            self._parts.append(data)

    def get_text(self) -> str:
        raw = "".join(self._parts)
        # Collapse runs of whitespace / blank lines
        raw = re.sub(r"[ \t]+", " ", raw)
        raw = re.sub(r"\n{3,}", "\n\n", raw)
        return raw.strip()


def html_to_text(html: str) -> str:
    stripper = _HTMLStripper()
    stripper.feed(html)
    return stripper.get_text()


# ---------------------------------------------------------------------------
# Chunking
# ---------------------------------------------------------------------------

# SEC EDGAR 10-K HTML uses <hr> and page-break CSS to mark page boundaries.
_PAGE_BREAK_PATTERN = re.compile(
    r"<hr[^>]*>"                                    # <hr> tag
    r"|page-break-(?:before|after)\s*:\s*always"    # CSS page-break
    r"|<div[^>]*break-(?:before|after)[^>]*>",      # inline style
    re.IGNORECASE,
)


def _extract_first_heading(html_fragment: str) -> str | None:
    """Try to pull the first <h1>–<h4> text from a chunk."""
    m = re.search(r"<h[1-4][^>]*>(.*?)</h[1-4]>", html_fragment, re.IGNORECASE | re.DOTALL)
    if m:
        return html_to_text(m.group(1)).strip()[:120]
    return None


def chunk_html_by_page(html: str, ticker: str, max_chars: int = DEFAULT_CHUNK_MAX_CHARS) -> list[dict]:
    """Split HTML into page-sized chunks.

    Returns a list of dicts with keys: node_id, title, page_index, text.
    """
    # Split on page boundaries
    parts = _PAGE_BREAK_PATTERN.split(html)

    chunks: list[dict] = []
    page_index = 1

    for part in parts:
        text = html_to_text(part)
        if len(text.strip()) < 50:
            # Skip very short fragments (headers-only, blank pages)
            continue

        # If the chunk is very large, split further by paragraphs
        if len(text) > max_chars * 2:
            sub_texts = _split_long_text(text, max_chars)
        else:
            sub_texts = [text]

        for sub in sub_texts:
            title = _extract_first_heading(part) or f"{ticker} 10-K, Page {page_index}"
            chunks.append({
                "node_id": f"{ticker}-p{page_index:04d}",
                "title": title,
                "page_index": page_index,
                "text": sub.strip(),
            })
            page_index += 1

    return chunks


def _split_long_text(text: str, max_chars: int) -> list[str]:
    """Split long text into roughly max_chars-sized pieces at paragraph breaks."""
    paragraphs = text.split("\n\n")
    result: list[str] = []
    current: list[str] = []
    current_len = 0

    for para in paragraphs:
        if current_len + len(para) > max_chars and current:
            result.append("\n\n".join(current))
            current = []
            current_len = 0
        current.append(para)
        current_len += len(para)

    if current:
        result.append("\n\n".join(current))

    return result


# ---------------------------------------------------------------------------
# Ingestion
# ---------------------------------------------------------------------------

def ingest_ticker(
    ticker: str,
    html_path: Path,
    client: "chromadb.ClientAPI",
    embedding_fn: object,
    force: bool = False,
    max_chars: int = DEFAULT_CHUNK_MAX_CHARS,
) -> int:
    """Ingest a single ticker's 10-K HTML into ChromaDB.

    Returns the number of chunks stored.
    """
    collection_name = f"10k_{ticker.upper()}"

    # Check if already exists
    existing_names = client.list_collections()
    if collection_name in existing_names:
        if not force:
            col = client.get_collection(name=collection_name, embedding_function=embedding_fn)
            count = col.count()
            print(f"  [{ticker}] Collection '{collection_name}' already exists ({count} docs). Skipping. Use --force to re-index.")
            return count
        print(f"  [{ticker}] Deleting existing collection '{collection_name}' (--force)")
        client.delete_collection(name=collection_name)

    # Read HTML
    if not html_path.exists():
        print(f"  [{ticker}] ERROR: HTML file not found: {html_path}")
        print(f"           Run: python scripts/download_10k_html.py --tickers {ticker}")
        return 0

    html = html_path.read_text(encoding="utf-8", errors="replace")
    chunks = chunk_html_by_page(html, ticker, max_chars)

    if not chunks:
        print(f"  [{ticker}] WARNING: No chunks extracted from {html_path.name}")
        return 0

    # Create collection and add documents
    collection = client.get_or_create_collection(
        name=collection_name,
        embedding_function=embedding_fn,
    )

    ids = [c["node_id"] for c in chunks]
    documents = [c["text"] for c in chunks]
    metadatas = [
        {
            "node_id": c["node_id"],
            "title": c["title"],
            "page_index": c["page_index"],
            "ticker": ticker,
        }
        for c in chunks
    ]

    # ChromaDB has a batch limit; add in batches of 500
    batch_size = 500
    for i in range(0, len(ids), batch_size):
        collection.add(
            ids=ids[i : i + batch_size],
            documents=documents[i : i + batch_size],
            metadatas=metadatas[i : i + batch_size],
        )

    print(f"  [{ticker}] Ingested {len(chunks)} chunks into '{collection_name}'")
    return len(chunks)


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main() -> None:
    parser = argparse.ArgumentParser(description="Ingest 10-K filings into ChromaDB")
    parser.add_argument(
        "--tickers",
        nargs="+",
        help="Specific tickers to ingest (default: all from manifest)",
    )
    parser.add_argument(
        "--manifest",
        type=Path,
        default=DEFAULT_MANIFEST,
        help=f"Path to EDGAR manifest JSON (default: {DEFAULT_MANIFEST})",
    )
    parser.add_argument(
        "--chroma-path",
        type=Path,
        default=DEFAULT_CHROMA_PATH,
        help=f"ChromaDB persistent storage path (default: {DEFAULT_CHROMA_PATH})",
    )
    parser.add_argument(
        "--model",
        default=DEFAULT_MODEL,
        help=f"Sentence-transformer embedding model (default: {DEFAULT_MODEL})",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Re-index even if collection already exists",
    )
    parser.add_argument(
        "--max-chars",
        type=int,
        default=DEFAULT_CHUNK_MAX_CHARS,
        help=f"Soft max characters per chunk (default: {DEFAULT_CHUNK_MAX_CHARS})",
    )
    args = parser.parse_args()

    # Read manifest
    if not args.manifest.exists():
        print(f"ERROR: Manifest not found: {args.manifest}")
        print("Run the EDGAR download script first.")
        sys.exit(1)

    manifest = json.loads(args.manifest.read_text())
    records = manifest.get("records", [])

    if args.tickers:
        filter_set = {t.upper() for t in args.tickers}
        records = [r for r in records if r["ticker"].upper() in filter_set]
        if not records:
            print(f"ERROR: No manifest records found for tickers: {args.tickers}")
            sys.exit(1)

    print(f"ChromaDB path : {args.chroma_path}")
    print(f"Embedding model: {args.model}")
    print(f"Tickers       : {[r['ticker'] for r in records]}")
    print()

    # Import heavy dependencies only now
    try:
        import chromadb
        from chromadb.utils.embedding_functions import (
            SentenceTransformerEmbeddingFunction,
        )
    except ImportError:
        print("ERROR: Missing dependencies. Install them with:")
        print("  pip install chromadb sentence-transformers")
        sys.exit(1)

    # Ensure output dir exists
    args.chroma_path.mkdir(parents=True, exist_ok=True)

    client = chromadb.PersistentClient(path=str(args.chroma_path))
    embedding_fn = SentenceTransformerEmbeddingFunction(model_name=args.model)

    total = 0
    for record in records:
        ticker = record["ticker"]
        html_rel = record.get("html_path", "")
        html_path = PROJECT_ROOT / html_rel

        print(f"Processing {ticker}...")
        count = ingest_ticker(
            ticker=ticker,
            html_path=html_path,
            client=client,
            embedding_fn=embedding_fn,
            force=args.force,
            max_chars=args.max_chars,
        )
        total += count

    print(f"\nDone. Total chunks across all tickers: {total}")


if __name__ == "__main__":
    main()
