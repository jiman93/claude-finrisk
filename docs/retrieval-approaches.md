# Retrieval Approaches for SEC 10-K Filings

Comparison of retrieval strategies evaluated for the FinRisk study platform: **ChromaDB vector search** (current), **LLM-reasoning tree traversal** (proposed), **RAPTOR** (evaluated — wrong fit), **PageIndex** (evaluated — partial fit), and **LangExtract** (evaluated — wrong tool).

---

## 1. ChromaDB Vector Search (Current)

### How it works

The current pipeline (`scripts/ingest_10k.py`) splits each 10-K HTML filing at page boundaries (`<hr>`, CSS `page-break-*`, inline break styles), converts to plain text, and stores chunks in ChromaDB with `all-MiniLM-L6-v2` embeddings (384-dim).

```
Raw HTML (6–15 MB per filing)
  → split on page breaks
  → strip HTML tags → plain text
  → skip fragments < 50 chars
  → split oversized chunks (> 4000 chars) at paragraph breaks
  → embed with sentence-transformers
  → store in ChromaDB (one collection per ticker: 10k_MSFT, 10k_AAPL, …)
```

At query time, ChromaDB returns the top-k chunks (default 8) by cosine similarity against the query embedding.

### Strengths

- **Simple**: Ingestion is ~100 lines of Python. No LLM calls, no external APIs.
- **Semantic matching**: Finds passages related to the query even when exact keywords differ.
- **Fast retrieval**: Sub-second query latency for 200–300 chunks per collection.
- **Proven ecosystem**: ChromaDB, sentence-transformers, and HNSW are battle-tested.

### Weaknesses

- **No structural awareness**: A chunk from "Item 1A. Risk Factors" looks the same as one from "Item 8. Financial Statements" — there's no section hierarchy. The system cannot distinguish a risk discussion from a revenue discussion that mentions risk in passing.
- **Page-break boundaries are arbitrary**: SEC EDGAR page breaks don't align with section boundaries. A section like "Cybersecurity Risk" might start mid-page and span three page-break chunks, meaning the retriever may return the middle fragment without the intro or conclusion.
- **No chunk overlap**: Adjacent chunks share no text, so information at page boundaries is lost or split across two results.
- **Precision concerns**: Semantic similarity can surface tangentially related passages. For a regulated study comparing human-in-the-loop conditions, noisy retrieval is an uncontrolled confound — if the baseline mode gets worse chunks than the HITL mode, measured differences may reflect retrieval noise rather than HITL effectiveness.
- **Non-deterministic ranking**: The same query can return slightly different orderings due to HNSW approximate nearest-neighbor behavior.

### Current stats

| Ticker | Chunks | HTML size |
|--------|--------|-----------|
| MSFT   | ~250   | 6.9 MB    |
| AAPL   | ~200   | varies    |
| TSLA   | ~180   | varies    |
| JPM    | ~350   | varies    |
| PFE    | ~250   | varies    |
| WMT    | ~200   | varies    |
| XOM    | ~220   | varies    |
| BA     | ~250   | varies    |

**Total**: ~1,931 chunks across 8 tickers.

---

## 2. LLM-Reasoning Tree Traversal (Proposed)

### How it works

Two-phase approach: (1) parse document structure into a heading tree deterministically, (2) retrieve by LLM reasoning over the tree — no embeddings, no vector similarity.

```
Phase 1 — Tree Building (deterministic, no LLM):
  Raw HTML
    → parse heading structure (Part I/II, Item 1/1A/7/8, sub-sections)
    → build tree: root → parts → items → sub-sections → paragraphs
    → store tree as JSON (one file per ticker)

Phase 2 — Retrieval (LLM reasoning, vectorless):
  Query
    → present top-level tree nodes to LLM
    → LLM reasons about which branches are relevant (with explanation)
    → recurse into selected branches, present children
    → LLM selects again at each level
    → return leaf nodes with full ancestry path + reasoning trace
```

This is a **vectorless RAG** approach — retrieval uses LLM reasoning at each traversal step rather than embedding similarity. The key distinction from standard RAG: the LLM understands *why* it selected each node, producing a reasoning trace that serves as built-in explainability.

