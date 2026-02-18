#!/usr/bin/env python3
"""Tree index quality gate: structural checks + optional retrieval eval."""

from __future__ import annotations

import argparse
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


PROJECT_ROOT = Path(__file__).resolve().parents[1]
BACKEND_SRC = PROJECT_ROOT / "src" / "backend"
if str(BACKEND_SRC) not in sys.path:
    sys.path.insert(0, str(BACKEND_SRC))

from app.services.tree_service import TreeRetrievalService, load_tree


PHYSICAL_INDEX_RE = re.compile(r"<physical_index_(\d+)>")


def _walk_nodes(tree: dict) -> list[dict]:
    nodes: list[dict] = []

    def walk(node: dict) -> None:
        nodes.append(node)
        for child in node.get("children", []) or []:
            walk(child)

    walk(tree)
    return nodes


def _normalize_node_id(node_id: str) -> str:
    return str(node_id).split(":", 1)[0].strip()


def structural_checks(
    tree: dict,
    *,
    min_item1a_children: int,
    max_missing_physical_ratio: float,
    max_consecutive_missing_physical: int,
    max_page_index_gap: int,
) -> list[dict[str, Any]]:
    nodes = _walk_nodes(tree)
    headings = [str(n.get("heading") or "") for n in nodes]

    checks: list[dict[str, Any]] = []

    # Check required top sections.
    required_patterns = [
        r"^Item 1\. Business$",
        r"^Item 1A\. Risk Factors$",
        r"^Item 7\.",
        r"^Item 8\.",
    ]
    missing_patterns = []
    for pattern in required_patterns:
        if not any(re.search(pattern, h, flags=re.IGNORECASE) for h in headings):
            missing_patterns.append(pattern)
    checks.append(
        {
            "name": "required_headings",
            "passed": len(missing_patterns) == 0,
            "missing_patterns": missing_patterns,
        }
    )

    # Item 1A child richness.
    item1a = next(
        (n for n in nodes if str(n.get("heading") or "").strip().lower() == "item 1a. risk factors"),
        None,
    )
    item1a_child_count = len(item1a.get("children", []) or []) if item1a else 0
    checks.append(
        {
            "name": "item1a_child_count",
            "passed": item1a is not None and item1a_child_count >= min_item1a_children,
            "item1a_found": item1a is not None,
            "item1a_child_count": item1a_child_count,
            "minimum_required": min_item1a_children,
        }
    )

    # physical_index continuity.
    physical_indices: set[int] = set()
    for node in nodes:
        for field in ("content_summary", "content_full"):
            value = str(node.get(field) or "")
            for m in PHYSICAL_INDEX_RE.finditer(value):
                physical_indices.add(int(m.group(1)))

    if not physical_indices:
        checks.append(
            {
                "name": "physical_index_continuity",
                "passed": False,
                "reason": "no_physical_indices_found",
            }
        )
    else:
        min_idx = min(physical_indices)
        max_idx = max(physical_indices)
        expected = set(range(min_idx, max_idx + 1))
        missing = sorted(expected - physical_indices)
        missing_ratio = len(missing) / max(1, len(expected))

        max_consecutive = 0
        current_run = 0
        for i in range(min_idx, max_idx + 1):
            if i in physical_indices:
                current_run = 0
            else:
                current_run += 1
                max_consecutive = max(max_consecutive, current_run)

        checks.append(
            {
                "name": "physical_index_continuity",
                "passed": (
                    missing_ratio <= max_missing_physical_ratio
                    and max_consecutive <= max_consecutive_missing_physical
                ),
                "min_index": min_idx,
                "max_index": max_idx,
                "missing_count": len(missing),
                "missing_ratio": round(missing_ratio, 4),
                "max_consecutive_missing": max_consecutive,
                "max_missing_ratio_allowed": max_missing_physical_ratio,
                "max_consecutive_missing_allowed": max_consecutive_missing_physical,
                "missing_preview": missing[:20],
            }
        )

    # page_index continuity.
    page_indices = sorted(
        {
            int(n.get("page_index"))
            for n in nodes
            if n.get("page_index") is not None and str(n.get("page_index")).isdigit()
        }
    )
    large_gaps: list[tuple[int, int, int]] = []
    for left, right in zip(page_indices, page_indices[1:]):
        gap = right - left
        if gap > max_page_index_gap:
            large_gaps.append((left, right, gap))
    checks.append(
        {
            "name": "page_index_gap",
            "passed": len(large_gaps) == 0,
            "max_gap_allowed": max_page_index_gap,
            "gap_count": len(large_gaps),
            "gaps": large_gaps[:20],
        }
    )

    return checks


