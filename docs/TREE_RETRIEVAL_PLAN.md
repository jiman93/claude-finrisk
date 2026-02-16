# Tree-Based Retrieval Pipeline Plan

## Overview

Replace the current flat retrieval (ChromaDB vector search / PageIndex retrieval API) with LLM-guided tree traversal over PageIndex-built document trees. The LLM navigates the 10-K's hierarchical structure (PART > Item > sub-section) to locate relevant content, producing cited answers with precise page references.

## Current State

### What exists
- `scripts/build_tree_index.py` — fetches tree from PageIndex `/doc/{id}/?type=tree`, layers on canonical PART/ITEM hierarchy, outputs `{TICKER}_tree.json`
- `scripts/index_pageindex_documents.py` — submits PDFs to PageIndex for processing
- `data/tree_index/AAPL_tree.json` — test output (96 nodes, 202K chars, depth 3)
- Local ChromaDB retrieval (`chroma_service.py`) with `all-MiniLM-L6-v2`
- PageIndex retrieval service (`pageindex_service.py`) — currently blocked (`retrieval_ready: false`)
- Strategy router (`retrieval_service.py`) — delegates to local or PageIndex

### Known issues
- Current test trees use Playwright-rendered PDFs with shifted page boundaries, causing sub-section misassignment
- PageIndex retrieval API never becomes ready (`retrieval_ready: false`) — not a blocker since we're building our own traversal

## Pipeline Phases

---

### Phase 0: Proper PDF Acquisition

**Goal:** Get native SEC filing PDFs so page numbers match the filing's own TOC.

**Steps:**
1. Subscribe to sec-api.io (or use EDGAR direct PDF links where available)
2. Write/update download script to pull PDFs for all 8 tickers: MSFT, AAPL, TSLA, JPM, PFE, WMT, XOM, BA
3. Store in `data/10k_pdfs/` replacing the Playwright-rendered versions
4. Update `data/metadata/edgar_10k_manifest.json` with new paths

**Validation:** Open a PDF, check that the TOC page numbers match actual PDF page numbers.

---

### Phase 1: Re-ingest & Rebuild Trees (script ready)

**Goal:** Submit proper PDFs to PageIndex, fetch trees, verify quality.

**Steps:**
1. Run `scripts/index_pageindex_documents.py` with proper PDFs — get new doc_ids
2. Run `scripts/build_tree_index.py` for all tickers
3. Verify tree quality: sub-sections should land under correct Items

**Validation:** Spot-check 2-3 tickers — "Risk Factors" sub-sections should be under Item 1A, financial statements under Item 8, etc.

**Output:** `data/tree_index/{TICKER}_tree.json` for all 8 tickers.

---

### Phase 2: LLM Tree Traversal Service

**Goal:** Build the core retrieval logic that navigates the tree using LLM reasoning.

**How it works:**
```
User query: "What are Apple's main supply chain risks?"

Step 1 (Root): LLM sees children summaries:
  - PART I (87K chars): Items 1, 1A, 1B, 1C, 2, 3, 4
  - PART II (86K chars): Items 5-9C
  - PART IV (28K chars): Items 15-16
  LLM picks: PART I (risk factors are here)

Step 2 (PART I): LLM sees Item summaries:
  - Item 1. Business (20K chars)
  - Item 1A. Risk Factors (63K chars)  <-- likely target
  - Item 1B. Unresolved Staff Comments
  - Item 1C. Cybersecurity
  LLM picks: Item 1A

Step 3 (Item 1A): LLM sees sub-section summaries:
  - Macroeconomic and Industry Risks (12K chars)
  - Business Risks (30K chars)  <-- supply chain likely here
  - Legal and Regulatory Compliance Risks (7K chars)
  LLM picks: Business Risks (+ maybe Macroeconomic)

Step 4: Return leaf content + page citations
```

**Implementation:**

New file: `src/backend/app/services/tree_service.py`

```python
class TreeRetrievalService:
    """LLM-guided tree traversal for 10-K retrieval."""

    def retrieve(self, ticker: str, query: str) -> RetrievalResult:
        """Navigate the tree to find relevant content."""
        # 1. Load tree JSON
        # 2. Start at root
        # 3. At each level, present children summaries to LLM
        # 4. LLM selects 1-3 branches to explore
        # 5. Recurse until leaf nodes
        # 6. Return leaf content as RetrievalNodes with page_index
```

