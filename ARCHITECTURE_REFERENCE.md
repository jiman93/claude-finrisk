# Auditable AI Retrieval Architecture
## A Reference Pattern for Domain-Specific Document Intelligence with Human Oversight

---

## The Problem

Enterprises want to use AI over their knowledge bases — regulations, filings, contracts, policies, clinical protocols. The standard approach (embed everything, vector search, generate) breaks down on structured, high-stakes documents:

- **No structural awareness** — vector search treats a 200-page filing as a bag of text chunks
- **No explainability** — "cosine similarity = 0.82" means nothing to a compliance officer
- **No auditability** — you can't trace why the system retrieved what it retrieved
- **No human control** — users either trust the AI completely or not at all
- **Domain-agnostic** — the same pipeline for cooking recipes and financial regulations

These aren't edge cases. They're the reason enterprise AI pilots stall after the demo.

---

## The Architecture

A four-layer pattern that separates concerns, creates audit trails, and enables human oversight at every stage.

```
┌─────────────────────────────────────────────────────────────────────┐
│  LAYER 1: Document Parsing (outsourced)                             │
│                                                                     │
│  PDF/HTML ──► Vendor API ──► Structured elements                    │
│               (PageIndex, Docling, Azure Doc Intelligence,          │
│                Unstructured, LlamaParse)                             │
│                                                                     │
│  Output: {heading, text, page_index, hierarchy}                     │
│  Ownership: Vendor — SLA for parsing quality, liability transfer    │
│  Your work: Zero. This is a commodity.                              │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────────────┐
│  LAYER 2: Domain-Specific Index Building (your moat)                │
│                                                                     │
│  Generic structure ──► Domain hierarchy ──► Optimised tree index    │
│                                                                     │
│  What happens here:                                                 │
│    1. Map generic parsed output to domain-specific structure        │
│       - SEC filings: PART → Item → sub-section                     │
│       - Legal contracts: Clause → sub-clause → schedule             │
│       - Clinical trials: Phase → endpoint → adverse event           │
│       - Payroll/HR: Act → section → statutory instrument            │
│       - Insurance: Coverage → exclusion → rider                     │
│                                                                     │
│    2. Quality post-processing                                       │
│       - Split oversized nodes (>5K chars) at semantic boundaries    │
│       - Prune empty stubs (<150 chars)                              │
│       - Disambiguate duplicate headings with parent context         │
│       - Propagate metadata (char counts, summaries) upward          │
│                                                                     │
│    3. Validate with automated quality gate                          │
│       - Max leaf size, heading-only stub count, duplicate check     │
│       - Mid-sentence starts, truncated sentences                    │
│       - Per-document quality score and tier assignment               │
│                                                                     │
│  Output: Domain-structured JSON tree per document                   │
│  Ownership: You — this requires domain expertise + engineering      │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────────────┐
│  LAYER 3: Two-Stage Retrieval (your moat)                           │
│                                                                     │
│  ┌─ STAGE A: LLM-Guided Tree Traversal ─────────────────────────┐  │
│  │                                                                │  │
│  │  Query ──► Load tree ──► LLM navigates level by level         │  │
│  │                                                                │  │
│  │  At each level:                                                │  │
│  │    - Present children (headings + summaries) to reasoning LLM  │  │
│  │    - LLM selects 1-3 most relevant branches                   │  │
│  │    - Record selection as traversal step (audit trail)          │  │
│  │    - Descend into selected branches                            │  │
│  │    - Repeat until leaves reached (max 4 levels)                │  │
│  │                                                                │  │
│  │  Model choice: Reasoning model at low effort (e.g., o3-mini)  │  │
│  │    - Structured decision task, not generation                  │  │
│  │    - JSON output: {"selected": ["node_id_1", "node_id_2"]}    │  │
│  │    - 2-4 calls per query, fast and cheap                       │  │
│  │                                                                │  │
│  │  Output: Traversed leaves + traversal_path (explainability)    │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                          │                                           │
│                          ▼                                           │
│  ┌─ STAGE B: Hybrid Re-Ranking ──────────────────────────────────┐  │
│  │                                                                │  │
│  │  Safety net — scores ALL nodes in the tree, not just traversed │  │
│  │                                                                │  │
│  │  Scoring signals:                                              │  │
│  │    - Lexical: token overlap between query and content/heading  │  │
│  │    - Intent-aware: domain-specific keyword boosts              │  │
│  │    - Traversal: small bonus (+2) for LLM-navigated nodes      │  │
│  │    - Penalties: reduce score for generic sections              │  │
│  │                                                                │  │
│  │  Key property: traversal informs but doesn't dominate          │  │
│  │    - Re-ranker can override LLM's choices                     │  │
│  │    - Catches relevant content from unexplored branches         │  │
│  │    - Stabilises results across non-deterministic LLM runs      │  │
│  │                                                                │  │
│  │  Output: Top-K ranked chunks, each tagged with:                │  │
│  │    - from_traversal: true/false (provenance flag)              │  │
│  │    - score breakdown (auditable)                               │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  Combined output:                                                   │
│    - Ranked chunks with content                                     │
│    - Traversal path (human-readable navigation trace)               │
│    - Per-chunk provenance (traversal vs re-ranked)                  │
│    - Navigation metrics (model, tokens, latency)                    │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────────────┐
│  LAYER 4: Human-in-the-Loop + Generation (your moat)                │
│                                                                     │
│  Retrieved chunks                                                   │
│       │                                                             │
│       ├─ [HITL-Retrieval] Human reviews and selects chunks          │
│       │   - See traversal path (why these chunks?)                  │
│       │   - See provenance flags (traversal vs re-ranked)           │
│       │   - Select/reject individual chunks                         │
│       │   - Selection order and timing captured                     │
│       │                                                             │
│       ▼                                                             │
│  LLM Generation (flagship model, e.g., gpt-5.2)                    │
│       │   - Input: selected chunks + query                          │
│       │   - Output: cited summary with [Section, Page N] refs       │
│       │                                                             │
│       ├─ [HITL-Generation] Human reviews and edits summary          │
│       │   - Edit text, flag hallucinations                          │
│       │   - Character diff tracked, both versions preserved         │
│       │                                                             │
│       ▼                                                             │
│  Observability Layer                                                │
│       - Full audit trail per query: timing, chunks, selections,     │
│         edits, flags, traversal path, LLM metrics                   │
│       - Admin dashboard: live monitoring, session drill-down         │
│       - Post-hoc analysis: selection patterns, edit behaviour        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Why Two-Stage Retrieval

Neither stage works well alone:

| | LLM Traversal Only | Re-Ranker Only | Two-Stage (this pattern) |
|---|---|---|---|
| **Semantic understanding** | Strong — LLM reasons about meaning | None — keyword matching | LLM reasons, re-ranker validates |
| **Coverage** | Fragile — wrong turn = missed content | Exhaustive — scores everything | LLM focuses, re-ranker covers gaps |
| **Determinism** | Non-deterministic — varies across runs | Deterministic — same query = same scores | Stabilised by re-ranker |
| **Explainability** | Full — traversal path is auditable | None — just a score | Traversal path + provenance flags |
| **Cost** | 2-4 LLM calls per query | Zero LLM calls | 2-4 LLM calls (cheap reasoning model) |
| **Failure mode** | Silent miss — no way to know what was skipped | Noisy — surfaces irrelevant keyword matches | Complementary — each catches the other's failures |

The +2 traversal bonus is deliberately small. It's a tiebreaker, not a mandate. A chunk the LLM missed but the re-ranker scores high on lexical relevance still gets surfaced. A chunk the LLM navigated to but has weak lexical signal can be displaced.

---

## Retrieval Method Comparison

Four approaches to getting relevant content out of documents, ordered by sophistication:

### Level 1: Naive Chunking + Vector Search

```
Document ──► split every N tokens ──► embed each chunk ──► vector DB
Query ──► embed ──► cosine similarity ──► top-K chunks
```

**How it works:** Split the document into fixed-size chunks (e.g., 512 tokens with overlap), embed each chunk, store in a vector database. At query time, embed the query and find the most similar chunks.

**Where it works:** Simple documents, FAQs, knowledge bases with short independent articles.

**Where it breaks:**
- A heading lands in one chunk, its content in the next — you lose the connection
- Tables get split mid-row
- No awareness of document hierarchy — Item 1A and Item 7 chunks are treated the same
- "Supply chain risks" matches "supply chain management" in the business description instead of the actual risk section
- Duplicate content across chunks (overlap) wastes context window

| Pros | Cons |
|---|---|
| Dead simple to implement | Destroys document structure |
| Works out of the box | No explainability — just similarity scores |
| Fast, cheap at query time | Noisy for domain-specific terms |
| Mature tooling (LangChain, LlamaIndex) | Can't distinguish structural importance |

### Level 2: Smart Chunking + Vector Search

```
Document ──► parse structure ──► split at semantic boundaries ──► embed ──► vector DB
Query ──► embed ──► cosine similarity ──► top-K chunks (optionally re-ranked)
```

**How it works:** Use a parser to detect headings, paragraphs, tables. Split at section boundaries instead of fixed token counts. Optionally add metadata (section title, page number) to each chunk. May add a cross-encoder re-ranker after initial retrieval.

**Where it works:** Well-structured documents where sections are relatively self-contained. Significant improvement over naive chunking.

**Where it breaks:**
- Still flat — all chunks in one big pool, no hierarchy
- Semantic boundaries help, but a 200-page filing still produces 100+ chunks with no structural context
- Re-ranker improves precision but doesn't know the document's organisation
- "Which part of the document did this come from?" is still hard to answer
- Domain-specific structure (PART/Item for SEC, Clause/Sub-clause for legal) is ignored

| Pros | Cons |
|---|---|
| Respects paragraph/section boundaries | Still no hierarchy awareness |
| Metadata enrichment possible | Flat retrieval over large chunk pools |
| Cross-encoder re-ranking improves accuracy | Explainability limited to scores + metadata |
| Good balance of effort vs quality | Domain structure not leveraged |

### Level 3: Vendor Retrieval API (e.g., PageIndex Retrieval)

```
Document ──► vendor indexes and hosts ──► vendor's retrieval endpoint
Query ──► vendor API call ──► ranked results returned
```

**How it works:** Upload documents to a vendor service that handles parsing, indexing, and retrieval. You send a query via API, they return relevant sections. The vendor owns the entire pipeline — parsing, chunking strategy, embedding model, retrieval logic.

**Where it works:** Fast prototyping. When you want results without building infrastructure. When the vendor's general-purpose retrieval is good enough.

**Where it breaks:**
- Black box — you don't control or understand the retrieval logic
- No domain adaptation — vendor uses generic models, not tuned for your document type
- No structural navigation — still fundamentally similarity search under the hood
- Vendor lock-in — your retrieval quality depends on their model updates
- Limited auditability — "the API returned these results" is not an explanation
- Can't add human-in-the-loop at the retrieval stage — you get results, not a process

| Pros | Cons |
|---|---|
| Zero infrastructure to build | Black box retrieval logic |
| Fast time to demo | No domain-specific tuning |
| Vendor handles parsing quality | Vendor lock-in |
| SLA and support | Limited explainability |
| Liability transfer for parsing | Can't insert HITL checkpoints |

### Level 4: Two-Stage Retrieval (This Architecture)

```
Document ──► vendor parses ──► domain tree builder ──► structured JSON tree
Query ──► LLM navigates tree ──► hybrid re-ranker scores all nodes ──► top-K chunks
```

**How it works:** Outsource parsing to a vendor, then build a domain-specific tree index. At query time, a reasoning LLM navigates the tree top-down (like scanning a table of contents), then a lexical re-ranker scores every node in the tree and returns the best chunks — with a small bonus for nodes the LLM visited.

**Where it works:** Structured, high-stakes documents where explainability and human oversight matter. Regulatory filings, legal contracts, clinical protocols, compliance documents.

**Where it breaks:**
- Requires domain expertise to build the tree structure mapping
- More complex to implement than vector search
- LLM navigation adds latency (2-4 API calls) and cost (~$0.005/query)
- Tree builder is per-document-type — new domain = new builder
- Re-ranker is lexical, not semantic (by design, for determinism — but misses synonyms)

| Pros | Cons |
|---|---|
| Full document structure preserved | Requires domain-specific tree builder |
| Auditable traversal path | More complex than vector search |
| Two-stage catches errors from either system | LLM navigation adds latency |
| Provenance flags per chunk (traversal vs re-ranked) | Tree builder is per-domain work |
| HITL checkpoints at retrieval and generation | Lexical re-ranker misses synonyms |
| Domain-adaptable by changing tree builder | Not a drop-in replacement for RAG |
| Failure diagnosis is actionable | Requires reasoning model access |

### Side-by-Side Comparison

| | Naive Chunking | Smart Chunking | Vendor API | Two-Stage (this) |
|---|---|---|---|---|
| **Setup effort** | Hours | Days | Hours | Weeks |
| **Document structure** | Destroyed | Partially preserved | Unknown (black box) | Fully preserved |
| **Retrieval method** | Embedding similarity | Embedding + optional re-rank | Vendor's pipeline | LLM navigation + lexical re-rank |
| **Explainability** | Similarity score | Score + section metadata | None (black box) | Traversal path + provenance flags |
| **Auditability** | Low | Medium | Low | High |
| **HITL integration** | Hard | Hard | Not possible | Native — designed for it |
| **Domain adaptation** | Change embedding model | Better chunking rules | Request from vendor | Change tree builder |
| **Failure diagnosis** | "Bad embeddings" | "Wrong section boundary" | "API returned bad results" | "LLM missed PART II at D0" or "re-ranker boosted wrong node" |
| **Best for** | Simple docs, MVPs | General-purpose, moderate complexity | Fast prototyping | Regulated, high-stakes, structured docs |
| **Cost per query** | ~$0.001 | ~$0.005 | Vendor pricing | ~$0.03-0.06 |
| **Accuracy (structured docs)** | ~50-60% | ~65-75% | ~70-80% | ~75-100% |

### The Progression

Most teams follow this path naturally:

```
Start here                                                        End here
    │                                                                 │
    ▼                                                                 ▼