def run_eval(
    *,
    ticker: str,
    eval_path: Path,
    top_k: int,
    pass_rate_threshold: float,
    include_unscored: bool,
    results_path: Path,
) -> tuple[dict[str, Any], list[dict[str, Any]]]:
    eval_obj = json.loads(eval_path.read_text(encoding="utf-8"))
    cases = list(eval_obj.get("cases", []))
    service = TreeRetrievalService()

    runs: list[dict[str, Any]] = []
    for case in cases:
        if not include_unscored and bool(case.get("scored", True)) is False:
            continue
        case_id = str(case.get("id", "")).strip()
        query = str(case.get("query", "")).strip()
        try:
            result = service.retrieve(ticker=ticker, query=query)
            node_ids = [_normalize_node_id(n.node_id) for n in result.nodes[:top_k]]
            runs.append(
                {
                    "id": case_id,
                    "query": query,
                    "status": "ok",
                    "retrieved_node_ids": node_ids,
                }
            )
        except Exception as exc:  # pragma: no cover - external API path
            runs.append(
                {
                    "id": case_id,
                    "query": query,
                    "status": "error",
                    "error": str(exc),
                    "retrieved_node_ids": [],
                }
            )

    results_obj = {
        "dataset_name": eval_obj.get("dataset_name", eval_path.stem),
        "ticker": ticker,
        "mode": "tree",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "runs": runs,
    }
    results_path.parent.mkdir(parents=True, exist_ok=True)
    results_path.write_text(json.dumps(results_obj, indent=2), encoding="utf-8")

    by_id = {str(r.get("id")): [_normalize_node_id(x) for x in r.get("retrieved_node_ids", [])] for r in runs}

    scored_total = 0
    pass_total = 0
    should_hits = 0
    should_total = 0
    error_count = 0
    case_rows: list[dict[str, Any]] = []

    for case in cases:
        if not include_unscored and bool(case.get("scored", True)) is False:
            continue
        case_id = str(case.get("id", "")).strip()
        scored = bool(case.get("scored", True))
        retrieved = by_id.get(case_id, [])
        retrieved_set = set(retrieved[:top_k])

        must = [_normalize_node_id(x) for x in case.get("must_include_any", [])]
        should = [_normalize_node_id(x) for x in case.get("should_include_any", [])]
        excl = [_normalize_node_id(x) for x in case.get("must_exclude_all", [])]

        must_ok = (not must) or any(x in retrieved_set for x in must)
        excl_ok = all(x not in retrieved_set for x in excl)
        should_hit = sum(1 for x in should if x in retrieved_set)
        status = next((r.get("status") for r in runs if r.get("id") == case_id), "missing")
        if status != "ok":
            error_count += 1

        if scored:
            scored_total += 1
            should_hits += should_hit
            should_total += len(should)
            if must_ok and excl_ok:
                pass_total += 1

        case_rows.append(
            {
                "id": case_id,
                "scored": scored,
                "status": status,
                "passed": must_ok and excl_ok if scored else None,
                "must_ok": must_ok,
                "excl_ok": excl_ok,
                "should_hits": should_hit,
                "should_total": len(should),
                "retrieved": retrieved[:top_k],
            }
        )

    pass_rate = (pass_total / scored_total) if scored_total else 0.0
    eval_check = {
        "name": "retrieval_eval",
        "passed": pass_rate >= pass_rate_threshold and error_count == 0,
        "pass_rate": round(pass_rate, 4),
        "pass_count": pass_total,
        "scored_count": scored_total,
        "pass_rate_threshold": pass_rate_threshold,
        "should_hit_coverage": round((should_hits / should_total), 4) if should_total else None,
        "error_count": error_count,
        "results_path": str(results_path),
    }
    return eval_check, case_rows


