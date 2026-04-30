"""LLM-guided tree traversal retrieval service.

Navigates a pre-built 10-K document tree (PART > Item > sub-section)
using an LLM to select relevant branches at each level.  Returns the
same ``RetrievalResult`` as ChromaDB and PageIndex backends so the
downstream pipeline (HITL selector, synthesis) is unchanged.

The navigation model (o3-mini) reasons about which branches are
relevant, while the synthesis model (gpt-5.2) generates the final
answer — keeping navigation fast/cheap and synthesis high-quality.
"""

from __future__ import annotations

import json
import logging
import re
import uuid
from pathlib import Path
from typing import Any

import httpx

from app.config import PROJECT_ROOT, settings
from app.schemas.task import RetrievalNode
from app.services.pageindex_service import RetrievalResult

log = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Defaults (read from settings, with fallbacks)
# ---------------------------------------------------------------------------

DEFAULT_TREE_DIR = PROJECT_ROOT / "data" / "tree_index"

# Navigation model — fast reasoning for branch selection.
NAV_MODEL: str = settings.navigation_model
NAV_REASONING_EFFORT: str = settings.tree_nav_reasoning_effort

# Max branches the LLM can select at each traversal level.
MAX_BRANCHES_PER_LEVEL: int = settings.tree_max_branches

# Max depth to traverse (root=0, part=1, item=2, sub-section=3).
MAX_TRAVERSAL_DEPTH: int = settings.tree_max_depth

# Max total leaf nodes to return (prevents returning the whole tree).
MAX_LEAF_NODES: int = settings.tree_max_leaves

# Lightweight stop-word list for lexical fallback/reranking.
QUERY_STOPWORDS = {
    "what", "are", "is", "the", "a", "an", "and", "or", "to", "of", "for", "from",
    "on", "in", "by", "with", "how", "could", "can", "that", "this", "its", "if",
    "do", "does", "where", "why", "about", "into", "their", "near", "term",
    "apple", "apples", "risk", "risks", "summarize",
}

# Intent keyword sets used for simple query-intent boosts.
SUPPLY_TERMS = {
    "supply", "component", "components", "manufacturing", "manufactur", "outsourcing",
    "logistics", "vendor", "inventory", "shortage", "single", "source", "hardware",
}
TRADE_TERMS = {
    "import", "export", "tariff", "trade", "geopolitical", "geopolitics", "conflict",
    "terrorism", "sanction", "regulatory", "restriction", "restrictions",
}
FINANCE_TERMS = {
    "margin", "margins", "cost", "obligations", "obligation", "payable", "receivables",
    "credit", "prepayment", "prepayments", "cash", "liquidity", "payment", "payments",
    "burden",
}
GEOGRAPHY_TERMS = {"geographic", "segment", "china", "taiwan", "asia", "greater"}
STOCK_TERMS = {"stock", "volatility", "share", "price"}


# ---------------------------------------------------------------------------
# Errors
# ---------------------------------------------------------------------------

class TreeServiceError(RuntimeError):
    """Raised when tree traversal fails."""


# ---------------------------------------------------------------------------
# Tree loading
# ---------------------------------------------------------------------------

def load_tree(ticker: str, tree_dir: Path = DEFAULT_TREE_DIR) -> dict:
    """Load a ticker's tree JSON from disk."""
    path = tree_dir / f"{ticker.upper()}_tree.json"
    if not path.exists():
        raise TreeServiceError(
            f"No tree index found for {ticker}. "
            f"Expected: {path}\n"
            f"Run: python scripts/build_tree_index.py --tickers {ticker}"
        )
    data = json.loads(path.read_text(encoding="utf-8"))
    tree = data.get("tree")
    if not tree:
        raise TreeServiceError(f"Tree file for {ticker} has no 'tree' key")
    return tree


# ---------------------------------------------------------------------------
# LLM navigation call
# ---------------------------------------------------------------------------

