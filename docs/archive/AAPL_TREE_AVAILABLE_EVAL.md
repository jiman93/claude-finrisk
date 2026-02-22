# AAPL Tree Retrieval Eval (Available-Only)

This eval set is for scoring retrieval quality against content that is already present in:

- `data/tree_index/AAPL_tree.json`

It intentionally excludes known-missing Risk Factors detail from the headline score.

## Files

- Eval set: `data/evals/aapl_tree_available_eval_v1.json`
- Scorer: `scripts/score_tree_eval.py`

## Result File Format

Use one of these formats:

1. Object with runs:

```json
{
  "runs": [
    {
      "id": "AAPL_AVAIL_001",
      "query": "What are Apple's hardware component supply concentration risks?",
      "retrieved_node_ids": ["0003", "0038", "0010"]
    }
  ]
}
```

2. Map by case id:

```json
{
  "AAPL_AVAIL_001": ["0003", "0038", "0010"],
  "AAPL_AVAIL_002": ["0003", "0038"]
}
```

3. QueryResponse-like shape:

```json
[
  {
    "id": "AAPL_AVAIL_001",
    "retrieved_nodes": [
      { "node_id": "0003", "title": "Item 1. Business", "page_index": 4, "relevant_content": "..." }
    ]
  }
]
```

## Run Scoring

```bash
python scripts/score_tree_eval.py \
  --eval data/evals/aapl_tree_available_eval_v1.json \
  --results path/to/your_results.json
```

Optional:

```bash
python scripts/score_tree_eval.py \
  --eval data/evals/aapl_tree_available_eval_v1.json \
  --results path/to/your_results.json \
  --top-k 3
```

## Run Retrieval Batch

Generate `results.json` directly from your retriever:

```bash
python scripts/run_tree_eval_batch.py \
  --mode tree \
  --eval data/evals/aapl_tree_available_eval_v1.json \
  --top-k 5
```

Then score the generated file under `data/evals/results/`.

Requirements by mode:

- `tree`: `OPENAI_API_KEY` configured.
- `local`: `chromadb` and `sentence-transformers` installed.
- `pageindex`: `PAGEINDEX_API_KEY` and doc map configured.

## Scoring Rules

- `PASS` requires:
  - At least one `must_include_any` node appears in top-k.
  - No `must_exclude_all` node appears in top-k.
- `should_include_any` is tracked as coverage but does not control pass/fail.
- Cases with `"scored": false` are shown as `SKIP` and excluded from aggregate metrics.
