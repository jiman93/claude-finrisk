# Tree Quality Gate

Use this gate before scaling ingestion to additional tickers.

It runs:

1. Structural tree checks
2. Optional retrieval eval check (pass-rate threshold)

## Command

```bash
python scripts/tree_quality_gate.py \
  --ticker AAPL \
  --eval data/evals/aapl_tree_available_eval_v1.json \
  --top-k 5 \
  --pass-rate-threshold 0.8
```

## What it checks

- `required_headings`
- `item1a_child_count`
- `physical_index_continuity`
- `page_index_gap`
- `retrieval_eval` (only when `--eval` is provided)

## Output

- JSON report: `data/evals/reports/<TICKER>_quality_gate_<timestamp>.json`
- Eval run details (if eval used): `data/evals/results/*_gate_<timestamp>.json`

Exit code:

- `0` when all checks pass
- `1` when any check fails