def _build_nav_prompt(query: str, children: list[dict]) -> tuple[str, str]:
    """Build system + user prompts for a single navigation step.

    Returns (system_prompt, user_prompt).
    """
    system_prompt = (
        "You are navigating a SEC 10-K filing to find sections relevant to "
        "the user's question. You will be shown a list of document sections "
        "with their headings, summaries and sizes.\n\n"
        "Select 1-3 sections most likely to contain the answer. "
        "Return a JSON object with a single key \"selected\" containing "
        "an array of node_id strings. Example: {\"selected\": [\"id1\", \"id2\"]}\n\n"
        "Selection guidelines:\n"
        "- Prefer sections whose headings or summaries directly relate to the query\n"
        "- Consider section size — larger sections are more likely to contain detail\n"
        "- If the query spans multiple topics, select sections covering each topic\n"
        "- If unsure, include more sections rather than fewer"
    )

    section_lines = []
    for child in children:
        node_id = child.get("node_id", "")
        heading = child.get("heading", "")
        char_count = child.get("char_count", 0)
        summary = child.get("content_summary", "")

        # Truncate summary to avoid bloating the prompt.
        if len(summary) > 300:
            summary = summary[:300] + "..."

        # Clean physical_index tags from summaries for cleaner LLM input.
        summary = re.sub(r"<physical_index_\d+>", "", summary).strip()

        section_lines.append(
            f"- node_id: \"{node_id}\"\n"
            f"  heading: \"{heading}\"\n"
            f"  size: {char_count:,} chars\n"
            f"  summary: {summary}"
        )

    sections_text = "\n\n".join(section_lines)

    user_prompt = (
        f"User question: {query}\n\n"
        f"Available sections:\n\n{sections_text}"
    )

    return system_prompt, user_prompt


def _call_nav_llm(
    query: str,
    children: list[dict],
    api_key: str,
    base_url: str,
) -> tuple[list[str], dict]:
    """Call the navigation LLM to select branches.

    Returns a tuple of (selected_node_ids, metrics_dict).
    """
    if not children:
        return [], {}

    system_prompt, user_prompt = _build_nav_prompt(query, children)

    payload: dict[str, Any] = {
        "model": NAV_MODEL,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "response_format": {"type": "json_object"},
    }

    # o3-mini supports reasoning_effort parameter.
    if NAV_MODEL.startswith("o3"):
        payload["reasoning_effort"] = NAV_REASONING_EFFORT
    else:
        payload["temperature"] = 0.0

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    import time as _time
    t0 = _time.time()
    try:
        with httpx.Client(timeout=30) as client:
            resp = client.post(
                f"{base_url.rstrip('/')}/chat/completions",
                json=payload,
                headers=headers,
            )
            resp.raise_for_status()
            data = resp.json()
    except httpx.HTTPError as exc:
        raise TreeServiceError(f"Navigation LLM call failed: {exc}") from exc
    duration_ms = int((_time.time() - t0) * 1000)

    usage = data.get("usage", {})
    metrics = {
        "prompt_tokens": usage.get("prompt_tokens", 0),
        "completion_tokens": usage.get("completion_tokens", 0),
        "duration_ms": duration_ms,
        "model": NAV_MODEL,
    }

    # Parse the response.
    choices = data.get("choices", [])
    if not choices:
        raise TreeServiceError("Navigation LLM returned no choices")

    content = choices[0].get("message", {}).get("content", "")
    if not content:
        raise TreeServiceError("Navigation LLM returned empty content")

    try:
        parsed = json.loads(content)
        selected = parsed.get("selected", [])
    except (json.JSONDecodeError, AttributeError):
        # Fallback: try to extract node_ids from the raw text.
        log.warning("Failed to parse nav LLM JSON, attempting fallback extraction")
        selected = _extract_node_ids_fallback(content, children)

    # Validate: only keep node_ids that actually exist in children.
    valid_ids = {c["node_id"] for c in children}
    selected = [nid for nid in selected if nid in valid_ids]

    # Enforce max branches.
    return selected[:MAX_BRANCHES_PER_LEVEL], metrics