Naive Chunking ──► Smart Chunking ──► Vendor API ──► Two-Stage Retrieval
  "It works"       "It's better"     "It's easy"     "It's auditable"

  Week 1            Month 1           Month 2          Month 3+
  (prototype)       (improvement)     (outsource)      (production)
```

The jump from Level 3 to Level 4 is where most enterprise projects stall — it requires domain expertise, retrieval engineering, and a deliberate decision to own the retrieval logic rather than outsource it. That's the moat.

---

## Versus Standard RAG

| Aspect | Standard RAG | This Architecture |
|---|---|---|
| **Indexing** | Chunk → embed → vector DB | Parse → domain tree → JSON (no embeddings) |
| **Retrieval** | Cosine similarity search | LLM navigation + lexical re-ranking |
| **Structure** | Destroyed at chunking time | Preserved in tree hierarchy |
| **Explainability** | Similarity score (opaque) | Navigation trace (auditable) |
| **Human oversight** | None or all-or-nothing | Granular — retrieval, generation, or both |
| **Audit trail** | Query → results | Query → traversal → ranking → selection → generation → edits |
| **Domain adaptation** | Change embedding model (marginal gain) | Change tree builder (structural gain) |
| **Failure diagnosis** | "Bad embeddings" (unhelpful) | "LLM missed PART II at D0" or "re-ranker boosted irrelevant section" (actionable) |

---

## The Moat Map

What to own vs what to outsource:

```
 OUTSOURCE (commodity)                    OWN (differentiation)
 ─────────────────────                    ────────────────────
 PDF parsing                              Domain-specific tree building
 (PageIndex, Docling, Azure)              (SEC structure, legal clause maps, etc.)

 Embedding models                         Two-stage retrieval engine
 (if needed for fallback)                 (traversal + re-ranking logic)

 LLM inference                            HITL checkpoint design
 (OpenAI, Anthropic, etc.)                (where humans intervene, what they control)

 Vector DB infrastructure                 Observability & audit trail
 (Pinecone, ChromaDB, etc.)               (provenance flags, traversal paths, metrics)

 Frontend framework                       Domain UX patterns
 (React, Vue, etc.)                       (chunk selectors, summary editors, session flows)
