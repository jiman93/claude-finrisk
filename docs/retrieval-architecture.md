# Retrieval Architecture

How this system retrieves relevant content from financial filings, and why the approach evolved from standard vector search to a structured tree pipeline.

---

## The Core Problem

A 10-K filing is a single PDF document that can be 200–400 pages long. It covers everything from business operations to legal proceedings to executive compensation. When a user asks "what are the supply chain risks?", you need to find the 3–4 relevant sections out of hundreds — quickly, accurately, and in a way that can be audited.

Standard approaches either retrieve too broadly (returning irrelevant boilerplate sections) or too narrowly (missing semantically related content under different headings). This project went through three distinct retrieval modes before arriving at the current approach.

---

## Three Retrieval Modes

The system supports three modes, switchable via `RETRIEVAL_MODE` in `.env`:

| Mode | What it does | When to use |
|---|---|---|
| `local` | ChromaDB vector search on pre-embedded chunks | Development / offline use |
| `pageindex` | PageIndex API — cloud-hosted semantic search | Fast prototyping |
| `tree` | LLM-guided traversal of a structured tree index | Production (current default) |

Each mode returns the same `RetrievalResult` interface to the rest of the pipeline, so the frontend and task endpoints are unaware of which mode is active.

---

## Mode 1: Local Vector Search (ChromaDB)

### How it works

PDFs are split into fixed-size chunks (e.g. 500 tokens with 50-token overlap), embedded using `all-MiniLM-L6-v2`, stored in ChromaDB, and retrieved via cosine similarity against the query embedding.

### The problem

Fixed-size chunking is document-structure-blind. A chunk boundary can fall in the middle of a risk factor description, or a single chunk can span two unrelated topics. The retrieved chunks are semantically similar to the query but may lack surrounding context, making summaries incomplete or disconnected.

For SEC 10-K filings specifically — which follow a rigid SEC-mandated structure — ignoring that structure is a missed opportunity.

---

## Mode 2: PageIndex API

PageIndex is a cloud service that ingests PDFs and builds a native tree structure from the document's own hierarchy (headings, sections, sub-sections). It exposes this via a REST API.

### What PageIndex gives you

Instead of flat chunks, you get a nested JSON tree where each node has:

```json
{
  "node_id": "pi-aapl-1a-market-risk",
  "title": "Market Risk",
  "page_index": 42,
  "text": "...full section content...",
  "nodes": [...]
}
```

This is structurally much better than arbitrary chunking — nodes correspond to actual document sections.

### The remaining problem

The raw PageIndex tree reflects the PDF's internal headings, but **not the canonical SEC 10-K structure**. Items and Parts are not always cleanly separated. Some leaves are 30,000 characters (an entire risk factors section as one node). Some are 80 characters (a heading with no content). The tree needs post-processing before it's useful for retrieval.

---

## Mode 3: Tree Index (Current Default)

This is a two-stage approach:

1. **Offline preprocessing** — Transform the raw PageIndex tree into a clean, canonical tree index stored as JSON (`build_tree_index.py`)
2. **Online retrieval** — Use an LLM to navigate the clean tree at query time (`tree_service.py`)

---

## Stage 1: Building the Tree Index

**Script:** `scripts/build_tree_index.py`
**Output:** `data/tree_index/{TICKER}_tree.json`
**Run once per document** (or after document updates)

### What it does

Takes the raw PageIndex tree and transforms it into a 4-level canonical hierarchy:

```
Root (filing)
  └── PART I / PART II / PART III / PART IV
        └── Item 1 / Item 1A / Item 1B / Item 2 ... Item 16
              └── Sub-sections (leaf nodes with actual content)
```

This maps directly to SEC Regulation S-K, which mandates this structure for all 10-K filings. Every AAPL, MSFT, TSLA, and XOM filing has the same top-level skeleton — the content differs, the structure does not.

### Step-by-step pipeline

**Step 1 — Fetch from PageIndex API**

```
GET https://api.pageindex.ai/doc/{doc_id}/?type=tree
```

Returns nested JSON. The `doc_id` for each ticker is mapped in the `.env` config.

**Step 2 — Flatten**

Convert the nested structure to a linear list while preserving document order and depth metadata. Order matters because SEC filings are read sequentially — section boundaries are positional, not just heading-based.

**Step 3 — Extract structure**

Two signals are used to identify Item boundaries:
- **TOC parsing** — The table of contents (usually pages 1–3) contains explicit Item titles and page numbers
- **Heading detection** — Regex scans for `Item 1A`, `PART II`, etc. throughout the document body

Hybrid assignment: each sub-section node is assigned to the Item whose content page range it falls within, using document order as the primary signal (not raw page number, which can be unreliable).

**Step 4 — Split large leaves**

Any leaf node over 5,000 characters with 2+ embedded headings gets split:

- First attempt: split at embedded heading boundaries (`###`, `####`, or named risk categories like *Macroeconomic*, *Regulatory*, *Operational*)
- Fallback: split at paragraph boundaries into ~3,000-character segments

