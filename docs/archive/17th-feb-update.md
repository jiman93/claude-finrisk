# 17th Feb 2026 — Progress Update

## What We Built

Replaced the flat ChromaDB vector retrieval with an **LLM-guided tree traversal** system for SEC 10-K filings. The system navigates the document's hierarchical structure (PART > Item > sub-section) using o3-mini reasoning to locate relevant content, then uses gpt-5.2 for synthesis.

### Phase 0: EDGAR PDFs (Done)
- Discovered that **native EDGAR PDFs** produce dramatically better PageIndex trees than Playwright-rendered PDFs (2.5MB native vs 579K rendered; nested structure vs flat).
- Saved $50/month by dropping sec-api subscription — PDFs are free from EDGAR.
- AAPL 10-K PDF downloaded and validated: `data/10k_pdfs/aapl-20240928.pdf`

### Phase 1: Tree Building Script (Done)
- `scripts/build_tree_index.py` — fetches tree from PageIndex API, layers canonical PART/ITEM hierarchy.
- AAPL tree rebuilt from proper PDF: **41 nodes, 36 leaves, depth 3**. All 16 Items correctly grouped under PARTs with accurate page numbers.
- Output: `data/tree_index/AAPL_tree.json`

### Phase 2: Tree Traversal Service (Done)
- `src/backend/app/services/tree_service.py` — core LLM-guided traversal.
- **o3-mini** (reasoning_effort: low) navigates at each depth level, selecting 1-3 relevant branches.
- Configurable via Settings: `TREE_NAV_MODEL`, `TREE_MAX_BRANCHES` (3), `TREE_MAX_DEPTH` (4), `TREE_MAX_LEAVES` (8).
- Returns standard `RetrievalResult` — downstream pipeline unchanged.
- Tested with 3 queries, all navigated correctly:
  - "Supply chain risks" → PART I → Item 1A → 3 risk sub-sections (27K chars)
  - "Revenue by segment" → PART II → Item 7 MD&A (17K chars)
  - "How much debt?" → PART II → Items 7+8 → Note 9 – Debt (3.8K chars, exact note)

### Phase 3: Pipeline Integration (Done)
- Extended `RetrievalResult` with `retrieval_mode` and `traversal_path` metadata.
- `QueryResponse` now returns traversal steps so the frontend can display navigation breadcrumbs.
- Added `TraversalStep` schema (depth, action, options, selected).
- `Task` DB model stores traversal path; SQLite migration added.
- Startup validation: logs tree config, warns if API key missing.
- Frontend: `TraversalPathMessage` component shows "Navigated: PART I > Item 1A > ..." breadcrumbs.
- `studyStore` injects traversal path messages into the chat stream for both initial and follow-up queries.
- `.env` defaults updated: `RETRIEVAL_MODE=tree`, `OPENAI_MODEL=gpt-5.2`.

## Files Changed

| File | Status | Description |
|------|--------|-------------|
| `scripts/build_tree_index.py` | New | Tree building from PageIndex API |
| `src/backend/app/services/tree_service.py` | New | LLM-guided tree traversal service |
| `src/backend/app/services/retrieval_service.py` | Modified | Added `tree` mode alongside `local` and `pageindex` |
| `src/backend/app/services/pageindex_service.py` | Modified | Extended `RetrievalResult` with `retrieval_mode` + `traversal_path` |
| `src/backend/app/services/chroma_service.py` | Modified | Set `retrieval_mode="local"` on results |
| `src/backend/app/config.py` | Modified | Added tree tuning params, updated model default to gpt-5.2 |
| `src/backend/app/schemas/task.py` | Modified | Added `TraversalStep`, extended `QueryResponse` |
| `src/backend/app/routers/tasks.py` | Modified | Pass traversal metadata through API |
| `src/backend/app/models/task.py` | Modified | Added `traversal_path` JSON column |
| `src/backend/app/main.py` | Modified | Startup validation, SQLite migration for new column |
| `src/frontend/src/types/index.ts` | Modified | Added `TraversalStep`, `traversal_path` message type |
| `src/frontend/src/stores/studyStore.ts` | Modified | Inject traversal breadcrumbs into chat stream |
| `src/frontend/src/components/MessageRenderer.tsx` | Modified | Render `traversal_path` messages |
| `src/frontend/src/components/messages/TraversalPathMessage.tsx` | New | Traversal breadcrumb display component |
| `src/frontend/src/index.css` | Modified | Traversal path styling |
| `data/tree_index/AAPL_tree.json` | Rebuilt | From proper EDGAR PDF (41 nodes, 36 leaves) |
| `docs/TREE_RETRIEVAL_PLAN.md` | Modified | Updated phases, models, validation results |
| `.env.example` | Modified | Tree mode defaults |

## Architecture

```
User Query
    |
    v
POST /api/tasks/{id}/query
    |
    v
RetrievalService (mode=tree)
    |
    v
TreeRetrievalService
    |
    +---> Load AAPL_tree.json
    +---> o3-mini (low): Pick PARTs       → traversal_path[0]
    +---> o3-mini (low): Pick Items       → traversal_path[1]
    +---> o3-mini (low): Pick Sub-sections → traversal_path[2]
    |
    v
RetrievalResult (nodes + traversal_path + retrieval_mode)
    |
    v
QueryResponse → Frontend shows breadcrumbs + node cards
    |
    v
HITL Selection → gpt-5.2 Synthesis → Cited Answer
```

## Next Steps

### Immediate: UI End-to-End Test
- [ ] Install backend deps, start FastAPI server
- [ ] Install frontend deps, start Vite dev server
- [ ] Run a study session with AAPL (ticker already has tree index)
- [ ] Verify full flow: query → tree traversal → node cards → HITL selection → gpt-5.2 synthesis
- [ ] Confirm traversal breadcrumbs render in chat

### Then: Ingest Remaining Tickers (Phase 0 + 1)
- [ ] Download EDGAR PDFs for: MSFT, TSLA, JPM, PFE, WMT, XOM, BA
- [ ] Submit to PageIndex, get doc_ids
- [ ] Run `build_tree_index.py` for each
- [ ] Spot-check tree quality (Items under correct PARTs, page numbers accurate)

### Phase 4: Evaluation
- [ ] Compare tree retrieval vs old ChromaDB retrieval on precision/recall
- [ ] Tune `TREE_MAX_BRANCHES` and `TREE_NAV_REASONING_EFFORT` if needed
- [ ] Test multi-query follow-ups
- [ ] Measure latency and cost per query (expect 2-4 o3-mini calls + 1 gpt-5.2 call)

## Key Decisions Made
- **No sec-api**: EDGAR PDFs are free and produce better trees. $50/month saved.
- **o3-mini for navigation, gpt-5.2 for synthesis**: Keeps navigation fast/cheap (~$0.007/call) while maximising answer quality.
- **Proper PDFs only**: Playwright-rendered PDFs produce flat, broken trees. Native EDGAR PDFs are mandatory.
- **Tree mode is default**: `.env` now ships with `RETRIEVAL_MODE=tree`.
