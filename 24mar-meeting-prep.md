# Meeting Prep — Dr Mohammed Bahja (Second Marker)

---

## 1. Project Elevator Pitch (30 seconds)

FinRisk is a research prototype that measures how different levels of human-in-the-loop oversight affect trust in AI-generated financial risk summaries. A participant submits a query about a public company, the system retrieves relevant sections from their SEC 10-K filing using a novel LLM-guided tree traversal, generates a cited summary, and — depending on the study mode — gives the participant control over the retrieval, the generation, or both. Everything is instrumented for analysis.

---

## 2. Key Technical Talking Points

### A. Full Retrieval Pipeline — End to End

#### The Pipeline at a Glance

```
┌─────────────────────────── INDEX BUILD (offline, once per ticker) ───────────────────────────┐
│                                                                                               │
│  SEC EDGAR PDF                                                                                │
│       │                                                                                       │
│       ▼                                                                                       │
│  PageIndex API  ──► extracts structure + content from PDF                                     │
│       │              (headings, text blocks, page indices)                                     │
│       ▼                                                                                       │
│  Flattened Nodes ──► raw linear list of {title, text, page_index}                             │
│       │                                                                                       │
│       ▼                                                                                       │
│  10-K Hierarchy Builder                                                                       │
│       │  1. Extract TOC (regex → Item number/page mapping)                                    │
│       │  2. First pass: locate explicit Item headings as anchors                              │
│       │  3. Second pass: assign sub-sections to Items under PARTs                             │
│       │     (using canonical SEC Regulation S-K mapping)                                      │
│       ▼                                                                                       │
│  Post-Processing                                                                              │
│       │  1. Split large leaves (>5K chars) at embedded headings or paragraphs                 │
│       │  2. Prune empty stubs (<150 chars)                                                    │
│       │  3. Disambiguate duplicate headings (prepend parent context)                          │
│       │  4. Propagate char counts upward, generate internal node summaries                    │
│       ▼                                                                                       │
│  {TICKER}_tree.json  ──► clean hierarchical tree ready for traversal                          │
│                                                                                               │
└───────────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────── QUERY TIME (every user query) ────────────────────────────────────┐
│                                                                                               │
│  User Query: "What are the supply chain risks?"                                               │
│       │                                                                                       │
│       ▼                                                                                       │
│  Load {TICKER}_tree.json from disk  (PageIndex API is NOT called at query time)               │
│       │                                                                                       │
│       ▼                                                                                       │
│  STAGE 1: LLM-Guided Tree Traversal (o3-mini, reasoning_effort=low)                          │
│       │                                                                                       │
│       │  Loop (max 4 depth levels):                                                           │
│       │    1. Present children headings + summaries to o3-mini                                │
│       │    2. LLM returns JSON: {"selected": ["node_id_1", "node_id_2"]}                     │
│       │    3. Max 3 branches per level                                                        │
│       │    4. Descend into selected nodes, record traversal step                              │
│       │    5. If all children are leaves (≤8): return all, stop                               │
│       │                                                                                       │
│       │  Fallback: if LLM JSON fails → regex extraction of node_ids from text                 │
│       │  Output: traversed leaf nodes + traversal_path + nav_metrics                          │
│       │                                                                                       │
│       ▼                                                                                       │
│  STAGE 2: Hybrid Re-Ranking                                                                   │
│       │                                                                                       │
│       │  1. Collect ALL content nodes from entire tree (not just traversed path)               │
│       │  2. Score every node with hybrid algorithm:                                            │
│       │     ├─ Lexical matching: token overlap between query and content/heading               │
│       │     ├─ Intent-aware boosts: e.g., "supply" in query → boost supply-related headings   │
│       │     ├─ Traversal signal: +2 bonus for nodes the LLM actually visited                  │
│       │     ├─ Section preference: +0.5 for Item-level nodes                                  │
│       │     └─ Penalties: reduce score for generic sections when intent is specific            │
│       │  3. Sort by (score, char_count) descending                                            │
│       │  4. Deduplicate, return top 8                                                         │
│       │                                                                                       │
│       │  Key insight: re-ranking can OVERRIDE the LLM's traversal choices                     │
│       │  → catches relevant nodes from branches the LLM didn't explore                        │
│       │                                                                                       │
│       ▼                                                                                       │
│  3-8 Ranked Chunks (with traversal_path + nav_metrics)                                        │
│       │                                                                                       │
│       ├─ [HITL-R / HITL-Full] ──► Chunk Selector (user picks which chunks to keep)            │
│       │                                                                                       │
│       ▼                                                                                       │
│  STAGE 3: LLM Generation (gpt-5.2)                                                            │
│       │  Input: selected chunks + original query                                               │
│       │  Output: cited summary with [Section Name, Page N] references                          │
│       │                                                                                       │
│       ├─ [HITL-G / HITL-Full] ──► Summary Editor (user reviews and edits)                     │
│       │                                                                                       │
│       ▼                                                                                       │
│  Final Summary ──► Questionnaire ──► Phase Advance                                            │
│                                                                                               │
└───────────────────────────────────────────────────────────────────────────────────────────────┘
```

