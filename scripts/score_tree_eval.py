#!/usr/bin/env python3
"""Score retrieval outputs against a tree-retrieval eval set.

Supported result formats:
1) {"runs": [{"id": "...", "retrieved_node_ids": ["0003", ...]}]}
2) {"AAPL_AVAIL_001": ["0003", "0038"], ...}
3) [{"id": "...", "retrieved_nodes": [{"node_id": "0003"}, ...]}, ...]
4) [{"query": "...", "retrieved_node_ids": [...]}, ...]  # fallback by query text
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any


def normalize_node_id(node_id: str) -> str:
    return str(node_id).split(":", 1)[0].strip()


def dedupe_preserve_order(items: list[str]) -> list[str]:
    out: list[str] = []
    seen: set[str] = set()
    for item in items:
        if item in seen:
            continue
        seen.add(item)
        out.append(item)
    return out


def extract_node_ids_from_run(run: dict[str, Any]) -> list[str]:
    raw = run.get("retrieved_node_ids")
    if isinstance(raw, list):
        return [normalize_node_id(x) for x in raw if str(x).strip()]

    raw = run.get("node_ids")
    if isinstance(raw, list):
        return [normalize_node_id(x) for x in raw if str(x).strip()]

    nodes = run.get("retrieved_nodes")
    if isinstance(nodes, list):
        out: list[str] = []
        for node in nodes:
            if isinstance(node, dict) and node.get("node_id"):
                out.append(normalize_node_id(node["node_id"]))
        return out

    return []


def load_results_index(results_obj: Any) -> tuple[dict[str, list[str]], dict[str, list[str]]]:
    """Return two indexes: by case-id and by query text."""
    by_id: dict[str, list[str]] = {}
    by_query: dict[str, list[str]] = {}

    if isinstance(results_obj, dict):
        runs = results_obj.get("runs")
        if isinstance(runs, list):
            for run in runs:
                if not isinstance(run, dict):
                    continue
                node_ids = extract_node_ids_from_run(run)
                case_id = str(run.get("id") or "").strip()
                query = str(run.get("query") or "").strip()
                if case_id:
                    by_id[case_id] = dedupe_preserve_order(node_ids)
                if query:
                    by_query[query] = dedupe_preserve_order(node_ids)
            return by_id, by_query

        # Map-style: {"CASE_ID": ["0003", ...], ...}
        map_style_ok = all(isinstance(v, list) for v in results_obj.values())
        if map_style_ok:
            for key, value in results_obj.items():
                node_ids = [normalize_node_id(x) for x in value if str(x).strip()]
                by_id[str(key)] = dedupe_preserve_order(node_ids)
            return by_id, by_query

    if isinstance(results_obj, list):
        for run in results_obj:
            if not isinstance(run, dict):
                continue
            node_ids = extract_node_ids_from_run(run)
            case_id = str(run.get("id") or "").strip()
            query = str(run.get("query") or "").strip()
            if case_id:
                by_id[case_id] = dedupe_preserve_order(node_ids)
            if query:
                by_query[query] = dedupe_preserve_order(node_ids)
        return by_id, by_query

    return by_id, by_query


def hit_any(retrieved: set[str], targets: list[str]) -> bool:
    if not targets:
        return True
    return any(t in retrieved for t in targets)


def count_hits(retrieved: set[str], targets: list[str]) -> int:
    return sum(1 for t in targets if t in retrieved)


def main() -> int:
    parser = argparse.ArgumentParser(description="Score retrieval outputs against eval cases.")
    parser.add_argument("--eval", required=True, help="Path to eval JSON file.")
    parser.add_argument("--results", required=True, help="Path to retrieval results JSON file.")
    parser.add_argument(
        "--top-k",
        type=int,
        default=None,
        help="Override top-k cutoff for scoring (defaults to eval.default_top_k).",
    )
    args = parser.parse_args()

    eval_path = Path(args.eval)
    results_path = Path(args.results)

    eval_obj = json.loads(eval_path.read_text(encoding="utf-8"))
    results_obj = json.loads(results_path.read_text(encoding="utf-8"))

    default_top_k = int(eval_obj.get("default_top_k", 5))
    top_k = args.top_k if args.top_k is not None else default_top_k

    cases = eval_obj.get("cases", [])
    by_id, by_query = load_results_index(results_obj)

    scored_total = 0
    pass_total = 0
    should_hit_total = 0
    should_hit_max = 0
    missing_runs: list[str] = []

    print(f"Eval: {eval_obj.get('dataset_name', eval_path.name)}")
    print(f"Top-k: {top_k}")
    print("")

    for case in cases:
        case_id = str(case.get("id", "")).strip()
        query = str(case.get("query", "")).strip()
        scored = bool(case.get("scored", True))

        retrieved = by_id.get(case_id)
        if retrieved is None:
            retrieved = by_query.get(query, [])
            if not retrieved:
                missing_runs.append(case_id)

        retrieved_top = retrieved[:top_k]
        retrieved_set = set(retrieved_top)

        must_any = [normalize_node_id(x) for x in case.get("must_include_any", [])]
        should_any = [normalize_node_id(x) for x in case.get("should_include_any", [])]
        must_excl = [normalize_node_id(x) for x in case.get("must_exclude_all", [])]

        must_ok = hit_any(retrieved_set, must_any)
        excl_ok = all(x not in retrieved_set for x in must_excl)
        should_hits = count_hits(retrieved_set, should_any)

        status = "PASS" if (must_ok and excl_ok) else "FAIL"
        if not scored:
            status = "SKIP"

        if scored:
            scored_total += 1
            pass_total += 1 if (must_ok and excl_ok) else 0
            should_hit_total += should_hits
            should_hit_max += len(should_any)

        print(
            f"{case_id:14} {status:4} "
            f"must={int(must_ok)} excl={int(excl_ok)} should={should_hits}/{len(should_any)} "
            f"retrieved={retrieved_top}"
        )

    print("")
    print(f"Scored cases: {scored_total}")
    print(f"Passes: {pass_total}")
    pass_rate = (pass_total / scored_total * 100.0) if scored_total else 0.0
    print(f"Pass rate: {pass_rate:.1f}%")

    if should_hit_max:
        should_rate = should_hit_total / should_hit_max * 100.0
        print(f"Should-hit coverage: {should_hit_total}/{should_hit_max} ({should_rate:.1f}%)")
    else:
        print("Should-hit coverage: n/a")

    if missing_runs:
        print(f"Missing run entries: {len(missing_runs)} -> {missing_runs}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