Before this step, Item 1A (Risk Factors) for AAPL was 3 nodes of 11K, 30K, and 16K characters. After splitting, it becomes 18 nodes averaging 3–4K characters each. This is the most impactful single transformation.

**Step 5 — Prune**

Remove any leaf with fewer than 150 characters. These are heading-only stubs with no retrievable content — found to make up ~6.5% of raw nodes.

**Step 6 — Disambiguate headings**

If the same heading appears under multiple parents (e.g. "Geographic Risk" appears under both Item 1A and Item 7A), prepend the parent heading to each: "Risk Factors — Geographic Risk" vs "Market Risk — Geographic Risk".

**Step 7 — Finalize**

Propagate character counts up the tree. Generate summary strings for internal nodes listing their child headings. These summaries are what the LLM sees during traversal — not the full content.

### Output format

```json
{
  "ticker": "AAPL",
  "doc_id": "pi-doc-...",
  "source": "pageindex",
  "tree": {
    "node_id": "root",
    "heading": "AAPL 10-K 2024",
    "level": 0,
    "children": [...]
  },
  "stats": {
    "total_nodes": 96,
    "leaf_nodes": 70,
    "max_depth": 4,
    "total_chars": 184998,
    "level_counts": {"0": 1, "1": 4, "2": 12, "3": 70}
  }
}
```

### Before and after (AAPL example)

| Metric | Raw PageIndex tree | After preprocessing |
|---|---|---|
| Total nodes | 61 | 96 |
| Leaf nodes | 45 | 70 |
| Largest leaf | 30,247 chars | 4,812 chars |
| Heading-only stubs | 12 | 0 |
| Duplicate headings | 8 | 0 |

---

## Stage 2: Tree Traversal at Query Time

**Service:** `src/backend/app/services/tree_service.py`
**Called by:** `src/backend/app/routers/tasks.py` on every `POST /{task_id}/query` request

### The core idea

Rather than embedding the query and finding nearest neighbours, the tree traversal asks: *"Given this query and these section headings, which branches are worth exploring?"* — and does so at each level of the hierarchy using an LLM.

This mimics how a human analyst would navigate a long filing: scan the table of contents, identify the relevant sections, go deeper into those, and skip the rest.

### How traversal works

**Input:** query string + loaded tree JSON
**LLM:** `o3-mini` (fast reasoning model, `reasoning_effort: low` for cost control)
**Max depth:** 4 levels | **Max branches per level:** 3 | **Max final leaves:** 8

**At each level:**

1. Present the LLM with the children of the current node — their headings and content summaries (truncated to 300 chars each)
2. Ask it to select which children are relevant to the query
3. Recurse into selected children only
4. Record each navigation step in `traversal_path` for auditability

**Prompt structure (one navigation step):**

```
System: You are navigating a 10-K filing to find content relevant to a query.
        Select sections that are likely to contain relevant information.
        Return JSON: {"selected": ["node_id_1", "node_id_2"]}

User: Query: "What are the risks related to supply chain concentration?"

     Available sections:
     [1] node_id: item_1a_supply | heading: Supply Chain Risks
         Summary: Discusses vendor concentration, single-source dependencies...
         (~2,847 chars)

     [2] node_id: item_1a_macro | heading: Macroeconomic Risks
         Summary: Covers inflation, interest rates, consumer demand...
         (~3,102 chars)
     ...
```

The LLM selects relevant sections; the traversal recurses into them.

### After traversal: hybrid re-ranking

The traversal signal alone isn't always sufficient — the LLM might miss a relevant leaf under a path it didn't explore. After collecting traversal results, the service applies a secondary re-ranking pass over all candidate leaves:

**Scoring components:**
- **Token overlap** — how many query keywords appear in the heading or content (+6 per occurrence, +4 bonus if in heading)
- **Intent boosts** — detected query intent (supply chain, trade, financial, geographic) triggers domain-specific heading boosts (+8 to +12 for high-signal headings)
- **Penalties** — generic sections like "General Risks" are penalised unless the query is explicitly stock-oriented

This produces a final ranked list that preserves strong traversal signals but promotes overlooked leaves that match lexically.

### Output

```python
RetrievalResult(
    retrieval_id="tr-tree-a1b2c3d4",
    nodes=[
        RetrievalNode(
            node_id="item_1a_supply-split-02",
            title="Supply Chain Risks — Vendor Concentration",
            page_index=34,
            relevant_content="The company relies on a limited number of suppliers..."
        ),
        ...  # up to 8 nodes
    ],
    retrieval_mode="tree",
    traversal_path=[
        {"depth": 1, "action": "selected", "options": ["PART I", "PART II"], "selected": ["PART I"]},
        {"depth": 2, "action": "selected", "options": ["Item 1", "Item 1A", "Item 7"], "selected": ["Item 1A"]},
        {"depth": 3, "action": "selected", "options": [...], "selected": ["Supply Chain Risks", "...]},
        ...
    ]
)
```

