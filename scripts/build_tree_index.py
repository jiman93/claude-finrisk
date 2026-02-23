#!/usr/bin/env python3
"""Build hierarchical tree indices from SEC 10-K filings via PageIndex.

Fetches the document tree that PageIndex has already built from a PDF,
then layers on the standard 10-K PART → ITEM hierarchy so the LLM
traversal can reason at the right granularity.

    Root  ({TICKER} 10-K Annual Filing)
    ├── PART I
    │   ├── Item 1. Business
    │   │   ├── Company Background
    │   │   └── Products
    │   ├── Item 1A. Risk Factors
    │   │   ├── Macroeconomic Risks
    │   │   └── Operational Risks
    │   └── ...
    ├── PART II
    │   ├── Item 7. MD&A
    │   └── Item 8. Financial Statements
    └── ...

Output is one JSON file per ticker in ``data/tree_index/{TICKER}_tree.json``.

Phase 1 of the LLM-reasoning tree traversal approach.

Usage
-----
    # Fetch tree for specific tickers (uses PageIndex manifest for doc_ids)
    python scripts/build_tree_index.py --tickers AAPL

    # Fetch all tickers in the PageIndex manifest
    python scripts/build_tree_index.py

    # Override API key / base URL
    python scripts/build_tree_index.py --tickers AAPL --api-key sk-...

    # Pretty-print the tree
    python scripts/build_tree_index.py --tickers AAPL --print-tree

    # Overwrite existing tree files
    python scripts/build_tree_index.py --tickers AAPL --force

    # Save raw PageIndex response for inspection (without building tree)
    python scripts/build_tree_index.py --tickers AAPL --dump-raw data/debug/AAPL_raw.json

    # Full rebuild with raw dump and tree print
    python scripts/build_tree_index.py --tickers AAPL --force --dump-raw data/debug/AAPL_raw.json --print-tree
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
from dataclasses import dataclass, field
from pathlib import Path

import httpx

# ---------------------------------------------------------------------------
# Defaults
# ---------------------------------------------------------------------------

PROJECT_ROOT = Path(__file__).resolve().parents[1]

# In a git worktree, data files live in the main repo.
_git_path = PROJECT_ROOT / ".git"
if _git_path.is_file():
    _main_repo = Path(
        _git_path.read_text().split("gitdir:")[1].strip()
    ).resolve().parents[2]  # .git/worktrees/<name> → .git → repo root
else:
    _main_repo = PROJECT_ROOT
DATA_ROOT = _main_repo

DEFAULT_PI_MANIFEST = DATA_ROOT / "data" / "metadata" / "pageindex_index_manifest.json"
DEFAULT_OUTPUT_DIR = PROJECT_ROOT / "data" / "tree_index"
DEFAULT_BASE_URL = "https://api.pageindex.ai"

# Max characters of plain text to store as a node's content summary.
SUMMARY_MAX_CHARS = 800

# Minimum content length to keep a leaf node.  Nodes below this threshold
# are pruned — they are typically heading-only structural waypoints with no
# substantive content (e.g. "## Operating Risks" wrapped in physical_index
# markers).  Raised from 30 → 150 to eliminate ~82 empty heading chunks
# identified in the chunk quality audit.
MIN_CONTENT_CHARS = 150

# Leaf nodes larger than this threshold are candidates for embedded-heading
# splitting (post-processing step that creates synthetic child nodes).
# Lowered from 8000 → 5000 so more monolithic sections get split.
LARGE_LEAF_THRESHOLD = 5000

# Target segment size for paragraph-boundary fallback splitting (chars).
# Used when a large leaf has no embedded headings to split on.
PARAGRAPH_SPLIT_TARGET = 3000

# ---------------------------------------------------------------------------
# Canonical 10-K structure
# ---------------------------------------------------------------------------

_ITEM_RE = re.compile(
    r"^\s*Item\s+(\d+[A-C]?)[\.\s]",
    re.IGNORECASE,
)

_PART_RE = re.compile(
    r"^\s*PART\s+(I{1,3}V?|IV)\s*\.?\s*$",
    re.IGNORECASE,
)

# Standard item → part mapping per SEC Regulation S-K.
_ITEM_TO_PART: dict[str, str] = {
    "1": "I", "1A": "I", "1B": "I", "1C": "I",
    "2": "I", "3": "I", "4": "I",
    "5": "II", "6": "II", "7": "II", "7A": "II",
    "8": "II", "9": "II", "9A": "II", "9B": "II", "9C": "II",
    "10": "III", "11": "III", "12": "III", "13": "III", "14": "III",
    "15": "IV", "16": "IV",
}

# Patterns that identify embedded sub-section headings inside large leaf nodes.
# We look for markdown headings (### or ####) or common 10-K risk sub-section
# title patterns that appear at the start of a line.
_EMBEDDED_HEADING_RE = re.compile(
    r"^(#{3,4}\s+.+|"
    r"(?:Macroeconomic|Business|Financial|Legal|Regulatory|General|"
    r"Operational|Market|Technology|Competition|Supply|Geographic|"
    r"Strategic|Environmental|Cybersecurity|Data\s+Privacy)\s+Risks?.*)",
    re.IGNORECASE | re.MULTILINE,
)


def _extract_item_number(title: str) -> str | None:
    """Extract the item number from a heading like 'Item 1A. Risk Factors'."""
    m = _ITEM_RE.match(title)
    return m.group(1).upper() if m else None


def _is_part_heading(title: str) -> bool:
    return bool(_PART_RE.match(title.strip()))


# ---------------------------------------------------------------------------
# TOC parsing — extract Item → page mapping from the TOC text
# ---------------------------------------------------------------------------

_TOC_ITEM_RE = re.compile(
    r"Item\s+(\d+[A-C]?)\.?\s*\|?\s*(.+?)\s*\|?\s*(\d+)\s*\|?\s*$",
    re.IGNORECASE | re.MULTILINE,
)


@dataclass
class TocEntry:
    item_number: str    # e.g. "1A"
    title: str          # e.g. "Risk Factors"
    page: int           # physical page number from the TOC


def parse_toc_from_text(text: str) -> list[TocEntry]:
    """Extract Item entries from a markdown-table TOC in PageIndex text."""
    entries: list[TocEntry] = []
    for m in _TOC_ITEM_RE.finditer(text):
        item_num = m.group(1).upper()
        title = m.group(2).strip().strip("|").strip()
        page = int(m.group(3))
        entries.append(TocEntry(item_number=item_num, title=title, page=page))
    return entries


def _build_page_to_item(toc: list[TocEntry]) -> list[tuple[int, str, str]]:
    """Return sorted list of (page, item_number, full_title) from TOC.

    Used to assign orphan sub-sections to the correct Item based on
    which Item's page range they fall within.
    """
    result = []
    for e in toc:
        full_title = f"Item {e.item_number}. {e.title}"
        result.append((e.page, e.item_number, full_title))
    result.sort(key=lambda x: x[0])
    return result


# ---------------------------------------------------------------------------
# Physical index utilities
# ---------------------------------------------------------------------------

_PHYSICAL_INDEX_RE = re.compile(r"<physical_index_(\d+)>")


def _extract_physical_indices(text: str) -> list[int]:
    """Return sorted list of physical_index values found in text."""
    return sorted({int(m.group(1)) for m in _PHYSICAL_INDEX_RE.finditer(text)})


def _page_range_str(indices: list[int]) -> str:
    """Format a sorted list of physical indices as 'min–max' or '' if empty."""
    if not indices:
        return ""
    if len(indices) == 1:
        return str(indices[0])
    return f"{indices[0]}–{indices[-1]}"


# ---------------------------------------------------------------------------
# Tree data structure
# ---------------------------------------------------------------------------

@dataclass
class TreeNode:
    """A node in the document heading tree."""

    node_id: str
    heading: str
    level: int              # 0=root, 1=part, 2=item, 3=sub-section
    page_index: int = 0
    item_number: str | None = None
    content_summary: str = ""
    content_full: str = ""
    char_count: int = 0
    children: list[TreeNode] = field(default_factory=list)

    def to_dict(self) -> dict:
        d: dict = {
            "node_id": self.node_id,
            "heading": self.heading,
            "level": self.level,
            "page_index": self.page_index,
        }
        if self.item_number:
            d["item_number"] = self.item_number
        if self.content_summary:
            d["content_summary"] = self.content_summary
        d["char_count"] = self.char_count
        if self.children:
            d["children"] = [c.to_dict() for c in self.children]
        else:
            d["content_full"] = self.content_full
        return d


# ---------------------------------------------------------------------------
# PageIndex API
# ---------------------------------------------------------------------------

def fetch_pageindex_tree(
    base_url: str,
    api_key: str,
    doc_id: str,
) -> tuple[list[dict], dict]:
    """GET /doc/{doc_id}/?type=tree and return (result_list, full_response)."""
    url = f"{base_url.rstrip('/')}/doc/{doc_id}/"
    with httpx.Client(timeout=30) as client:
        resp = client.get(url, headers={"api_key": api_key}, params={"type": "tree"})
        if resp.status_code >= 400:
            detail = ""
            try:
                detail = resp.json().get("detail", "")
            except Exception:
                detail = resp.text[:200]
            raise RuntimeError(
                f"PageIndex GET /doc/{doc_id}/ failed ({resp.status_code}): {detail}"
            )
        data = resp.json()
    status = data.get("status", "unknown")
    if status not in ("completed",):
        raise RuntimeError(
            f"PageIndex doc {doc_id} not ready: status={status}"
        )
    return data.get("result", []), data


# ---------------------------------------------------------------------------
# Tree building from PageIndex nodes
# ---------------------------------------------------------------------------

def _flatten_pi_nodes(nodes: list[dict], depth: int = 0) -> list[dict]:
    """Flatten nested PageIndex nodes into a linear list, preserving order.

    PageIndex returns nodes like:
        {title, node_id, page_index, text?, nodes?: [...children...]}

    We flatten them so every node is at the same level, then re-build
    our own hierarchy using the canonical PART/ITEM mapping.
    """
    flat: list[dict] = []
    for n in nodes:
        flat.append({
            "title": n.get("title", ""),
            "node_id": n.get("node_id", ""),
            "page_index": n.get("page_index", 0),
            "text": n.get("text", ""),
            "pi_depth": depth,
        })
        children = n.get("nodes", [])
        if children:
            flat.extend(_flatten_pi_nodes(children, depth + 1))
    return flat


def build_tree_from_pageindex(ticker: str, pi_nodes: list[dict]) -> TreeNode:
    """Convert flat PageIndex nodes into a PART → ITEM → sub-section tree.

    Strategy:
      1. First pass — scan for explicit Item headings in the PageIndex
         sequence and record their *positions* (index in the flat list).
      2. Parse the TOC to discover Items that PageIndex didn't detect as
         explicit headings.
      3. Second pass — assign each sub-section to the correct Item using
         **document ordering**: a sub-section between Item X and Item Y
         in the flat list belongs to Item X, regardless of page numbers.
      4. TOC page ranges are only used to create *missing* Items that
         appear between two known Items when there's a page gap.
      5. Post-processing: large leaf nodes with embedded headings are split
         into synthetic child nodes (embedded-heading splitter).
    """

    flat = _flatten_pi_nodes(pi_nodes)

    # --- Extract TOC for discovering missing Items ---
    toc_entries: list[TocEntry] = []
    for pi in flat:
        text = pi.get("text", "")
        if "TABLE OF CONTENTS" in text.upper():
            toc_entries = parse_toc_from_text(text)
            break
    toc_by_item: dict[str, TocEntry] = {e.item_number: e for e in toc_entries}

    # --- First pass: discover explicit Item positions in the flat list ---
    # Map: flat-list-index → item_number for nodes that ARE Item headings.
    explicit_item_indices: set[int] = set()
    for idx, pi in enumerate(flat):
        title = pi["title"].strip()
        item_num = _extract_item_number(title)
        if item_num:
            explicit_item_indices.add(idx)

    def _next_explicit_item_idx(from_idx: int) -> int | None:
        """Return the flat-list index of the next explicit Item heading after from_idx."""
        for i in range(from_idx + 1, len(flat)):
            if i in explicit_item_indices:
                return i
        return None

    root = TreeNode(
        node_id=f"{ticker}-root",
        heading=f"{ticker} 10-K Annual Filing",
        level=0,
    )

    part_nodes: dict[str, TreeNode] = {}
    item_nodes: dict[str, TreeNode] = {}  # item_number → TreeNode
    current_part: str | None = None
    current_part_node: TreeNode | None = None
    current_item_num: str | None = None
    current_item_node: TreeNode | None = None

    def _ensure_item(item_num: str, title: str, page_idx: int, pi_id: str = "") -> TreeNode:
        """Get or create an ITEM node, creating its PART parent if needed."""
        nonlocal current_part, current_part_node, current_item_num, current_item_node

        if item_num in item_nodes:
            current_item_num = item_num
            current_item_node = item_nodes[item_num]
            return current_item_node

        part_label = _ITEM_TO_PART.get(item_num, current_part or "I")
        if part_label != current_part:
            if part_label not in part_nodes:
                pn = TreeNode(
                    node_id=f"{ticker}-part-{part_label.lower()}",
                    heading=f"PART {part_label}",
                    level=1,
                )
                part_nodes[part_label] = pn
                root.children.append(pn)
            current_part = part_label
            current_part_node = part_nodes[part_label]

        node = TreeNode(
            node_id=pi_id or f"{ticker}-item-{item_num.lower()}",
            heading=title,
            level=2,
            page_index=page_idx,
            item_number=item_num,
        )
        current_part_node.children.append(node)
        item_nodes[item_num] = node
        current_item_num = item_num
        current_item_node = node
        return node

    # --- Second pass: assign nodes sequentially ---
    for idx, pi in enumerate(flat):
        title = pi["title"].strip()
        text = pi["text"].strip()
        page_idx = int(pi.get("page_index", 0))
        pi_id = pi.get("node_id", "")

        if not text and not title:
            continue

        # Skip PART headings — we create them via the mapping.
        if _is_part_heading(title):
            continue

        # Check if this node IS an Item heading.
        item_num = _extract_item_number(title)

        if item_num:
            item_node = _ensure_item(item_num, title, page_idx, pi_id)
            # Store the Item heading's own text as content.
            if text:
                item_node.content_full = text
                item_node.char_count = len(text)
                item_node.content_summary = text[:SUMMARY_MAX_CHARS]
            continue

        # --- Sub-section: assign to current Item ---
        #
        # Hybrid approach:
        #   1. Document ordering takes priority — sub-sections between
        #      two explicit Item headings belong to the earlier Item.
        #   2. TOC page ranges fill gaps — when a sub-section's page is
        #      past the start of a *later* Item that PageIndex didn't
        #      detect, we create that Item and switch to it.
        #
        # The key constraint: only switch to a TOC Item if its page is
        # STRICTLY GREATER than the current Item's page (preventing the
        # TOC from pulling sub-sections backward when PDF page numbers
        # don't exactly match the TOC).

        if toc_by_item and page_idx:
            # Find which TOC Item this page belongs to.
            best_toc = None
            for e in toc_entries:
                if e.page <= page_idx:
                    best_toc = e
                else:
                    break
            if best_toc and best_toc.item_number != current_item_num:
                # Only switch if:
                #  a) There's no current Item yet, OR
                #  b) The TOC Item starts on a page AFTER the current
                #     Item's page — meaning we've moved past it.
                current_item_page = (
                    current_item_node.page_index if current_item_node else 0
                )
                if (
                    current_item_node is None
                    or best_toc.page > current_item_page
                ):
                    _ensure_item(
                        best_toc.item_number,
                        f"Item {best_toc.item_number}. {best_toc.title}",
                        page_idx,
                    )

        if current_item_node is not None:
            node = TreeNode(
                node_id=pi_id or f"{ticker}-sub-{page_idx:03d}",
                heading=title,
                level=3,
                page_index=page_idx,
                content_full=text,
                char_count=len(text),
                content_summary=text[:SUMMARY_MAX_CHARS] if text else "",
            )
            current_item_node.children.append(node)
        else:
            # Pre-Item content (cover, forward-looking, etc.)
            if len(text) < MIN_CONTENT_CHARS and not title:
                continue
            node = TreeNode(
                node_id=pi_id or f"{ticker}-preamble-{len(root.children):03d}",
                heading=title or "(Preamble)",
                level=3,
                page_index=page_idx,
                content_full=text,
                char_count=len(text),
                content_summary=text[:SUMMARY_MAX_CHARS] if text else "",
            )
            root.children.append(node)

    # --- Finalize: compute char counts up, generate summaries. ---
    _finalize_tree(root)

    # --- Post-processing: split large leaf nodes with embedded headings. ---
    _split_large_leaves(root, ticker)

    # --- Re-finalize after splitting (char counts / summaries may change). ---
    _finalize_tree(root)
    _prune_empty(root)

    # --- Disambiguate duplicate leaf headings. ---
    _disambiguate_headings(root)

    return root


# ---------------------------------------------------------------------------
# Post-processing
# ---------------------------------------------------------------------------

def _finalize_tree(node: TreeNode) -> int:
    """Propagate char counts upward, set summaries for internal nodes."""
    if not node.children:
        node.char_count = len(node.content_full)
        if not node.content_summary:
            node.content_summary = node.content_full[:SUMMARY_MAX_CHARS]
        return node.char_count

    total = 0
    for child in node.children:
        total += _finalize_tree(child)

    node.char_count = total

    if not node.content_summary or len(node.content_summary) < 20:
        child_headings = [c.heading for c in node.children]
        node.content_summary = "Sub-sections: " + " | ".join(child_headings)
        node.content_summary = node.content_summary[:SUMMARY_MAX_CHARS]

    # Internal nodes don't store full content — it's in children.
    node.content_full = ""
    return total


def _split_large_leaves(node: TreeNode, ticker: str) -> None:
    """Recursively walk the tree and split large item-level leaf nodes.

    If a leaf node at level 2 (item) or level 3 (sub-section) has no
    children AND char_count > LARGE_LEAF_THRESHOLD, we scan its
    content_full for embedded markdown headings and split there.

    Splitting is conservative: we only split if we find ≥ 2 heading
    boundaries so that we actually produce multiple meaningful chunks.
    """
    # First recurse into existing children.
    for child in node.children:
        _split_large_leaves(child, ticker)

    # Only attempt splitting on leaf nodes with substantial content.
    if node.children:
        return
    if node.char_count <= LARGE_LEAF_THRESHOLD:
        return
    # Only split item-level and sub-section-level nodes.
    if node.level not in (2, 3):
        return

    content = node.content_full
    if not content:
        return

    # Find all embedded heading positions.
    matches = list(_EMBEDDED_HEADING_RE.finditer(content))

    if len(matches) >= 2:
        # --- Heading-based splitting ---
        synthetic_children = _split_by_headings(node, content, matches)
    else:
        # --- Fallback: paragraph-boundary splitting ---
        synthetic_children = _split_by_paragraphs(node, content)

    if len(synthetic_children) >= 2:
        # Replace the leaf with its split children.
        node.children = synthetic_children
        node.content_full = ""  # _finalize_tree will set summary from children


def _split_by_headings(
    node: TreeNode,
    content: str,
    matches: list[re.Match],
) -> list[TreeNode]:
    """Split content at embedded heading positions."""
    # Build segment boundaries: (start, end, heading_text)
    segments: list[tuple[int, int, str]] = []
    for i, m in enumerate(matches):
        start = m.start()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(content)
        heading_text = m.group(0).strip().lstrip("#").strip()
        segments.append((start, end, heading_text))

    # Prepend content before the first heading as a preamble segment (if any).
    preamble = content[: matches[0].start()].strip()

    synthetic_children: list[TreeNode] = []

    if preamble and len(preamble) >= MIN_CONTENT_CHARS:
        synthetic_children.append(
            TreeNode(
                node_id=f"{node.node_id}-split-preamble",
                heading=f"{node.heading} — Introduction",
                level=node.level + 1,
                page_index=node.page_index,
                content_full=preamble,
                char_count=len(preamble),
                content_summary=preamble[:SUMMARY_MAX_CHARS],
            )
        )

    for i, (start, end, heading_text) in enumerate(segments):
        seg_text = content[start:end].strip()
        if len(seg_text) < MIN_CONTENT_CHARS:
            continue
        # Derive page_index for this segment from physical_index markers.
        seg_indices = _extract_physical_indices(seg_text)
        seg_page = seg_indices[0] if seg_indices else node.page_index
        synthetic_children.append(
            TreeNode(
                node_id=f"{node.node_id}-split-{i:02d}",
                heading=heading_text[:120],
                level=node.level + 1,
                page_index=seg_page,
                content_full=seg_text,
                char_count=len(seg_text),
                content_summary=seg_text[:SUMMARY_MAX_CHARS],
            )
        )

    return synthetic_children


def _split_by_paragraphs(
    node: TreeNode,
    content: str,
) -> list[TreeNode]:
    """Fallback: split content at paragraph boundaries into ~PARAGRAPH_SPLIT_TARGET-char segments."""
    paragraphs = content.split("\n\n")
    if len(paragraphs) < 2:
        return []

    # Merge consecutive paragraphs into segments of roughly PARAGRAPH_SPLIT_TARGET chars.
    segments: list[str] = []
    current_segment: list[str] = []
    current_len = 0

    for para in paragraphs:
        para = para.strip()
        if not para:
            continue
        current_segment.append(para)
        current_len += len(para)
        if current_len >= PARAGRAPH_SPLIT_TARGET:
            segments.append("\n\n".join(current_segment))
            current_segment = []
            current_len = 0

    # Flush remainder — merge into last segment if too small.
    if current_segment:
        remainder = "\n\n".join(current_segment)
        if segments and len(remainder) < MIN_CONTENT_CHARS:
            segments[-1] += "\n\n" + remainder
        else:
            segments.append(remainder)

    # Only split if we got ≥ 2 meaningful segments.
    segments = [s for s in segments if len(s) >= MIN_CONTENT_CHARS]
    if len(segments) < 2:
        return []

    synthetic_children: list[TreeNode] = []
    for i, seg_text in enumerate(segments):
        seg_indices = _extract_physical_indices(seg_text)
        seg_page = seg_indices[0] if seg_indices else node.page_index
        synthetic_children.append(
            TreeNode(
                node_id=f"{node.node_id}-psplit-{i:02d}",
                heading=f"{node.heading} (Part {i + 1})",
                level=node.level + 1,
                page_index=seg_page,
                content_full=seg_text,
                char_count=len(seg_text),
                content_summary=seg_text[:SUMMARY_MAX_CHARS],
            )
        )

    return synthetic_children


def _prune_empty(node: TreeNode) -> None:
    """Remove leaf nodes with no meaningful content (in-place)."""
    node.children = [
        c for c in node.children
        if c.children or c.char_count >= MIN_CONTENT_CHARS
    ]
    for child in node.children:
        _prune_empty(child)


def _disambiguate_headings(root: TreeNode) -> None:
    """Prepend parent context to duplicate leaf headings.

    If two or more leaf nodes share the same heading (e.g. "Revenues"),
    prepend the parent node's heading to disambiguate:
        "Revenues" → "Commercial Airplanes — Revenues"

    Only modifies headings that actually collide.
    """
    # Pass 1: collect (leaf, parent_heading) pairs and count heading occurrences.
    leaf_records: list[tuple[TreeNode, str]] = []
    heading_counts: dict[str, int] = {}

    def _walk(node: TreeNode, parent_heading: str) -> None:
        if not node.children:
            leaf_records.append((node, parent_heading))
            heading_counts[node.heading] = heading_counts.get(node.heading, 0) + 1
        else:
            for child in node.children:
                _walk(child, node.heading)

    _walk(root, "")

    # Pass 2: disambiguate leaves whose heading appears more than once.
    for leaf, parent_heading in leaf_records:
        if heading_counts.get(leaf.heading, 0) > 1 and parent_heading:
            # Avoid redundancy if parent heading is already a prefix.
            if not leaf.heading.startswith(parent_heading):
                leaf.heading = f"{parent_heading} — {leaf.heading}"


# ---------------------------------------------------------------------------
# Stats & display
# ---------------------------------------------------------------------------

def _tree_stats(node: TreeNode, depth: int = 0) -> dict:
    stats = {
        "total_nodes": 1,
        "leaf_nodes": 0 if node.children else 1,
        "max_depth": depth,
        "total_chars": node.char_count,
        "level_counts": {node.level: 1},
    }
    for child in node.children:
        cs = _tree_stats(child, depth + 1)
        stats["total_nodes"] += cs["total_nodes"]
        stats["leaf_nodes"] += cs["leaf_nodes"]
        stats["max_depth"] = max(stats["max_depth"], cs["max_depth"])
        for lv, cnt in cs["level_counts"].items():
            stats["level_counts"][lv] = stats["level_counts"].get(lv, 0) + cnt
    return stats


def _node_page_range(node: TreeNode) -> str:
    """Return 'pages X–Y' (or 'page X') based on physical_index markers in content."""
    text = node.content_full or node.content_summary or ""
    indices = _extract_physical_indices(text)
    # Also gather from children recursively for internal nodes.
    if not indices and node.children:
        all_idx: list[int] = []
        _collect_physical_indices(node, all_idx)
        indices = sorted(set(all_idx))
    if not indices:
        if node.page_index:
            return f"page {node.page_index}"
        return ""
    r = _page_range_str(indices)
    return f"pages {r}" if "–" in r else f"page {r}"


def _collect_physical_indices(node: TreeNode, acc: list[int]) -> None:
    for text in (node.content_full, node.content_summary):
        acc.extend(_extract_physical_indices(text))
    for child in node.children:
        _collect_physical_indices(child, acc)


def print_tree(node: TreeNode, indent: int = 0, max_depth: int = 4) -> None:
    if indent // 2 > max_depth:
        return
    prefix = "  " * indent
    label = node.heading[:80]
    chars = f"({node.char_count:,} chars)" if node.char_count else ""
    info = f"[{len(node.children)} children]" if node.children else "[leaf]"
    page_range = _node_page_range(node)
    parts = [p for p in [chars, info, page_range] if p]
    print(f"{prefix}{label}  {'  '.join(parts)}")
    for child in node.children:
        print_tree(child, indent + 2, max_depth)


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main() -> None:
    parser = argparse.ArgumentParser(
        description="Fetch PageIndex tree and build local tree index"
    )
    parser.add_argument(
        "--tickers", nargs="+",
        help="Tickers to fetch (default: all from PageIndex manifest)",
    )
    parser.add_argument(
        "--pi-manifest", type=Path, default=DEFAULT_PI_MANIFEST,
        help="PageIndex manifest with doc_ids",
    )
    parser.add_argument(
        "--output-dir", type=Path, default=DEFAULT_OUTPUT_DIR,
        help="Output directory for tree JSON files",
    )
    parser.add_argument(
        "--api-key", default=os.getenv("PAGEINDEX_API_KEY", ""),
        help="PageIndex API key (default: PAGEINDEX_API_KEY env var)",
    )
    parser.add_argument(
        "--base-url", default=os.getenv("PAGEINDEX_BASE_URL", DEFAULT_BASE_URL),
        help="PageIndex base URL",
    )
    parser.add_argument(
        "--force", action="store_true",
        help="Overwrite existing tree files",
    )
    parser.add_argument(
        "--stats", action="store_true",
        help="Print tree statistics",
    )
    parser.add_argument(
        "--print-tree", action="store_true",
        help="Pretty-print the tree structure with page ranges",
    )
    parser.add_argument(
        "--dump-raw", type=Path, default=None, metavar="PATH",
        help="Save raw PageIndex JSON response to PATH before processing. "
             "Useful for inspecting the raw node structure returned by the API.",
    )
    args = parser.parse_args()

    if not args.api_key:
        print("ERROR: No API key. Set PAGEINDEX_API_KEY or pass --api-key.")
        sys.exit(1)

    if not args.pi_manifest.exists():
        print(f"ERROR: PageIndex manifest not found: {args.pi_manifest}")
        print("Run: python scripts/index_pageindex_documents.py --tickers ...")
        sys.exit(1)

    manifest = json.loads(args.pi_manifest.read_text())
    records = manifest.get("records", [])

    if args.tickers:
        filter_set = {t.upper() for t in args.tickers}
        records = [r for r in records if r["ticker"].upper() in filter_set]

    # Only process records that have a doc_id (successfully submitted).
    records = [r for r in records if r.get("doc_id")]

    if not records:
        print("ERROR: No records with doc_ids found.")
        sys.exit(1)

    args.output_dir.mkdir(parents=True, exist_ok=True)

    print(f"Output dir : {args.output_dir}")
    print(f"Tickers    : {[r['ticker'] for r in records]}")
    print()

    for record in records:
        ticker = record["ticker"].upper()
        doc_id = record["doc_id"]

        out_path = args.output_dir / f"{ticker}_tree.json"
        if out_path.exists() and not args.force and not args.dump_raw:
            print(f"  [{ticker}] Already exists: {out_path.name}. Use --force to overwrite.")
            continue

        print(f"  [{ticker}] Fetching tree from PageIndex (doc_id={doc_id}) ...")
        try:
            pi_result, raw_response = fetch_pageindex_tree(args.base_url, args.api_key, doc_id)
        except RuntimeError as exc:
            print(f"  [{ticker}] ERROR: {exc}")
            continue

        # --- Dump raw response if requested ---
        if args.dump_raw:
            dump_path = Path(str(args.dump_raw).replace("{ticker}", ticker).replace("{TICKER}", ticker))
            dump_path.parent.mkdir(parents=True, exist_ok=True)
            dump_path.write_text(json.dumps(raw_response, indent=2, ensure_ascii=False), encoding="utf-8")
            print(f"  [{ticker}] Raw response saved: {dump_path} "
                  f"({len(pi_result)} top-level nodes, "
                  f"{dump_path.stat().st_size:,} bytes)")

        # Skip building the tree if we're only dumping.
        if out_path.exists() and not args.force:
            print(f"  [{ticker}] Skipping tree build (use --force to overwrite).")
            continue

        tree = build_tree_from_pageindex(ticker, pi_result)

        stats = _tree_stats(tree)
        output = {
            "ticker": ticker,
            "doc_id": doc_id,
            "source": "pageindex",
            "tree": tree.to_dict(),
            "stats": {
                "total_nodes": stats["total_nodes"],
                "leaf_nodes": stats["leaf_nodes"],
                "max_depth": stats["max_depth"],
                "total_chars": stats["total_chars"],
                "level_counts": {str(k): v for k, v in sorted(stats["level_counts"].items())},
            },
        }
        out_path.write_text(json.dumps(output, indent=2, ensure_ascii=False), encoding="utf-8")
        print(f"  [{ticker}] Wrote {out_path.name}: {stats['total_nodes']} nodes, "
              f"{stats['leaf_nodes']} leaves, depth {stats['max_depth']}")

        if args.stats:
            print(f"           Chars: {stats['total_chars']:,}")
            print(f"           Levels: {stats['level_counts']}")

        if args.print_tree:
            print()
            print_tree(tree)
            print()

    print("\nDone.")


if __name__ == "__main__":
    main()