def _extract_node_ids_fallback(text: str, children: list[dict]) -> list[str]:
    """Best-effort extraction of node_ids from LLM text when JSON parsing fails."""
    found = []
    for child in children:
        nid = child.get("node_id", "")
        if nid and nid in text:
            found.append(nid)
    return found


# ---------------------------------------------------------------------------
# Tree traversal
# ---------------------------------------------------------------------------

def _tokenize_query(query: str) -> set[str]:
    """Return normalized, low-noise query tokens for lexical scoring."""
    raw = re.findall(r"[a-z0-9]+", query.lower())
    tokens = {t for t in raw if len(t) >= 3 and t not in QUERY_STOPWORDS}

    # Add lightweight stems for common inflections.
    if any(t.startswith("manufactur") for t in tokens):
        tokens.add("manufactur")
    if any(t.startswith("obligation") for t in tokens):
        tokens.add("obligation")

    return tokens


def _iter_content_nodes(node: dict) -> list[dict]:
    """Collect nodes that contain content (summary/full) and are section-level or deeper."""
    out: list[dict] = []

    def walk(n: dict) -> None:
        level = int(n.get("level", 99) or 99)
        has_content = bool(n.get("content_full") or n.get("content_summary"))
        if level >= 2 and has_content:
            out.append(n)
        for child in n.get("children", []) or []:
            walk(child)

    walk(node)
    return out


def _rank_nodes_for_query(
    query: str,
    candidates: list[dict],
    traversed_leaf_ids: set[str],
    top_k: int,
) -> list[dict]:
    """Rank nodes using lexical relevance + intent-aware heading boosts."""
    tokens = _tokenize_query(query)
    if not tokens:
        ranked = list(candidates)
        ranked.sort(key=lambda n: int(n.get("char_count", 0) or 0), reverse=True)
        return ranked[:top_k]

    has_supply = bool(tokens & SUPPLY_TERMS)
    has_trade = bool(tokens & TRADE_TERMS)
    has_finance = bool(tokens & FINANCE_TERMS)
    has_geo = bool(tokens & GEOGRAPHY_TERMS)
    has_stock = bool(tokens & STOCK_TERMS)

    scored: list[tuple[float, dict]] = []
    for node in candidates:
        node_id = str(node.get("node_id") or "")
        if not node_id:
            continue

        heading = str(node.get("heading") or "")
        heading_l = heading.lower()
        content = str(node.get("content_summary") or "")
        if node.get("content_full"):
            content += " " + str(node.get("content_full"))[:7000]
        content_l = re.sub(r"<physical_index_\d+>", " ", content.lower())

        score = 0.0

        # Token overlap signal.
        for token in tokens:
            token_count = content_l.count(token)
            if token_count:
                score += min(token_count, 6)
            if token in heading_l:
                score += 4

        # Intent-aware heading boosts.
        if has_supply and "item 1. business" in heading_l:
            score += 10
        if has_supply and "supply concentrations" in heading_l:
            score += 12
        if has_supply and "financial risks" in heading_l:
            score += 8
        if has_supply and "management's discussion" in heading_l:
            score += 7
        if has_trade and "legal and regulatory compliance risks" in heading_l:
            score += 10
        if has_geo and "segment information and geographic data" in heading_l:
            score += 12
        if has_finance and "management's discussion" in heading_l:
            score += 11
        if has_finance and "financial risks" in heading_l:
            score += 9
        if has_stock and "general risks" in heading_l:
            score += 14

        # Penalties to avoid overly generic sections for focused intents.
        if "general risks" in heading_l and not has_stock:
            score -= 9
        if "financial risks" in heading_l and has_stock and not has_finance:
            score -= 3
        if "item 1. business" in heading_l and has_stock and not has_supply:
            score -= 8

        # Traversal retains influence but does not dominate ranking.
        if node_id in traversed_leaf_ids:
            score += 2

        # Slight preference for section/item nodes.
        if int(node.get("level", 99) or 99) == 2:
            score += 0.5

        if score > 0:
            scored.append((score, node))

    if not scored:
        ranked = list(candidates)
        ranked.sort(key=lambda n: int(n.get("char_count", 0) or 0), reverse=True)
        return ranked[:top_k]

    # Stable sort by score, then by section size.
    scored.sort(
        key=lambda pair: (
            pair[0],
            int(pair[1].get("char_count", 0) or 0),
        ),
        reverse=True,
    )

    ranked_nodes: list[dict] = []
    seen_ids: set[str] = set()
    for _, node in scored:
        node_id = str(node.get("node_id") or "")
        if not node_id or node_id in seen_ids:
            continue
        seen_ids.add(node_id)
        ranked_nodes.append(node)
        if len(ranked_nodes) >= top_k:
            break

    return ranked_nodes


