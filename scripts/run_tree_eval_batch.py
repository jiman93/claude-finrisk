#!/usr/bin/env python3
"""Run retrieval for all queries in an eval set and save results JSON."""

from __future__ import annotations

import argparse
import json
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


PROJECT_ROOT = Path(__file__).resolve().parents[1]
BACKEND_SRC = PROJECT_ROOT / "src" / "backend"
if str(BACKEND_SRC) not in sys.path:
    sys.path.insert(0, str(BACKEND_SRC))

from app.services.chroma_service import ChromaService, ChromaServiceError
from app.services.pageindex_service import PageIndexError, PageIndexService
from app.services.tree_service import TreeRetrievalService, TreeServiceError


def run_query(mode: str, ticker: str, query: str):
    if mode == "tree":
        service = TreeRetrievalService()
        return service.retrieve(ticker=ticker, query=query)
    if mode == "local":
        service = ChromaService()
        return service.retrieve(ticker=ticker, query=query)
    if mode == "pageindex":
        service = PageIndexService()
        return service.retrieve(ticker=ticker, query=query)
    raise ValueError(f"Unsupported mode: {mode}")


def main() -> int:
    parser = argparse.ArgumentParser(description="Run retrieval over eval cases.")
    parser.add_argument(
        "--eval",
        default=str(PROJECT_ROOT / "data" / "evals" / "aapl_tree_available_eval_v1.json"),
        help="Path to eval JSON file.",
    )
    parser.add_argument(
        "--output",
        default="",
        help="Output results JSON path. Defaults to data/evals/results/<name>_<mode>_<timestamp>.json",
    )
    parser.add_argument(
        "--mode",
        choices=["tree", "local", "pageindex"],
        default="tree",
        help="Retrieval backend to run.",
    )
    parser.add_argument(
        "--top-k",
        type=int,
        default=8,
        help="Keep at most top-k returned nodes per query in saved output.",
    )
    parser.add_argument(
        "--include-unscored",
        action="store_true",
        help="Also run cases marked with scored=false.",
    )
    parser.add_argument(
        "--sleep-ms",
        type=int,
        default=0,
        help="Optional delay between queries.",
    )
    args = parser.parse_args()

    eval_path = Path(args.eval)
    eval_obj = json.loads(eval_path.read_text(encoding="utf-8"))
    ticker = str(eval_obj.get("ticker", "AAPL")).upper()
    dataset_name = str(eval_obj.get("dataset_name", eval_path.stem))
    cases = eval_obj.get("cases", [])

    run_cases = []
    for case in cases:
        if not args.include_unscored and bool(case.get("scored", True)) is False:
            continue
        run_cases.append(case)

    if args.output:
        output_path = Path(args.output)
    else:
        stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
        output_dir = PROJECT_ROOT / "data" / "evals" / "results"
        output_dir.mkdir(parents=True, exist_ok=True)
        output_path = output_dir / f"{dataset_name}_{args.mode}_{stamp}.json"

    runs: list[dict[str, Any]] = []

    print(f"[INFO] dataset={dataset_name} ticker={ticker} mode={args.mode} cases={len(run_cases)}")
    for idx, case in enumerate(run_cases, start=1):
        case_id = str(case.get("id", "")).strip()
        query = str(case.get("query", "")).strip()
        print(f"[{idx}/{len(run_cases)}] {case_id}: {query}")

        started = time.time()
        try:
            result = run_query(args.mode, ticker, query)
            elapsed_ms = int((time.time() - started) * 1000)

            nodes = list(result.nodes or [])[: args.top_k]
            node_ids = [str(n.node_id) for n in nodes]
            run = {
                "id": case_id,
                "query": query,
                "status": "ok",
                "elapsed_ms": elapsed_ms,
                "retrieval_id": str(result.retrieval_id),
                "retrieval_mode": str(result.retrieval_mode),
                "retrieved_node_ids": node_ids,
                "retrieved_nodes": [
                    {
                        "node_id": str(n.node_id),
                        "title": str(n.title),
                        "page_index": int(n.page_index),
                    }
                    for n in nodes
                ],
            }
        except (TreeServiceError, ChromaServiceError, PageIndexError, Exception) as exc:
            elapsed_ms = int((time.time() - started) * 1000)
            run = {
                "id": case_id,
                "query": query,
                "status": "error",
                "elapsed_ms": elapsed_ms,
                "error": str(exc),
                "retrieved_node_ids": [],
                "retrieved_nodes": [],
            }
            print(f"  [ERROR] {exc}")

        runs.append(run)

        if args.sleep_ms > 0:
            time.sleep(args.sleep_ms / 1000.0)

    results_obj = {
        "dataset_name": dataset_name,
        "ticker": ticker,
        "mode": args.mode,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "runs": runs,
    }
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(results_obj, indent=2), encoding="utf-8")

    ok = len([r for r in runs if r.get("status") == "ok"])
    err = len(runs) - ok
    print(f"[DONE] wrote {output_path}")
    print(f"[DONE] ok={ok} error={err}")
    return 0 if err == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