**Key design decisions:**
- LLM can select **multiple branches** at each level (e.g., both "Business Risks" and "Macroeconomic Risks")
- Max traversal depth: 3-4 levels (root → part → item → sub-section)
- Max branches per level: 3 (prevents exploring entire tree)
- Each LLM call uses a focused system prompt: "You are navigating a 10-K filing. Given the user's question, select which sections to explore."
- Returns `RetrievalResult` (same interface as ChromaDB/PageIndex) so downstream is unchanged

**LLM prompt structure per step:**
```
System: You are navigating a SEC 10-K filing tree to find content relevant to a user's question.
Given the sections below, select 1-3 sections most likely to contain the answer.
Return ONLY the node_ids of your selections as a JSON array.

User question: {query}

Available sections:
- node_id: "AAPL-part-i", heading: "PART I", summary: "Items 1-4: Business, Risk Factors, ..."
- node_id: "AAPL-part-ii", heading: "PART II", summary: "Items 5-9: Market, MD&A, Financials, ..."
...
```

**Integration with existing retrieval router:**
- Add `"tree"` as a new `RETRIEVAL_MODE` option in `retrieval_service.py`
- `RetrievalService.retrieve()` delegates to `TreeRetrievalService` when mode is `"tree"`

---

### Phase 3: Integration with Chat Pipeline

**Goal:** Wire tree retrieval into the existing HITL chat workflow.

**What changes:**
- `retrieval_service.py` — add `tree` mode alongside `local` and `pageindex`
- `config.py` — add `RETRIEVAL_MODE=tree` option
- Step rendering in chat — show traversal path as tool steps:
  - Step 1: "Navigating document structure..."
  - Step 2: "Exploring PART I > Item 1A. Risk Factors..."
  - Step 3: "Reading Business Risks, Macroeconomic Risks..."
- Citation rendering — use `page_index` from leaf nodes for PDF page links

**What stays the same:**
- `RetrievalResult` / `RetrievalNode` schemas
- HITL chunk selector (user still picks which retrieved chunks to use)
- Summary generation (OpenAI synthesis from selected chunks)
- Right pane artifact display

---

### Phase 4: Enhancements (Future)

**Optional improvements after core pipeline works:**

1. **Keyword fallback** — if LLM traversal returns no relevant leaves, do a simple keyword/regex search across all leaf nodes as fallback
2. **Multi-document traversal** — compare across tickers (e.g., "compare AAPL and MSFT risk factors")
3. **Traversal caching** — cache common paths (e.g., "risk factors" almost always goes to PART I > Item 1A)
4. **Confidence scoring** — LLM rates confidence at each branch selection; low confidence triggers exploring additional branches
5. **Streaming traversal** — stream each navigation step to the UI in real-time

---

## Architecture Diagram

```
User Query
    |
    v
RetrievalService (mode=tree)
    |
    v
TreeRetrievalService
    |
    +---> Load {TICKER}_tree.json
    |
    +---> LLM Call 1: Pick PARTs      (root -> parts)
    +---> LLM Call 2: Pick Items       (part -> items)
    +---> LLM Call 3: Pick Sub-sections (item -> leaves)
    |
    v
RetrievalResult (nodes with page citations)
    |
    v
HITL Chunk Selector (existing)
    |
    v
OpenAI Synthesis (existing)
    |
    v
Answer + Citations
```

## File Changes Summary

| File | Change |
|------|--------|
| `scripts/build_tree_index.py` | Already done (Phase 1) |
| `scripts/download_sec_pdfs.py` | New — download proper PDFs from sec-api |
| `src/backend/app/services/tree_service.py` | New — LLM tree traversal |
| `src/backend/app/services/retrieval_service.py` | Add `tree` mode |
| `src/backend/app/config.py` | Add `RETRIEVAL_MODE=tree` |

## Dependencies

- **sec-api subscription** — needed for Phase 0
- **PageIndex API key** — needed for Phase 1 (tree building only, not retrieval)
- **OpenAI API** — needed for Phase 2 (LLM traversal calls) and Phase 3 (synthesis)
- No new Python packages required beyond what's already installed

## Risk & Mitigations

| Risk | Mitigation |
|------|------------|
| LLM picks wrong branch | Allow multi-branch selection (up to 3); add fallback keyword search |
| Traversal too slow (3-4 LLM calls) | Use fast model (gpt-4o-mini) for navigation; cache common paths |
| Tree quality poor with some filings | Validate tree output per ticker; flag tickers with < 10 nodes |
| PageIndex API unavailable | Trees are cached locally as JSON; only needed once per filing |