def _collect_leaves(node: dict) -> list[dict]:
    """Recursively collect all leaf nodes under a given node."""
    children = node.get("children", [])
    if not children:
        return [node]
    leaves = []
    for child in children:
        leaves.extend(_collect_leaves(child))
    return leaves


def traverse_tree(
    tree: dict,
    query: str,
    api_key: str,
    base_url: str,
    max_depth: int = MAX_TRAVERSAL_DEPTH,
) -> tuple[list[dict], list[dict], list[dict]]:
    """Navigate the tree using LLM reasoning.

    Returns:
        (leaf_nodes, traversal_path, nav_metrics) where:
        - leaf_nodes: list of leaf node dicts with content
        - traversal_path: list of dicts recording each navigation step
        - nav_metrics: list of per-call LLM usage dicts
    """
    traversal_path: list[dict] = []
    nav_metrics: list[dict] = []
    current_nodes = [tree]
    depth = 0

    while depth < max_depth:
        # Gather all children across current nodes.
        all_children: list[dict] = []
        for node in current_nodes:
            all_children.extend(node.get("children", []))

        if not all_children:
            # Current nodes are all leaves — we're done.
            break

        # If all children are leaves, just return them (no need to navigate).
        if all(not c.get("children") for c in all_children):
            # Still let LLM pick which leaves are relevant.
            if len(all_children) <= MAX_LEAF_NODES:
                # Few enough to return all.
                traversal_path.append({
                    "depth": depth,
                    "action": "return_all_leaves",
                    "count": len(all_children),
                })
                return all_children, traversal_path, nav_metrics

        # Ask LLM to select branches.
        selected_ids, call_metrics = _call_nav_llm(query, all_children, api_key, base_url)
        if call_metrics:
            call_metrics["depth"] = depth
            nav_metrics.append(call_metrics)

        if not selected_ids:
            # LLM didn't select anything — fall back to first child.
            log.warning("Nav LLM selected nothing at depth %d, using first child", depth)
            selected_ids = [all_children[0]["node_id"]]

        # Record the navigation step.
        traversal_path.append({
            "depth": depth,
            "action": "select",
            "options": [c.get("heading", "") for c in all_children],
            "selected": [
                c.get("heading", "")
                for c in all_children
                if c.get("node_id") in selected_ids
            ],
        })

        # Move to selected nodes.
        id_set = set(selected_ids)
        current_nodes = [c for c in all_children if c.get("node_id") in id_set]
        depth += 1

    # Collect all leaves from the final selected nodes.
    leaves: list[dict] = []
    for node in current_nodes:
        leaves.extend(_collect_leaves(node))

    # Cap the number of leaves returned.
    if len(leaves) > MAX_LEAF_NODES:
        # Sort by char_count descending — return the meatiest sections.
        leaves.sort(key=lambda n: n.get("char_count", 0), reverse=True)
        leaves = leaves[:MAX_LEAF_NODES]

    return leaves, traversal_path, nav_metrics


# ---------------------------------------------------------------------------
# Service class
# ---------------------------------------------------------------------------

