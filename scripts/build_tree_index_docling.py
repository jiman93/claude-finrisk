#!/usr/bin/env python3
"""Build tree indices from SEC 10-K PDF filings using docling (open-source).

Drop-in replacement for build_tree_index.py that swaps the PageIndex API call
(``fetch_pageindex_tree``) for local PDF parsing via docling.  Everything
downstream — PART/ITEM hierarchy assignment, leaf splitting, pruning,
disambiguation — is reused unchanged from the original script.

Install docling:
    pip install docling
    # or with full model support (slower install, faster parsing):
    # pip install "docling[torch]"

Usage
-----
    # Build tree for one ticker (PDF must exist in data/10k_pdfs/)
    python scripts/build_tree_index_docling.py --tickers AAPL

    # Build and compare against existing PageIndex-derived tree
    python scripts/build_tree_index_docling.py --tickers AAPL --compare

    # Build all tickers present in data/10k_pdfs/
    python scripts/build_tree_index_docling.py

    # Overwrite existing docling tree files
    python scripts/build_tree_index_docling.py --tickers AAPL --force

    # Pretty-print the resulting tree structure
    python scripts/build_tree_index_docling.py --tickers AAPL --print-tree

    # Save raw docling nodes to a JSON file for inspection
    python scripts/build_tree_index_docling.py --tickers AAPL --dump-raw data/debug/AAPL_docling_raw.json

Output
------
    data/tree_index/{TICKER}_docling_tree.json

    The output format is identical to the PageIndex-derived tree, except:
      - "source": "docling"   (instead of "pageindex")
      - "doc_id": null         (no PageIndex doc_id)
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

# ---------------------------------------------------------------------------
# Re-use all downstream logic from the original build script
# ---------------------------------------------------------------------------
# We only replace fetch_pageindex_tree().  The entire tree-building pipeline
# (build_tree_from_pageindex, _tree_stats, print_tree, constants) stays the
# same so comparison is fair.

_SCRIPTS = Path(__file__).resolve().parent
sys.path.insert(0, str(_SCRIPTS))

from build_tree_index import (  # noqa: E402
    DEFAULT_OUTPUT_DIR,
    PROJECT_ROOT,
    _tree_stats,
    build_tree_from_pageindex,
    print_tree,
)

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------

_GIT_PATH = PROJECT_ROOT / ".git"
if _GIT_PATH.is_file():
    # Running from a git worktree — data lives in the main repo
    _MAIN_REPO = Path(
        _GIT_PATH.read_text().split("gitdir:")[1].strip()
    ).resolve().parents[2]
else:
    _MAIN_REPO = PROJECT_ROOT

DATA_ROOT = _MAIN_REPO
PDF_DIR = DATA_ROOT / "data" / "10k_pdfs"
TREE_INDEX_DIR = DATA_ROOT / "data" / "tree_index"


# ---------------------------------------------------------------------------
# PDF discovery
# ---------------------------------------------------------------------------


def find_pdf(ticker: str, pdf_dir: Path = PDF_DIR) -> Path | None:
    """Return the first 10-K PDF found for *ticker*, or None."""
    pattern = f"{ticker.upper()}_10-K_*.pdf"
    matches = sorted(pdf_dir.glob(pattern))
    return matches[0] if matches else None


def discover_tickers(pdf_dir: Path = PDF_DIR) -> list[str]:
    """Return all tickers that have a PDF in *pdf_dir*."""
    tickers: list[str] = []
    for p in sorted(pdf_dir.glob("*_10-K_*.pdf")):
        ticker = p.name.split("_")[0].upper()
        if ticker not in tickers:
            tickers.append(ticker)
    return tickers


# ---------------------------------------------------------------------------
# Core: docling PDF → PageIndex-compatible node tree
# ---------------------------------------------------------------------------


def fetch_docling_tree(pdf_path: Path) -> tuple[list[dict], dict]:
    """Parse a 10-K PDF with docling and return PageIndex-compatible nodes.

    Returns:
        (nodes, metadata)

        ``nodes`` is a list of dicts matching the PageIndex tree format::

            {
                "title":      str,         # section heading
                "node_id":    str,         # unique ID  (e.g. "dl-0023")
                "page_index": int,         # 1-based page number from docling
                "text":       str,         # section body text
                "nodes":      list[dict]   # nested child sections
            }

        ``metadata`` is a plain dict with source provenance (not used by
        the downstream pipeline, but stored in the output JSON for reference).
    """
    try:
        from docling.document_converter import DocumentConverter
    except ImportError:
        print(
            "ERROR: docling is not installed.\n"
            "  pip install docling\n"
            "  # or: pip install 'docling[torch]' for GPU acceleration"
        )
        sys.exit(1)

    size_mb = pdf_path.stat().st_size / 1_048_576
    print(f"    Parsing PDF via docling: {pdf_path.name}  ({size_mb:.1f} MB) …")

    converter = DocumentConverter()
    result = converter.convert(str(pdf_path))
    doc = result.document

    page_count = len(getattr(doc, "pages", {})) or None
    nodes = _docling_doc_to_pi_nodes(doc)
    metadata = {
        "source": "docling",
        "pdf_path": str(pdf_path),
        "page_count": page_count,
        "raw_top_level_nodes": len(nodes),
    }
    return nodes, metadata


def _docling_doc_to_pi_nodes(doc) -> list[dict]:
    """Convert a ``DoclingDocument`` into PageIndex-compatible node list.

    Walks document items in order.  Section headers establish the nesting
    hierarchy; text items accumulate into the nearest enclosing header.

    Docling heading levels (1 = top, 2 = sub, …) map naturally onto the
    nested-dict structure that ``_flatten_pi_nodes`` in the original script
    expects::

        Level 1  →  top-level nodes
        Level 2  →  nodes[i]["nodes"]
        Level 3  →  nodes[i]["nodes"][j]["nodes"]
        …
    """
    try:
        from docling.datamodel.base_models import DocItemLabel
    except ImportError:
        raise RuntimeError("docling is required: pip install docling")

    node_counter = 0

    # heading_stack holds (docling_level, node_dict) pairs.
    # Invariant: stack is always strictly increasing in level from bottom to top.
    heading_stack: list[tuple[int, dict]] = []
    # Top-level nodes (level 1 or any node with no parent)
    root_nodes: list[dict] = []

    def _make_node(title: str, page: int) -> dict:
        nonlocal node_counter
        node_counter += 1
        return {
            "title": title,
            "node_id": f"dl-{node_counter:04d}",
            "page_index": page,
            "text": "",
            "nodes": [],
        }

    def _current_leaf() -> dict | None:
        return heading_stack[-1][1] if heading_stack else None

    def _append_text(text: str) -> None:
        leaf = _current_leaf()
        if leaf is None:
            return
        t = text.strip()
        if not t:
            return
        leaf["text"] = (leaf["text"] + "\n\n" + t).strip() if leaf["text"] else t

    for item, _ in doc.iterate_items():
        label = item.label

        # --- Page number from provenance --------------------------------
        page: int = 0
        if getattr(item, "prov", None):
            try:
                page = item.prov[0].page_no
            except (IndexError, AttributeError):
                pass

        # --- Section headers -------------------------------------------
        if label == DocItemLabel.SECTION_HEADER:
            heading_text = (item.text or "").strip()
            if not heading_text:
                continue

            # docling uses .level on SectionHeaderItem (1 = h1, 2 = h2, …)
            dlevel: int = getattr(item, "level", 1)

            node = _make_node(heading_text, page)

            # Pop all stack entries at the same or deeper level so that
            # the new heading is a sibling or ancestor — never a descendant
            # of a node at the same level.
            while heading_stack and heading_stack[-1][0] >= dlevel:
                heading_stack.pop()

            if not heading_stack:
                # No parent → top-level node
                root_nodes.append(node)
            else:
                # Attach as child of nearest shallower heading
                heading_stack[-1][1]["nodes"].append(node)

            heading_stack.append((dlevel, node))

        # --- Text content -------------------------------------------
        elif label in (DocItemLabel.TEXT, DocItemLabel.PARAGRAPH):
            _append_text(item.text or "")

        elif label == DocItemLabel.LIST_ITEM:
            _append_text("• " + (item.text or "").strip())

        # --- Tables (exported as markdown) --------------------------
        elif label == DocItemLabel.TABLE:
            try:
                md = item.export_to_markdown()
                _append_text(md)
            except Exception:
                pass

        # Other labels (PICTURE, FORMULA, …) are skipped.

    return root_nodes


# ---------------------------------------------------------------------------
# Comparison helper
# ---------------------------------------------------------------------------


def _compare_trees(
    ticker: str,
    pi_tree_path: Path,
    docling_tree_path: Path,
) -> None:
    """Print a side-by-side comparison of PageIndex vs docling tree stats."""
    if not pi_tree_path.exists():
        print(f"    [compare] PageIndex tree not found: {pi_tree_path.name} — skipping comparison.")
        return
    if not docling_tree_path.exists():
        print(f"    [compare] Docling tree not found: {docling_tree_path.name} — build it first.")
        return

    pi = json.loads(pi_tree_path.read_text(encoding="utf-8"))
    dl = json.loads(docling_tree_path.read_text(encoding="utf-8"))

    def _fmt_stats(s: dict) -> dict:
        leaves = s.get("leaf_nodes", 0)
        chars = s.get("total_chars", 0)
        return {
            "total_nodes": s.get("total_nodes", 0),
            "leaf_nodes": leaves,
            "max_depth": s.get("max_depth", 0),
            "total_chars": chars,
            "avg_leaf_chars": round(chars / leaves) if leaves else 0,
        }

    pi_s = _fmt_stats(pi.get("stats", {}))
    dl_s = _fmt_stats(dl.get("stats", {}))

    print(f"\n    {'Metric':<22}  {'PageIndex':>12}  {'Docling':>12}  {'Δ':>8}")
    print(f"    {'-'*60}")
    for key in ("total_nodes", "leaf_nodes", "max_depth", "total_chars", "avg_leaf_chars"):
        pv = pi_s[key]
        dv = dl_s[key]
        delta = dv - pv
        sign = "+" if delta >= 0 else ""
        print(f"    {key:<22}  {pv:>12,}  {dv:>12,}  {sign}{delta:>7,}")
    print()


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Build 10-K tree indices from local PDFs using docling.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument(
        "--tickers",
        nargs="+",
        metavar="TICKER",
        help="Tickers to process. Default: all tickers found in data/10k_pdfs/.",
    )
    parser.add_argument(
        "--pdf-dir",
        type=Path,
        default=PDF_DIR,
        metavar="DIR",
        help=f"Directory containing 10-K PDFs. Default: {PDF_DIR}",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=DEFAULT_OUTPUT_DIR,
        metavar="DIR",
        help=f"Output directory for tree JSON files. Default: {DEFAULT_OUTPUT_DIR}",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Overwrite existing docling tree files.",
    )
    parser.add_argument(
        "--compare",
        action="store_true",
        help="After building, compare with the existing PageIndex-derived tree.",
    )
    parser.add_argument(
        "--print-tree",
        action="store_true",
        help="Pretty-print the resulting tree structure.",
    )
    parser.add_argument(
        "--stats",
        action="store_true",
        help="Print detailed tree statistics.",
    )
    parser.add_argument(
        "--dump-raw",
        type=Path,
        default=None,
        metavar="PATH",
        help=(
            "Save the raw docling node list (before build_tree_from_pageindex) "
            "to PATH for inspection.  Use {ticker} as a placeholder."
        ),
    )
    args = parser.parse_args()

    # ---- Discover tickers ------------------------------------------------
    if args.tickers:
        tickers = [t.upper() for t in args.tickers]
    else:
        tickers = discover_tickers(args.pdf_dir)
        if not tickers:
            print(f"ERROR: No 10-K PDFs found in {args.pdf_dir}")
            sys.exit(1)

    args.output_dir.mkdir(parents=True, exist_ok=True)

    print(f"PDF dir    : {args.pdf_dir}")
    print(f"Output dir : {args.output_dir}")
    print(f"Tickers    : {tickers}")
    print()

    for ticker in tickers:
        pdf_path = find_pdf(ticker, args.pdf_dir)
        if pdf_path is None:
            print(f"  [{ticker}] No PDF found in {args.pdf_dir} — skipping.")
            continue

        out_name = f"{ticker}_docling_tree.json"
        out_path = args.output_dir / out_name

        if out_path.exists() and not args.force:
            print(f"  [{ticker}] Already exists: {out_name}. Use --force to overwrite.")
            if args.compare:
                pi_tree_path = args.output_dir / f"{ticker}_tree.json"
                _compare_trees(ticker, pi_tree_path, out_path)
            continue

        print(f"  [{ticker}] Starting docling ingestion …")
        try:
            dl_nodes, metadata = fetch_docling_tree(pdf_path)
        except Exception as exc:
            print(f"  [{ticker}] ERROR during docling parse: {exc}")
            continue

        # ---- Optional: dump raw nodes before tree building -----------
        if args.dump_raw:
            dump_path = Path(
                str(args.dump_raw)
                .replace("{ticker}", ticker)
                .replace("{TICKER}", ticker)
            )
            dump_path.parent.mkdir(parents=True, exist_ok=True)
            dump_path.write_text(
                json.dumps(dl_nodes, indent=2, ensure_ascii=False),
                encoding="utf-8",
            )
            print(
                f"  [{ticker}] Raw docling nodes saved: {dump_path}  "
                f"({len(dl_nodes)} top-level nodes, "
                f"{dump_path.stat().st_size:,} bytes)"
            )

        # ---- Build canonical PART → ITEM → sub-section tree ----------
        print(f"  [{ticker}] Building PART/ITEM hierarchy …")
        try:
            tree = build_tree_from_pageindex(ticker, dl_nodes)
        except Exception as exc:
            print(f"  [{ticker}] ERROR during tree build: {exc}")
            continue

        stats = _tree_stats(tree)
        output = {
            "ticker": ticker,
            "doc_id": None,          # no PageIndex doc_id when using docling
            "source": "docling",
            "pdf_path": metadata.get("pdf_path"),
            "tree": tree.to_dict(),
            "stats": {
                "total_nodes": stats["total_nodes"],
                "leaf_nodes": stats["leaf_nodes"],
                "max_depth": stats["max_depth"],
                "total_chars": stats["total_chars"],
                "level_counts": {
                    str(k): v for k, v in sorted(stats["level_counts"].items())
                },
            },
        }
        out_path.write_text(json.dumps(output, indent=2, ensure_ascii=False), encoding="utf-8")
        print(
            f"  [{ticker}] Wrote {out_name}: "
            f"{stats['total_nodes']} nodes, "
            f"{stats['leaf_nodes']} leaves, "
            f"depth {stats['max_depth']}, "
            f"{stats['total_chars']:,} chars"
        )

        if args.stats:
            print(f"           Chars: {stats['total_chars']:,}")
            print(f"           Levels: {stats['level_counts']}")

        if args.print_tree:
            print()
            print_tree(tree)
            print()

        if args.compare:
            pi_tree_path = args.output_dir / f"{ticker}_tree.json"
            _compare_trees(ticker, pi_tree_path, out_path)

    print("\nDone.")


if __name__ == "__main__":
    main()