```

The moat is the middle layer — everything between "structured elements come out of the parser" and "chunks go into the LLM for generation." This layer requires:
1. **Domain expertise** — understanding how documents are structured in the target industry
2. **Retrieval engineering** — the traversal + re-ranking design
3. **Observability design** — what to capture, how to surface it, where humans intervene

These are not automatable and not commoditised. They're different for every domain.

---

## Applying to Other Domains

The architecture is domain-agnostic at the pattern level. Only Layer 2 (tree building) changes per domain:

### Financial Services (SEC Filings) — implemented
```
Tree structure: PART → Item → Sub-section
Key sections: Item 1A (Risk Factors), Item 7 (MD&A), Item 8 (Financial Statements)
Quality gate: Retrieval accuracy against standardised queries
```

### Legal (Contracts & Legislation)
```
Tree structure: Part → Clause → Sub-clause → Schedule/Annex
Key sections: Definitions, Representations & Warranties, Indemnification, Termination
Quality gate: Clause completeness, cross-reference resolution
```

### Healthcare (Clinical Protocols & Drug Labels)
```
Tree structure: Phase → Study Design → Endpoint → Adverse Event Category
Key sections: Inclusion/Exclusion, Primary Endpoints, Safety Data, Contraindications
Quality gate: Section coverage, dosage table integrity
```

### Payroll & HR Compliance
```
Tree structure: Act → Part → Section → Statutory Instrument → Guidance Note
Key sections: Tax codes, thresholds, statutory payments, pension rules
Quality gate: Version currency (regulation date), cross-reference integrity
HITL critical: Regulations change frequently — human must verify currency
```

### Insurance (Policies)
```
Tree structure: Coverage Section → Exclusion → Rider → Endorsement
Key sections: Declarations, Insuring Agreement, Exclusions, Conditions
Quality gate: Exclusion completeness, coverage gap detection
```

---

## Enterprise Deployment Considerations

### What changes from research prototype to production

| Concern | Research Prototype | Production |
|---|---|---|
| **Document parsing** | Single vendor (PageIndex) | Multi-vendor with fallback, SLA monitoring |
| **Tree building** | Offline script, manual trigger | CI/CD pipeline, triggered on new document ingestion |
| **Tree storage** | JSON files on disk | Versioned document store (S3/GCS), diff tracking |
| **LLM navigation** | Single model (o3-mini) | Model routing, latency-based fallback, cost monitoring |
| **Re-ranking** | Lexical scoring | Add cross-encoder re-ranking (Cohere, ColBERT) for precision |
| **HITL** | All users see all controls | Role-based: analysts get full control, end-users get summaries |
| **Audit trail** | SQLite, single-user | Event-sourced log, immutable, compliance-grade retention |
| **Observability** | Admin dashboard | Grafana/Datadog, alerting on retrieval quality degradation |
| **Concurrency** | Single-user, sequential | Queue-based, async retrieval, connection pooling |
| **Auth** | None (lab environment) | SSO, RBAC, document-level access control |
| **Document freshness** | Static snapshots | Scheduled re-indexing, version-aware tree diffs |

### Cost model (per query, approximate)

| Component | Cost | Notes |
|---|---|---|
| Tree loading | ~0 | JSON from disk/cache |
| LLM navigation (3 calls, o3-mini low) | ~$0.002-0.005 | ~2500 input + 500 output tokens |
| Lexical re-ranking | ~0 | CPU only, no inference |
| LLM generation (1 call, flagship) | ~$0.02-0.05 | Depends on chunk volume |
| **Total per query** | **~$0.03-0.06** | Comparable to standard RAG with re-ranking |

### Key architectural decisions for production

1. **Cache traversal results** — same query + same document version = same traversal. Cache aggressively.
2. **Version trees, not documents** — when a document is re-parsed, rebuild the tree and version it. Old queries reference old tree versions for reproducibility.
3. **Instrument everything** — every traversal step, every re-ranking score, every human selection. This is your compliance evidence and your debugging tool.
4. **Separate navigation model from generation model** — they have different requirements (speed vs quality). Route independently.
5. **Design HITL for the 80/20** — most queries don't need human review. Build confidence scoring to flag uncertain retrievals for human attention.

---

## Summary

This architecture replaces the standard RAG pattern (embed → search → generate) with a structured alternative (parse → domain tree → navigate → re-rank → generate) that adds:

- **Explainability** — traversal paths show why chunks were retrieved
- **Auditability** — provenance flags distinguish AI reasoning from keyword matching
- **Human oversight** — granular control points at retrieval and generation stages
- **Domain adaptation** — tree builder encodes industry-specific document structure
- **Failure diagnosis** — when retrieval is wrong, you can pinpoint where (navigation vs re-ranking)

The moat is the middle layer: domain-specific tree building, two-stage retrieval, and the observability/HITL design. Document parsing and LLM inference are commodities — outsource them. The value is in what you build between them.