class TreeRetrievalService:
    """LLM-guided tree traversal for 10-K retrieval.

    Loads a pre-built tree JSON and uses an LLM to navigate down
    from root → PART → Item → sub-section, returning leaf content
    as ``RetrievalResult`` nodes.
    """

    def __init__(self) -> None:
        self.api_key = settings.openai_api_key
        self.base_url = settings.openai_base_url.rstrip("/")
        self.tree_dir = DEFAULT_TREE_DIR

    def has_tree(self, ticker: str) -> bool:
        """Check if a tree index exists for the given ticker."""
        path = self.tree_dir / f"{ticker.upper()}_tree.json"
        return path.exists()

    def retrieve(self, ticker: str, query: str) -> RetrievalResult:
        """Navigate the tree to find relevant content.

        Returns a ``RetrievalResult`` with leaf nodes as
        ``RetrievalNode`` objects, compatible with the existing
        retrieval pipeline.
        """
        if not self.api_key:
            raise TreeServiceError("OPENAI_API_KEY is not configured")

        tree = load_tree(ticker, self.tree_dir)
        all_nav_metrics: list[dict] = []
        try:
            leaves, path, nav_metrics = traverse_tree(
                tree=tree,
                query=query,
                api_key=self.api_key,
                base_url=self.base_url,
            )
            all_nav_metrics = nav_metrics
        except TreeServiceError as exc:
            # Degrade gracefully: still return best-effort lexical ranking.
            log.warning("Tree traversal failed for %s, using lexical fallback: %s", ticker, exc)
            leaves = []
            path = [{"depth": 0, "action": "fallback_lexical", "reason": str(exc)}]

        # Hybrid ranking: preserve traversal signal but re-rank against the full tree.
        traversed_leaf_ids = {str(n.get("node_id") or "") for n in leaves if n.get("node_id")}
        content_nodes = _iter_content_nodes(tree)
        ranked_nodes = _rank_nodes_for_query(
            query=query,
            candidates=content_nodes,
            traversed_leaf_ids=traversed_leaf_ids,
            top_k=MAX_LEAF_NODES,
        )
        if not ranked_nodes:
            ranked_nodes = leaves

        path.append(
            {
                "depth": len(path),
                "action": "hybrid_rank",
                "count": len(ranked_nodes),
                "selected": [n.get("heading", "") for n in ranked_nodes[:5]],
            }
        )

        # Convert leaves to RetrievalNode objects.
        nodes: list[RetrievalNode] = []
        for leaf in ranked_nodes:
            content = leaf.get("content_full", "") or leaf.get("content_summary", "")
            if not content:
                continue

            # Strip physical_index tags from content for cleaner output.
            content = re.sub(r"<physical_index_\d+>", "", content).strip()

            # Skip heading-only stubs with insufficient content.
            clean_for_len = re.sub(r"^#{1,6}\s+.*$", "", content, flags=re.MULTILINE).strip()
            if len(clean_for_len) < 150:
                continue

            leaf_node_id = leaf.get("node_id", f"{ticker}-{len(nodes):03d}")
            nodes.append(
                RetrievalNode(
                    node_id=leaf_node_id,
                    title=leaf.get("heading", "Untitled"),
                    page_index=int(leaf.get("page_index", 0)),
                    relevant_content=content,
                    from_traversal=leaf_node_id in traversed_leaf_ids,
                )
            )

        retrieval_id = f"tr-tree-{uuid.uuid4().hex[:18]}"

        log.info(
            "Tree traversal for %s: %d nodes returned, path: %s",
            ticker,
            len(nodes),
            " > ".join(
                step.get("selected", ["?"])[0] if step.get("selected") else "?"
                for step in path
                if step.get("action") == "select"
            ),
        )

        return RetrievalResult(
            retrieval_id=retrieval_id,
            nodes=nodes,
            retrieval_mode="tree",
            traversal_path=path,
            nav_metrics=all_nav_metrics or None,
        )