def main() -> int:
    parser = argparse.ArgumentParser(description="Run structural + retrieval quality checks for a tree index.")
    parser.add_argument("--ticker", required=True, help="Ticker symbol, e.g. AAPL.")
    parser.add_argument(
        "--tree",
        default="",
        help="Optional explicit path to tree JSON (default: data/tree_index/<TICKER>_tree.json).",
    )
    parser.add_argument(
        "--eval",
        default="",
        help="Optional eval file path. If provided, retrieval eval is executed.",
    )
    parser.add_argument("--top-k", type=int, default=5, help="Top-k cutoff for eval scoring.")
    parser.add_argument("--pass-rate-threshold", type=float, default=0.8, help="Minimum eval pass rate.")
    parser.add_argument(
        "--min-item1a-children",
        type=int,
        default=4,
        help="Minimum expected number of Item 1A child sections.",
    )
    parser.add_argument(
        "--max-missing-physical-ratio",
        type=float,
        default=0.05,
        help="Maximum allowed missing ratio in physical_index range.",
    )
    parser.add_argument(
        "--max-consecutive-missing-physical",
        type=int,
        default=3,
        help="Maximum allowed consecutive missing physical_index values.",
    )
    parser.add_argument(
        "--max-page-index-gap",
        type=int,
        default=5,
        help="Maximum allowed gap between consecutive node page_index values.",
    )
    parser.add_argument(
        "--include-unscored",
        action="store_true",
        help="Include eval cases marked scored=false.",
    )
    parser.add_argument(
        "--report",
        default="",
        help="Optional path for JSON report output.",
    )
    args = parser.parse_args()

    ticker = args.ticker.upper().strip()
    tree_path = (
        Path(args.tree)
        if args.tree
        else PROJECT_ROOT / "data" / "tree_index" / f"{ticker}_tree.json"
    )

    if not tree_path.exists():
        print(f"[FAIL] tree file not found: {tree_path}")
        return 1

    tree = load_tree(ticker, tree_path.parent)

    checks = structural_checks(
        tree,
        min_item1a_children=args.min_item1a_children,
        max_missing_physical_ratio=args.max_missing_physical_ratio,
        max_consecutive_missing_physical=args.max_consecutive_missing_physical,
        max_page_index_gap=args.max_page_index_gap,
    )
    case_rows: list[dict[str, Any]] = []

    if args.eval:
        eval_path = Path(args.eval)
        stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
        results_path = PROJECT_ROOT / "data" / "evals" / "results" / f"{eval_path.stem}_{ticker}_gate_{stamp}.json"
        eval_check, case_rows = run_eval(
            ticker=ticker,
            eval_path=eval_path,
            top_k=args.top_k,
            pass_rate_threshold=args.pass_rate_threshold,
            include_unscored=args.include_unscored,
            results_path=results_path,
        )
        checks.append(eval_check)

    overall_pass = all(bool(c.get("passed")) for c in checks)
    report = {
        "ticker": ticker,
        "tree_path": str(tree_path),
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "overall_pass": overall_pass,
        "checks": checks,
        "eval_cases": case_rows,
    }

    if args.report:
        report_path = Path(args.report)
    else:
        stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
        report_path = PROJECT_ROOT / "data" / "evals" / "reports" / f"{ticker}_quality_gate_{stamp}.json"
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text(json.dumps(report, indent=2), encoding="utf-8")

    print(f"[REPORT] {report_path}")
    for check in checks:
        status = "PASS" if check.get("passed") else "FAIL"
        print(f"[{status}] {check.get('name')}")
    print(f"[OVERALL] {'PASS' if overall_pass else 'FAIL'}")

    return 0 if overall_pass else 1


if __name__ == "__main__":
    raise SystemExit(main())