The `traversal_path` is stored in the database and shown to participants in the study UI — this is the explainability trace.

---

## Stage 3: Quality Evaluation

**Script:** `scripts/audit_chunk_quality.py`

Run this after building or rebuilding tree indexes to check quality across all tickers.

### What it audits

For each ticker's tree index, across all leaf nodes:

| Check | What it detects | Why it matters |
|---|---|---|
| `very_short` (<100 chars) | Heading-only stubs | No retrievable content |
| `very_long` (>10K chars) | Unsplit monolithic sections | Overwhelming the context window |
| `starts_mid_sentence` | Chunk boundary inside a sentence | Content is cut off |
| `truncated_sentences` | Chunk ends mid-sentence | Missing conclusions |
| `has_physical_index` | `<physical_index_N>` tags | PageIndex page markers leaking into content |
| `has_raw_markdown_headers` | `### Heading` in content | Formatting artefacts |
| `duplicate_headings` | Same heading in multiple leaves | Navigation ambiguity |

### Running the audit

```bash
cd scripts
python audit_chunk_quality.py
```

Output is a per-ticker report + cross-ticker summary table with counts and percentages.

### Current baseline (8 tickers, 1,268 total leaves)

| Issue | Count | % | Status |
|---|---|---|---|
| Very short (<100 chars) | 82 | 6.5% | Fixed — 150-char filter in `tree_service.py` |
| Very long (>10K chars) | 44 | 3.5% | Fixed — split threshold lowered to 5K |
| Duplicate headings | 62 groups | — | Fixed — parent context prepended |
| Truncated sentences | 11 | 0.9% | Accepted — mostly XOM footer artefacts |
| Mid-sentence starts | 0 | 0% | Clean |

### Interpreting audit output

A clean tree should have:
- Zero or near-zero very short leaves
- No leaves over 8K characters
- No mid-sentence starts
- Truncated sentences below 1%
- Duplicate heading groups resolved with parent context

---

## End-to-End Request Flow

A complete retrieval request from the frontend to returned nodes:

```
Frontend
  POST /api/tasks/{task_id}/query  { "query": "supply chain risks" }
    │
    ▼
tasks.py
  retrieval_service.retrieve(ticker="AAPL", query="supply chain risks")
    │
    ▼
tree_service.py
  1. load_tree("AAPL")         → reads data/tree_index/AAPL_tree.json
  2. traverse_tree(...)        → LLM (o3-mini) navigates 3–4 levels
  3. _rank_nodes_for_query(...)→ hybrid re-ranking of traversal results
  4. filter(<150 chars)        → prune empty nodes
  5. convert to RetrievalNode[]→ node_id, title, page_index, relevant_content
    │
    ▼
tasks.py
  stores task.retrieved_nodes, task.traversal_path, task.retrieval_id
  returns QueryResponse to frontend
    │
    ▼
Frontend
  displays retrieved chunks with citations
  (HITL-R mode: participant selects which chunks to use)
```

---

## Configuration Reference

All retrieval behaviour is controlled via environment variables (`.env`):

```bash
# Which retrieval mode to use
RETRIEVAL_MODE=tree          # tree | pageindex | local

# PageIndex API (used for build_tree_index.py)
PAGEINDEX_API_KEY=...
PAGEINDEX_BASE_URL=https://api.pageindex.ai

# OpenAI API (used for tree traversal navigation + summary generation)
OPENAI_API_KEY=...
OPENAI_BASE_URL=https://api.openai.com/v1

# Tree traversal tuning
TREE_NAV_MODEL=o3-mini
TREE_NAV_REASONING_EFFORT=low
TREE_MAX_BRANCHES=3
TREE_MAX_DEPTH=4
TREE_MAX_LEAVES=8
```

---

## Why Tree Traversal vs Vector Search

| Concern | Vector search | Tree traversal |
|---|---|---|
| Chunk boundary quality | Depends on splitting heuristics | Structure-aware, document-native |
| Retrieval explainability | Cosine similarity score (opaque) | Traversal path (auditable, shown to user) |
| Handling document structure | Ignores it | Exploits SEC-mandated PART/ITEM hierarchy |
| Cold start (new document) | Requires re-embedding | Requires tree build (one-time offline step) |
| Query sensitivity | Sensitive to exact phrasing | LLM paraphrases intent at each level |
| Cost | Near-zero at query time | LLM API calls per query (~3–4 calls, cheap with o3-mini) |
| Handling boilerplate | Pulls in boilerplate if semantically similar | Navigates past it at the PART/ITEM level |

The fundamental trade-off is: vector search is cheaper and simpler; tree traversal is more accurate and explainable for structured documents with a known schema. For SEC 10-K filings — which all follow the same SEC-mandated structure — the tree approach has a structural advantage that generic RAG cannot replicate.