#### Why PageIndex? (And Why Not Open Source?)

**What PageIndex solves:** The computer vision / document understanding layer — extracting structure from PDFs:
- Visual layout parsing (headings vs body vs tables vs headers/footers)
- Hierarchy inference (bold 14pt = section heading, 10pt below = content)
- Reading order (multi-column, sidebars, footnotes, cross-page tables)
- Text extraction with page position and structural role

**What it returns:** A tree of `{title, node_id, page_index, text, children}` — structured elements, not raw text.

**Open-source alternatives exist:** Docling, Unstructured.io, LlamaParse, marker can all do PDF → structured elements. Could swap PageIndex out.

**Why a vendor API is the right architectural choice for this project:**

1. **Enterprise pattern** — in production financial services, you'd outsource document parsing to a specialist vendor with an SLA. If the parser misreads a heading, that's the vendor's liability. This is how real deployments work.
2. **Separation of concerns** — my research contribution starts where PageIndex ends. The 10-K hierarchy builder, tree traversal, and hybrid re-ranking are all custom. Using a vendor keeps the PDF parsing problem cleanly out of scope.
3. **Reproducibility** — PageIndex gives deterministic outputs for the same document. Open-source parsers vary across versions, configs, and model weights.

**Where my work begins (all custom):**
- Flattening PageIndex's generic hierarchy → rebuilding with SEC Regulation S-K structure
- TOC extraction and Item anchoring via regex
- Large leaf splitting (>5K chars → split at headings or paragraphs)
- Stub pruning (<150 chars), heading disambiguation
- The entire tree traversal engine (o3-mini navigation)
- Hybrid re-ranking (lexical + intent + traversal signal)

> **Meeting line:** "PageIndex handles document understanding — essentially a CV problem. I used a vendor API rather than open-source because it mirrors enterprise deployment: outsource parsing to a specialist, own the domain-specific retrieval logic on top. My contribution is everything after the raw structure comes back."

#### Why This Beats Standard Vector Search (RAG)

| Aspect | Traditional RAG (vector search) | Tree Traversal (this system) |
|---|---|---|
| **Document model** | Bag of chunks — flat, no hierarchy | Structured tree — mirrors actual document layout |
| **Retrieval method** | Embed query → cosine similarity against all chunks | LLM navigates hierarchy level-by-level, like a human scanning a TOC |
| **Structural awareness** | None — doesn't know Item 1A is under PART I | Full — traversal path shows exact location in document |
| **Domain sensitivity** | Embedding model conflates domain terms (e.g., "material weakness") | LLM understands financial context when selecting sections |
| **Explainability** | "Here are the 5 most similar chunks" (opaque scores) | "I went PART I → Item 1A → Supply Chain Risks" (auditable trace) |
| **Coverage** | May retrieve 5 chunks from same section, miss others | Hybrid re-ranking catches relevant nodes from unexplored branches |
| **Accuracy** | ~60-70% on complex structured docs | 75-100% across 10 SEC filings |
| **Offline dependency** | Embedding model + vector DB | Pre-built JSON tree (fast, no inference at load time) |
| **Query-time cost** | One embedding call + similarity search | 2-4 LLM calls (o3-mini, reasoning_effort=low) + lexical scoring |

#### Important Nuance: Two-Stage Retrieval

The system doesn't blindly trust the LLM's navigation. After traversal:
1. It walks the **entire tree** and collects all content nodes
2. It scores **every node** using lexical matching + intent boosts
3. LLM-traversed nodes get a **small bonus (+2)** but don't dominate
4. This means a highly relevant node that the LLM missed can still rank above a traversed node