#### 10-K Filing Structure (Standard SEC Format)

```
10-K Filing
├── Cover Page
├── PART I
│   ├── Item 1.  Business
│   ├── Item 1A. Risk Factors          ← primary target for FinRisk
│   │   ├── Market and Economic Risks
│   │   ├── Operational Risks
│   │   ├── Cybersecurity Risks
│   │   ├── Legal and Regulatory Risks
│   │   └── …
│   ├── Item 1B. Unresolved Staff Comments
│   └── Item 2.  Properties
├── PART II
│   ├── Item 5.  Market for Common Equity
│   ├── Item 6.  [Reserved]
│   ├── Item 7.  Management's Discussion & Analysis (MD&A)
│   │   ├── Overview
│   │   ├── Revenue Discussion
│   │   ├── Segment Analysis
│   │   └── Risk Discussion (often overlaps with 1A)
│   ├── Item 7A. Quantitative/Qualitative Disclosures about Market Risk
│   └── Item 8.  Financial Statements
└── PART IV
    └── Item 15. Exhibits and Financial Statement Schedules
```

#### Retrieval Algorithm

```python
def traverse(node, query, depth=0):
    """Recursive LLM-guided tree traversal."""
    if node.is_leaf:
        return [node]  # return content with full ancestry path

    # Present children headings + summaries to LLM
    prompt = f"""Given this query: "{query}"
    Which of these sections are relevant? Explain your reasoning.
    {format_children(node.children)}"""

    selected = llm.select(prompt, temperature=0)  # deterministic

    results = []
    for child in selected:
        results.extend(traverse(child, query, depth + 1))
    return results
```

At each level, the LLM sees only the **headings and brief summaries** of child nodes — not the full text. This keeps token usage low (a few hundred tokens per traversal step) while enabling informed navigation. The full text is only returned at leaf level.

#### Why Vectorless?

| Vector RAG | LLM-Reasoning Traversal |
|------------|------------------------|
| Finds passages that *sound similar* | Finds passages that *are relevant* |
| No understanding of document structure | Navigates document hierarchy |
| "cybersecurity" in Item 8 footnote = same as in Item 1A | Knows Item 1A risk factors ≠ Item 8 accounting |
| Retrieval is a black box (cosine score) | Retrieval produces reasoning trace (why each node was selected) |
| Non-deterministic (HNSW approximation) | Deterministic (temperature=0, same tree) |

### Strengths

- **Structure-aware**: Retrieval knows the difference between Item 1A (Risk Factors) and Item 8 (Financial Statements). Won't return accounting footnotes when the query asks about cybersecurity risks.
- **Reasoning-based**: The LLM explains *why* it selected each branch — this reasoning trace can be surfaced in the HITL UI as part of the evidence chain.
- **Deterministic**: Same query + same tree + temperature=0 = same results. Critical for controlled study conditions.
- **Full context preservation**: Returns entire sub-sections rather than arbitrary page fragments. If "Cybersecurity Risk" spans 3 pages, the tree returns the whole section as one node.
- **Provenance**: Each retrieved node carries its full ancestry path (`Part I → Item 1A → Risk Factors → Cybersecurity Risks`), making citations precise and verifiable.
- **Generalizable**: The tree builder is document-format specific (HTML parser for EDGAR), but the traversal algorithm is format-agnostic — it works on any heading tree from any document type (10-Q, annual reports, legal filings, medical records).
- **Extensible for research**: The reasoning trace opens future research directions — analyzing retrieval reasoning quality, comparing LLM traversal strategies, human-AI agreement on relevance judgments.

### Weaknesses

- **LLM cost at query time**: Each traversal step is an LLM call (typically 3–4 levels deep = 3–4 calls per query). Mitigated by caching results per query since study queries are fixed.
- **Parsing complexity**: EDGAR HTML has inconsistent formatting across filers. Bold spans, inline styles, and non-standard heading patterns require heuristics.
- **Latency**: Sequential LLM calls add ~2–5 seconds per query vs sub-second vector search. Acceptable for a study platform, not for real-time chat.
- **Tree quality dependency**: Retrieval quality is bounded by tree quality. If the heading parser misses a section, the LLM can't find it.

