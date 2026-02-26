# Replacing PageIndex Ingestion with Docling

## Why

PageIndex is used for two distinct jobs in this project:

1. **Ingestion** — parsing a 10-K PDF into a structured node tree (`build_tree_index.py`)
2. **Retrieval** — querying nodes at runtime (`pageindex` mode in `retrieval_service.py`)

The retrieval endpoint has never worked (provider-side `retrieval_ready: false`). The tree-based traversal (`tree` mode) was built specifically because of this. **Retrieval mode `pageindex` is already effectively dead.**

The ingestion endpoint (`GET /doc/{doc_id}/?type=tree`) does work, but it requires:
- Uploading PDFs to a third-party cloud service
- A paid API key
- PageIndex-specific document IDs tracked in a manifest file

[Docling](https://github.com/DS4SD/docling) (IBM open-source, released 2024) can replace this step entirely with local PDF parsing. **Only one function (~25 lines) in `build_tree_index.py` needs to be replaced.**

---

## What Does Not Change

Everything downstream of `fetch_pageindex_tree()` is reused unchanged:

| Component | Status |
|---|---|
| `build_tree_from_pageindex()` | Unchanged — PART/ITEM hierarchy construction |
| `_flatten_pi_nodes()` | Unchanged — flattening nested node tree |
| `parse_toc_from_text()` | Unchanged — TOC-based Item discovery |
| Leaf splitting (5K char threshold) | Unchanged |
| Heading disambiguation | Unchanged |
| Min-content pruning (150 chars) | Unchanged |
| `tree_service.py` (LLM traversal) | Unchanged |
| `retrieval_service.py` | Unchanged |
| All tree JSON output format | Unchanged (except `"source": "docling"`) |
| `audit_chunk_quality.py` | Unchanged — works on tree JSON |

The only difference: instead of fetching a pre-parsed tree from the PageIndex cloud, we parse the PDF locally and produce the same `{title, node_id, page_index, text, nodes:[…]}` list that the downstream pipeline expects.

---

## What Changes

### Before (PageIndex path)

```
PDF → (uploaded to PageIndex) → API call GET /doc/{id}/?type=tree → JSON tree
```

### After (docling path)

```
PDF → docling.DocumentConverter → DoclingDocument → JSON tree (same format)
```

**Only one function is replaced:**

| | Old | New |
|---|---|---|
| Script | `build_tree_index.py` | `build_tree_index_docling.py` |
| Entry point | `fetch_pageindex_tree(base_url, api_key, doc_id)` | `fetch_docling_tree(pdf_path)` |
| API key needed | Yes (PAGEINDEX_API_KEY) | No |
| Internet needed | Yes | No |
| Manifest file needed | Yes (pageindex_index_manifest.json) | No |
| Upstream PDFs needed | No (already on cloud) | Yes (data/10k_pdfs/) |

---

## Test Plan

### Step 1 — Install docling

```bash
cd c:/Dev/Experiment/claude-finrisk
pip install docling
# Expected: ~2-5 min download (downloads model weights on first run)
```

Verify install:
```bash
python -c "from docling.document_converter import DocumentConverter; print('OK')"
```

### Step 2 — Test on one ticker (AAPL)

```bash
python scripts/build_tree_index_docling.py --tickers AAPL --compare --stats
```

This will:
1. Find `data/10k_pdfs/AAPL_10-K_2024-11-01_*.pdf`
2. Parse it with docling (~30-90s depending on hardware)
3. Run the unchanged `build_tree_from_pageindex()` pipeline
4. Write `data/tree_index/AAPL_docling_tree.json`
5. Print a side-by-side comparison with the existing `AAPL_tree.json`

Expected output comparison table:

```
    Metric                  PageIndex      Docling            Δ
    ------------------------------------------------------------
    total_nodes                    96           ???          ???
    leaf_nodes                     70           ???          ???
    max_depth                       4           ???          ???
    total_chars               184998           ???          ???
    avg_leaf_chars              2642           ???          ???
```

### Step 3 — Inspect raw docling output

```bash
python scripts/build_tree_index_docling.py --tickers AAPL --dump-raw data/debug/AAPL_docling_raw.json --force
```

Open `data/debug/AAPL_docling_raw.json` and check:
- Are section headings detected correctly? (Item 1, Item 1A, etc.)
- Are page numbers (`page_index`) populated?
- Is body text present under each section?

### Step 4 — Run quality audit

```bash
python scripts/audit_chunk_quality.py
```

The audit script works on all `*_tree.json` files in `data/tree_index/`. Compare:
- `AAPL` (PageIndex) — baseline
- `AAPL_docling` — docling result (if audit_chunk_quality.py supports `_docling_` suffix)

Alternatively, temporarily rename `AAPL_docling_tree.json` to `AAPL_tree.json` to run the audit directly, then rename back.

### Step 5 — Visual spot-check

Run a tree traversal query using the docling tree:

```bash
# Temporarily copy docling tree to use as AAPL
cp data/tree_index/AAPL_docling_tree.json data/tree_index/AAPL_tree_docling_backup.json
cp data/tree_index/AAPL_docling_tree.json data/tree_index/AAPL_tree.json
# Start backend and run a query
python -c "
from app.services.tree_service import TreeRetrievalService
svc = TreeRetrievalService()
result = svc.retrieve('AAPL', 'What are the supply chain risks?')
for n in result.nodes[:3]:
    print(n.title, '|', n.page_index, '|', n.relevant_content[:120])
"
# Restore original
cp data/tree_index/AAPL_tree_docling_backup.json data/tree_index/AAPL_tree.json
```

---

## Pass/Fail Criteria

| Criterion | Pass | Fail |
|---|---|---|
| Script runs without error | No exceptions | Any crash |
| Tree builds successfully | `total_nodes > 50` | Fewer than 20 nodes |
| PART/ITEM hierarchy present | All 4 PARTs, ≥8 Items | Missing PART I or major Items |
| Leaf count comparable to PageIndex | Within ±30% of PageIndex count | More than 2× or less than 0.5× |
| Average leaf size | 1,500–6,000 chars | >10,000 chars (too large) or <200 chars (too small) |
| Page numbers populated | page_index > 0 for ≥80% of leaves | page_index == 0 for all nodes |
| Audit: very_short leaves | <10% | >20% |
| Audit: very_long leaves | <5% | >15% |
| Traversal query works | Returns ≥3 relevant nodes | Returns 0 nodes or crashes |

---

## Known Limitations vs PageIndex

| Limitation | Impact | Mitigation |
|---|---|---|
| Page numbers less precise | Citations show less exact page | PageIndex page numbers are also approximate; acceptable |
| Table formatting varies | Tables may be less clean | Same post-processing applies |
| First run downloads ~1.5 GB of model weights | One-time setup cost | Cache in `~/.cache/huggingface` |
| Parsing a 300-page PDF takes 1-3 min locally | Offline only, not real-time | Ingestion is always offline (one-time per ticker) |
| No cloud storage of parsed documents | Must have local PDFs | PDFs are already in `data/10k_pdfs/` |

---

## If the Test Passes: Integration Path

If docling produces comparable tree quality, integrate it into the main script in two ways:

**Option A (parallel scripts, current approach):**
Keep `build_tree_index_docling.py` as an independent script. Rename output to `{TICKER}_tree.json` using `--output-dir` and a wrapper.

**Option B (unified script with `--source` flag):**
Add `--source docling|pageindex` to `build_tree_index.py`. The docling fetch function replaces the PageIndex fetch only when `--source docling` is specified. All post-processing is shared.

Option B is cleaner for long-term maintenance. Option A is safer for testing since it doesn't touch the working script.

---

## If the Test Fails: Fallback Options

| Problem | Alternative |
|---|---|
| docling misses Item headings | Try `pymupdf4llm` (header detection via font size) |
| docling page numbers wrong | Use PDF page-break metadata from PyMuPDF |
| Text extraction quality poor | Try `marker` (Datalab, Apache-2) — better for complex layouts |
| All alternatives poor | Keep PageIndex for ingestion; document that it's only used offline |

---

## Files Involved

| File | Role |
|---|---|
| `scripts/build_tree_index_docling.py` | **New** — docling-based ingestion script |
| `scripts/build_tree_index.py` | Unchanged — PageIndex-based ingestion (still works) |
| `scripts/audit_chunk_quality.py` | Unchanged — run on output to check quality |
| `data/10k_pdfs/*.pdf` | Input PDFs (already downloaded) |
| `data/tree_index/{TICKER}_docling_tree.json` | Output (new naming to avoid overwriting existing) |
| `data/tree_index/{TICKER}_tree.json` | Existing PageIndex trees (reference baseline) |