This is the key architectural insight — the LLM provides a strong signal, but the hybrid re-ranker is the final arbiter.

### B. Chat Stream UX + Session Architecture

**Not a chatbot — a structured research instrument:**
- 10 typed message types in a single Zustand stream (phase_start, text, loading, retrieved_nodes, traversal_path, selector, generate_prompt, summary, editable_summary, submitted_checkpoint)
- 3 tail action types pinned below the stream (questionnaire, phase_advance, session_complete)
- Every interaction is captured: timing, selections, edits, character counts, flagged spans

**Session map:**
- Participant enters ID → sees phase overview with pipeline preview → enters chat
- 3 phases per participant: Baseline → HITL-R or HITL-G → HITL-Full
- Each phase follows: Query → Retrieve → [Checkpoint?] → Generate → [Checkpoint?] → Questionnaire → Advance
- Session ledger provides phase-by-phase summary with chunk detail drill-down

**Follow-up system:**
- "Chat" (default): LLM answers from existing context — no new retrieval
- "Search Document" (explicit): triggers the full retrieval pipeline again
- This distinction is deliberate — separates clarification from exploration

### C. Explainability

**Traversal path as explanation:**
- After every retrieval, the UI shows: `PART I > Item 1A: Risk Factors > Supply Chain and Manufacturing`
- This is not cosmetic — it's the actual navigation trace from the LLM's tree traversal
- Participants can see *why* the system retrieved what it retrieved
- In HITL-R/Full modes, they can then override: deselect irrelevant chunks, keep relevant ones

**Citation grounding:**
- Generated summaries include `[Section Name, Page N]` inline citations
- Participants can verify against the source PDF via the documents panel
- In HITL-G mode, participants can flag suspected hallucinations

**Audit trail:**
- Every task stores: retrieved_nodes (full JSON), traversal_path, selected/rejected node IDs, original summary, edited summary, characters_edited, flagged_spans, timestamps

### D. Observability & Admin Tooling

**Study Monitor (admin dashboard):**
- Live session monitoring — see which participant is active, what phase they're in
- Overview stats: total sessions, completion rates, active participants
- Session detail drill-down: task-level inspection with full retrieval + generation data

**Study Control Panel:**
- Participant grid showing all P01-P16 assignments
- Phase/mode/ticker assignment editor with Latin-square counterbalancing
- Can override or reset individual assignments

**Data collection is automatic:**
- Timing (started_at, completed_at, time_on_task_seconds)
- Self-report (Likert scales: trust, accuracy, completeness, control, feature usefulness)
- Behavioural (which chunks selected/rejected, how much text edited, what was flagged)

---

## 3. Study Design Highlights

- 4 HITL modes: Baseline, HITL-R (retrieval control), HITL-G (generation control), HITL-Full (both)
- 16 participants in 2 groups, Latin-square counterbalanced
- 10 tickers across 3 quality tiers (75-100% retrieval accuracy)
- 4 research questions targeting trust, control, quality moderation, and minimum quality thresholds
- Pre-defined standardised queries per ticker for comparability
- 75-90 minute sessions via Teams, including tutorial (WMT), 3 phases, post-study questionnaire, optional interview

---

## 4. Challenges to Discuss Openly

| Challenge | Detail | Current Mitigation |
|---|---|---|
| Document parsing inconsistency | SEC 10-K filings have no enforced structural standard — heading formats, tables, cross-references vary wildly | Quality-tiered tickers, automated quality gate, manual audit of 1,268+ leaf nodes |
| Small sample size (N=16) | Underpowered for detecting small effects | Frame as exploratory/descriptive, lean on qualitative data, within-subjects design gives 48 observations |
| Fixed mode ordering | Baseline → partial → Full always — learning effects confounded | Argue realistic onboarding; counterbalance tickers to isolate document effects |
| LLM non-determinism | Same query may produce different chunks/summaries across participants | Hybrid re-ranking stabilises retrieval; could seed/cache per ticker (not yet implemented) |
| No ground truth | No "correct" risk summary to validate against | Rely on expert self-report + between-mode comparisons + qualitative interviews |
| Follow-up data loss | Chat follow-ups not persisted to task record | By design (focus on primary task), but screen recording captures it |

---