### Implementation Scope

1. **HTML heading parser** — Extract Part/Item/sub-section headings from EDGAR inline styles.
2. **Tree builder** — Construct nested tree from heading → content pairs.
3. **JSON serializer** — Save `data/tree_index/{TICKER}_tree.json` per filing.
4. **LLM traversal function** — Recursive branch selection with reasoning trace.
5. **Retrieval service** — Plugs into existing backend alongside ChromaDB fallback.
6. **Caching layer** — Cache traversal results per (ticker, query) pair for study determinism.

---

## 3. RAPTOR (Evaluated — Wrong Fit)

### What it is

[RAPTOR](https://arxiv.org/abs/2401.18059) (Recursive Abstractive Processing for Tree-Organized Retrieval) is a retrieval method from Stanford, published at ICLR 2024. It builds a tree bottom-up through semantic clustering and LLM summarization, then retrieves via vector similarity across all tree levels.

### How it works

```
Document
  → chunk into 100-token segments
  → embed with SBERT (multi-qa-mpnet-base-cos-v1, 768-dim)
  → cluster via UMAP dimensionality reduction + Gaussian Mixture Model (soft clustering)
  → summarize each cluster with LLM (gpt-3.5-turbo)
  → re-embed summaries → re-cluster → re-summarize (recurse until single cluster)

Retrieval (collapsed tree — best performing mode):
  → flatten ALL nodes (leaves + all summary levels) into single pool
  → embed query with same SBERT model
  → cosine similarity against all nodes
  → return top nodes until token budget reached
```

### Why it doesn't fit

RAPTOR builds an impressive multi-level abstraction tree, but its retrieval is **fundamentally vector-based** — the same paradigm as ChromaDB with extra summary layers.

| FinRisk requirement | RAPTOR |
|---|---|
| Vectorless retrieval | No — retrieval is 100% cosine similarity |
| LLM reasoning at query time | No — LLM only used during indexing (summarization) |
| Structure-aware (Item 1A vs Item 8) | No — ignores document headings; clusters by semantic similarity |
| Deterministic | Partially — retrieval is deterministic on a frozen tree, but tree building has 3 stochastic layers (UMAP, GMM, LLM summaries) |
| Financial data fidelity | 4% hallucination rate in summaries — minor for fiction QA, concerning for exact financial figures |

### Key results from the paper

- **QuALITY** (long-form comprehension): 82.6% accuracy, +20 points over prior SOTA — strong on multi-hop reasoning across long documents
- **QASPER** (scientific paper QA): 55.7% F1 with GPT-4, +2.7 over DPR
- **NarrativeQA** (book-length QA): SOTA on METEOR metric

These are impressive results, but they demonstrate RAPTOR's strength on **long unstructured narratives** — not on structured regulatory filings where section boundaries carry meaning.

### Where RAPTOR excels vs our approach

RAPTOR is better when: the document has no meaningful structure (fiction, transcripts), the query requires synthesizing facts scattered across distant sections, and you want automatic multi-level abstraction without manual parsing.

Our LLM-reasoning traversal is better when: the document has explicit structure (10-K headings), retrieval determinism matters for a controlled study, you want reasoning traces for explainability, and the domain requires financial data fidelity.

### Open source

[github.com/parthsarthi03/raptor](https://github.com/parthsarthi03/raptor) — MIT license, ~1.6k stars. Clean API: `RetrievalAugmentation()` with `add_documents()`, `answer_question()`, `save()`, `load()`.

---

## 4. PageIndex (Evaluated — Partial Fit)

### What it is

[PageIndex](https://github.com/VectifyAI/PageIndex) by VectifyAI builds a document tree from headings/TOC structure and retrieves via LLM-guided tree search (MCTS). The open-source repo (MIT license) supports self-hosting for tree building, but the retrieval algorithm is proprietary.

### Self-hosting reality

The README claims "Self-host — run locally with this open-source repo." Investigation reveals:

| Component | Self-hostable? | Details |
|---|---|---|
| PDF text extraction | Yes | PyPDF2 / PyMuPDF, runs locally |
| TOC detection | Yes, but needs OpenAI API | `ChatGPT_API()` calls for structure extraction |
| Tree building | Yes, but needs OpenAI API | Multiple LLM calls per document for verification, correction, summarization |
| MCTS retrieval | **No** | Proprietary, only available via `api.pageindex.ai` |
| Tree search prompt | Partial | A basic prompt template is provided in `tutorials/tree-search/`, but not the full MCTS algorithm |

**Self-hosted tree building requires an OpenAI API key** (`CHATGPT_API_KEY`). Default model is `gpt-4o-2024-11-20`. No merged support for local LLMs (unmerged PRs exist for Ollama/LiteLLM).

### Why it's a partial fit

PageIndex's **approach** (structure-aware tree + LLM-reasoning retrieval) aligns with what we want. But:

1. **PDF-only** — our 10-K filings are EDGAR HTML, not PDF. Would require HTML → PDF conversion.
2. **Cloud retrieval** — the part that matters most (MCTS tree search) is proprietary.
3. **OpenAI dependency** — tree building costs API calls; no local LLM support in main branch.
4. **Support concerns** — user's tree building submissions were stuck for days with no CS response (Issue #106 confirms slow processing on large PDFs).

### What we take from PageIndex

The *concept* of LLM-guided tree traversal is sound. Our approach implements the same idea but:
- Builds trees deterministically from HTML headings (no LLM for tree building)
- Implements our own LLM traversal (open, no proprietary dependency)
- Works directly on EDGAR HTML (no PDF conversion)
- Produces reasoning traces at each traversal step

---

## 5. LangExtract (Evaluated — Wrong Tool)

### What it is

[LangExtract](https://github.com/google/langextract) is an open-source Python library by Google (Apache 2.0) that uses LLMs to extract structured entities from unstructured text. Version 1.1.1 (November 2025).

### How it works

```
Plain text input
  → chunk into overlapping segments (~1000–2000 chars)
  → send each chunk to LLM with extraction prompt + few-shot examples
  → LLM returns entity extractions (class, text, attributes)
  → WordAligner maps extractions back to exact character offsets
  → merge results across chunks (first-pass-wins dedup)
  → output: flat JSONL of extractions with source positions
```

### Why it doesn't fit

| Requirement | LangExtract |
|------------|-------------|
| Document parsing (HTML/PDF) | No — requires pre-parsed plain text |
| Hierarchical structure | No — flat entity list, no tree |
| Retrieval system | No — extraction only, not search/retrieval |
| Section-aware navigation | No — no concept of document sections |
| Offline/local operation | Requires LLM API calls (Gemini, OpenAI, or local Ollama) |
| Cost at scale | High — LLM call per chunk per extraction pass |

LangExtract solves a **different problem**: "Given text, extract specific entities (dates, amounts, risk factors) with source grounding." It does not index, search, or retrieve documents.

### Where it could complement (future)

If we later need to extract structured data from retrieved sections — e.g., "extract all mentioned risk factors with severity and category labels" — LangExtract could sit downstream of tree retrieval as an extraction layer. This would support the deferred Risk Framework and Faithfulness Framework in the TFP.

---

## Comparison Matrix

| Dimension | ChromaDB (current) | LLM-Reasoning Traversal (proposed) | RAPTOR | PageIndex | LangExtract |
|-----------|-------------------|-------------------------------------|--------|-----------|-------------|
| **Type** | Vector retrieval | Reasoning-based structural retrieval | Vector retrieval + abstraction layers | Reasoning-based structural retrieval | Entity extraction |
| **Document structure** | Flat chunks | Hierarchical tree (from headings) | Hierarchical tree (from semantic clustering) | Hierarchical tree (from TOC/headings) | None |
| **Retrieval model** | Cosine similarity | LLM reasoning at each tree level | Cosine similarity across all levels | LLM reasoning + MCTS | N/A |
| **Vectorless?** | No | **Yes** | No | Yes | N/A |
| **Determinism** | Approximate (HNSW) | Deterministic (temp=0 + cached) | Index stochastic, retrieval deterministic on frozen tree | LLM-dependent | N/A |
| **Section awareness** | None | Full (Part → Item → Sub-section) | None (semantic clusters) | Full (TOC-derived) | None |
| **Query-time LLM** | No | Yes (3–4 calls per traversal) | No | Yes (proprietary MCTS) | Yes (always) |
| **Reasoning trace** | None | Yes (explains each branch selection) | None | Unknown (proprietary) | None |
| **Chunk boundaries** | Page breaks (arbitrary) | Section breaks (semantic) | 100-token windows | Page-based sections | Overlapping windows |
| **Citation quality** | Page number only | Full section path + reasoning | Node ID only | Section path | Character offset |
| **Tree build cost** | N/A (embedding only) | HTML parsing (local, no LLM) | LLM summarization per cluster per level | LLM calls (OpenAI API) | N/A |
| **Query cost** | Embedding + HNSW lookup | 3–4 LLM calls (cacheable) | Embedding + cosine search | LLM calls (proprietary API) | LLM calls per chunk |
| **Open source** | Yes | Custom (we build it) | Yes (MIT) | Tree building only (retrieval proprietary) | Yes (Apache 2.0) |
| **Works on HTML** | Yes | Yes (native) | Yes (text input) | No (PDF only) | Yes (text input) |
| **Study suitability** | Noise is confound risk | Deterministic + explainable | Still vector-based noise | Cloud dependency risk | Wrong tool |

---

## Recommendation

**Build the LLM-reasoning tree traversal as the primary retrieval path for the study.**

Rationale:
1. **Vectorless + reasoning-based** — aligns with the thesis's AI focus and is a genuinely distinct approach from standard RAG. The reasoning traces at each traversal step provide built-in explainability that complements the HITL controls research.
2. **Deterministic** — temperature=0 + cached results per (ticker, query) pair ensures all study conditions get identical source material. The only variable is the HITL intervention.
3. **Structure-aware** — 10-K filings follow standardized SEC Regulation S-K structure. The tree preserves this hierarchy, enabling precise citations (`Part I → Item 1A → Cybersecurity Risks`).
4. **Generalizable** — the tree builder is format-specific (HTML parser for EDGAR now, PDF parser later), but the traversal algorithm is format-agnostic. Extends naturally to 10-Q, annual reports, legal filings, medical records.
5. **Research-extensible** — opens future work on retrieval reasoning quality, LLM traversal strategies, and human-AI agreement on relevance judgments.
6. **No external dependencies** — unlike PageIndex (proprietary retrieval, cloud API, poor support) and RAPTOR (vector-based despite tree structure), this approach is fully self-contained.

**ChromaDB retained** as fallback for exploratory lane queries (follow-up questions during study sessions that don't map to the tree).

**RAPTOR ruled out** — impressive results on long unstructured narratives, but retrieval is still vector cosine similarity. Doesn't address the structural awareness or vectorless goals.

**PageIndex concept adopted, implementation independent** — the idea of LLM-guided tree traversal is sound; we implement it ourselves without proprietary dependencies.

**LangExtract deferred** — potentially useful downstream for structured entity extraction (Risk Framework, Faithfulness Framework) but not for retrieval.

---

## Implementation Plan

```
Phase 1: Tree Building
  scripts/build_tree_index.py                — parse EDGAR HTML headings → tree JSON
  data/tree_index/{TICKER}_tree.json         — one tree per ticker (8 files)

Phase 2: LLM Traversal
  src/backend/app/services/tree_retrieval.py  — recursive LLM-guided branch selection
                                               with reasoning trace at each level

Phase 3: Backend Integration
  src/backend/app/services/retrieval.py       — add "tree" mode alongside "local" (ChromaDB)
                                               route primary queries → tree, exploratory → ChromaDB

Phase 4: Caching
  data/tree_cache/{TICKER}_{query_hash}.json  — cache traversal results per (ticker, query)
                                               ensures determinism across study sessions
```