## 5. Questions to Ask Dr Bahja

### On methodology & NLP expertise
- Given your background in opinion mining, how would you approach measuring summary quality when there's no ground truth? Any sentiment/opinion-based metrics that could complement self-report?
- Do you think the 4-mode HITL framework is too ambitious for an MSc thesis, or does the structured design (fixed queries, counterbalancing) make it manageable?
- Would you recommend any specific qualitative analysis frameworks for the interview data (e.g., thematic analysis, grounded theory)?

### On the technical approach
- The tree traversal approach is novel for financial document retrieval — do you see this being publishable as a standalone contribution separate from the user study?
- Any thoughts on how to handle LLM non-determinism in a controlled experiment? Caching/seeding vs accepting variability?
- What's your view on using reasoning models (o3-mini) for structured navigation vs more conventional classification approaches?

### On opportunities
- You mentioned potential opportunities — are you thinking about extending this into a publication or further research?
- Would this work fit into any of your current research directions (NLP, GenAI, LLMs/LAMs)?
- Are there any PhD students or research groups at Birmingham working on similar HITL/RAG topics I should connect with?

### On his experience
- In your consultancy work (NHS, Aramco etc.), have you encountered similar challenges with document-grounded AI systems and user trust?
- What's your perspective on the practical deployment gap between research prototypes like this and production AI tools?

---

## 6. Intersections — His Work & Mine

| His Area | My Project | Overlap |
|---|---|---|
| **NLP / Opinion Mining** (PhD topic) | Measuring user opinions about AI outputs via structured questionnaires and Likert scales | Both deal with extracting/measuring subjective judgements — his with text, mine with structured instruments |
| **Generative AI & LLMs** | Using gpt-5.2 for summary generation, o3-mini for tree navigation | Direct overlap — he researches the models, I'm building applied systems with them |
| **Large Action Models (LAMs)** | LLM-guided tree traversal is essentially an LLM taking sequential actions (navigate, select, prune) | Tree traversal is an agentic pattern — the LLM acts, observes, decides next step |
| **Human-in-the-Loop AI** | Core thesis topic — 4 HITL modes measuring trust and control | His consultancy (NHS, Aramco) likely involves HITL considerations for deployed AI |
| **AI Strategy & Consultancy** | My work at Access on payroll compliance AI (see below) | Both bridge academia and industry AI applications |
| **Digital Twins** | Session replay/audit trail as a "digital twin" of the study interaction | Stretch, but the full audit trail enables post-hoc reconstruction of every participant session |
| **EU Research Projects (PolicyCompass)** | Causal models, policy indicators, open data | Both use structured data (SEC filings / policy data) to support decision-making with AI |

---

## 7. My Current Role — The Access Group

**Role:** Working at The Access Group on payroll compliance systems.

**What Access does:** Enterprise software for HR, payroll, finance — used by thousands of UK businesses. Payroll compliance is high-stakes: HMRC regulations, tax codes, statutory payments, pension auto-enrolment — errors have legal and financial consequences.

**AI integration (early phase):**
- Exploring how AI can assist with compliance checking and rule interpretation
- Payroll regulations change frequently (budget updates, threshold changes) — similar challenge to my thesis: keeping AI systems grounded in authoritative source documents
- Early stage — investigating where AI adds value vs where deterministic rule engines are safer
- Trust is the central question here too: payroll professionals need to trust AI recommendations before acting on them

**Connection to thesis:**
- Same core problem: how do you build trust in AI-generated outputs in a domain where accuracy matters?
- Financial risk summaries (thesis) and payroll compliance (work) both require grounding in authoritative documents
- HITL patterns from the thesis could inform how Access designs human oversight for AI compliance tools
- The "minimum acceptable quality" question (RQ4) maps directly to production deployment decisions

---

## 8. What to Demo (If He Asks)

1. **Tree traversal in action** — run a query, show the traversal path appearing in real-time
2. **Chunk selector (HITL-R)** — expand chunks, deselect irrelevant ones, show how generation changes
3. **Summary editor (HITL-G)** — edit the summary, show character tracking
4. **Session ledger** — phase-by-phase summary of a completed session
5. **Study Monitor** — admin view showing participant progress
6. **Tree index file** — open `AAPL_tree.json` to show the hierarchical structure
7. **Code: tree_service.py** — the core navigation logic
