# FinRisk HITL — System Overview

> Definitive reference for the current state of the system as of February 2026.
> This document supersedes all dated design docs, progress updates, and planning files in `/docs/`.

---

## 1. What This Is

FinRisk is a research prototype for running controlled experiments that measure how different levels of **Human-in-the-Loop (HITL)** oversight affect the quality and trustworthiness of AI-generated financial risk summaries from SEC 10-K filings.

**Core idea:** A participant submits a risk-related query about a public company. The system retrieves relevant sections from the company's 10-K filing using LLM-guided tree traversal, generates a cited summary, and — depending on the study mode — gives the participant control over the retrieval, the generation, or both. The system captures every interaction for later analysis.

**This is not** a production financial tool, a general-purpose chatbot, or a deployment-ready service. It is a single-user, localhost-only research instrument designed for a specific user study.

---

## 2. Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│  Frontend (React 18 + TypeScript + Zustand + Vite)  :5173       │
│                                                                  │
│  App.tsx ──► StudyChatGate ──► studyStore (Zustand)              │
│    │           │  Screen 1: Participant ID entry                  │
│    │           │  Screen 2: Phase overview + session ledger       │
│    │           │  Screen 3: Chat stream (messages, selectors,     │
│    │           │            summaries, checkpoints, follow-ups)   │
│    │           └─ Read-only restored view (past sessions)         │
│    │                                                              │
│    ├──► StudyControlPanel (admin: assignments, participant grid)  │
│    ├──► StudyMonitor (admin: live session monitoring)             │
│    └──► CheckpointDashboard (admin: checkpoint definitions)       │
└───────────────────────┬──────────────────────────────────────────┘
                        │  HTTP (fetch)
┌───────────────────────▼──────────────────────────────────────────┐
│  Backend (FastAPI + SQLAlchemy + SQLite)             :8000       │
│                                                                  │
│  Routers:                                                        │
│    /api/sessions/*          Session lifecycle                     │
│    /api/tasks/*             Query → Retrieve → Generate → Edit   │
│    /api/study/assignments/* Study design & participant config     │
│    /api/admin/*             Study monitoring & session detail     │
│    /api/documents/*         PDF and document access               │
│                                                                  │
│  Services:                                                       │
│    RetrievalService ──► TreeService (default)                    │
│                     ──► ChromaService (local fallback)            │
│                     ──► PageIndexService (remote API)             │
│    LLMService ──► OpenAI API (gpt-5.2)                           │
│    StudySetup ──► Latin-square counterbalancing                   │
│    AssignmentService ──► Default generation for P01-P16           │
│    TemplateSummary ──► Deterministic fallback when LLM unavail.  │
└───────────────────────┬──────────────────────────────────────────┘
                        │
┌───────────────────────▼──────────────────────────────────────────┐
│  Data Layer                                                      │
│    SQLite DB ── sessions, tasks, participants, study_assignments  │
│    Tree Index ── data/tree_index/{TICKER}_tree.json (10 tickers) │
│    ChromaDB  ── 10k_{TICKER} collections (local vector fallback) │
│    10-K PDFs ── data/10k_pdfs/ (native EDGAR PDFs)               │
│    10-K HTML ── data/10k_html/ (EDGAR HTML filings)              │
└──────────────────────────────────────────────────────────────────┘
```

---

## 3. Technology Stack

| Layer | Technology | Notes |
|---|---|---|
| **Frontend** | React 18.3, TypeScript 5.5, Vite 5.4, Zustand 5.0 | Plain CSS (no framework), react-markdown + remark-gfm, react-pdf |
| **Backend** | FastAPI 0.116, SQLAlchemy 2.0, Pydantic 2.11 | Python, uvicorn |
| **Database** | SQLite | Single-file, schema migrations in `main.py` startup |
| **Vector store** | ChromaDB (local) | sentence-transformers `all-MiniLM-L6-v2` — fallback mode only |
| **Tree index** | JSON files per ticker | Built from PageIndex API via `build_tree_index.py` |
| **LLM (navigation)** | OpenAI `o3-mini` | `reasoning_effort: low` — navigates tree hierarchy at query time |
| **LLM (generation)** | OpenAI `gpt-5.2` | Generates cited risk summaries from selected chunks |
| **Document source** | SEC EDGAR | Native 10-K PDFs and HTML filings |
| **Document parsing** | PageIndex API | Extracts structural tree from PDFs |

---

## 4. Retrieval System

The system uses **LLM-guided tree traversal** as its primary retrieval mode (`RETRIEVAL_MODE=tree`). This replaced earlier flat vector search (ChromaDB) and remote semantic search (PageIndex API), both of which remain available as fallbacks.

### How it works

**Offline (one-time per ticker):** `build_tree_index.py` fetches the document tree from PageIndex API, layers a canonical SEC PART/ITEM hierarchy, splits oversized leaves, prunes empty stubs, disambiguates duplicate headings, and writes a clean JSON tree to `data/tree_index/{TICKER}_tree.json`.

**Online (every query):** `tree_service.py` loads the tree and uses `o3-mini` to navigate it level by level:

```
Query: "What are the supply chain risks?"
  │
  ├─ Level 1: o3-mini selects PART I (from [PART I, PART II, PART III, PART IV])
  ├─ Level 2: o3-mini selects Item 1A (from [Item 1, Item 1A, Item 1B, ...])
  ├─ Level 3: o3-mini selects relevant sub-sections (from leaf headings)
  │
  └─ Result: 3-8 leaf nodes with full content, plus traversal_path for auditability
```

After traversal, a hybrid re-ranking pass applies token overlap scoring and intent-based boosts to catch relevant leaves that the LLM may have missed.

### Tree index stats (10 tickers built)

AAPL, AMZN, BA, JPM, META, MSFT, PFE, TSLA, WMT, XOM — all have tree indexes in `data/tree_index/`. Quality-audited across 1,268+ leaf nodes. Key quality metrics:

- Largest leaf: <5K chars (after splitting)
- Heading-only stubs: 0 (after pruning at 150-char threshold)
- Duplicate headings: 0 (after parent-context disambiguation)
- Mid-sentence starts: 0%
- Truncated sentences: <1%

### Three retrieval modes

| Mode | Config | Backend | Use case |
|---|---|---|---|
| `tree` (default) | `RETRIEVAL_MODE=tree` | TreeService → o3-mini + JSON tree | Production queries |
| `local` | `RETRIEVAL_MODE=local` | ChromaService → all-MiniLM-L6-v2 | Offline development |
| `pageindex` | `RETRIEVAL_MODE=pageindex` | PageIndexService → remote API | Fast prototyping |

All modes return the same `RetrievalResult` interface — downstream code is mode-agnostic.

---

## 5. Study Design

### Research questions

1. **RQ1:** How does HITL feedback at different pipeline stages affect trust in AI-generated risk summaries?
2. **RQ2:** Does retrieval-level feedback (chunk selection) vs generation-level feedback (summary editing) differ in perceived control and trust?
3. **RQ3:** How does document quality (retrieval accuracy) moderate HITL effectiveness?
4. **RQ4:** What is the minimum acceptable retrieval quality for professional use?

### Four HITL modes

| Mode | Retrieval | Generation | User role |
|---|---|---|---|
| **Baseline** | Automatic | Automatic | Observer — read the summary, no intervention |
| **HITL-R** | User selects/rejects retrieved chunks | Automatic (from selected chunks) | Curates the input data |
| **HITL-G** | Automatic | User reviews and edits the summary | Refines the output |
| **HITL-Full** | User selects chunks | User edits summary | Full oversight of both stages |

### Participant flow

**16 participants** (P01–P16) in two groups, each completing 3 phases:

```
Group A (odd IDs):   Phase 1 = Baseline  →  Phase 2 = HITL-R     →  Phase 3 = HITL-Full
Group B (even IDs):  Phase 1 = Baseline  →  Phase 2 = HITL-G     →  Phase 3 = HITL-Full
```

Each participant gets 3 unique tickers across their phases, assigned from quality-tiered pools with Latin-square counterbalancing to avoid ordering and carryover effects.

### Ticker quality tiers

| Tier | Tickers | Retrieval accuracy | Role |
|---|---|---|---|
| Tier 1 (90%+) | WMT (100%), AMZN (93%), AAPL (88%) | Excellent | Primary tasks, tutorial |
| Tier 2 (80-89%) | MSFT (80%) | Good | Main tasks |
| Tier 3 (75-79%) | TSLA (75%), PFE (75%), XOM (78%) | Acceptable | Quality comparison (exploratory) |

WMT is always used for the tutorial (highest quality, guaranteed good first experience).

### Session timeline (75–90 minutes)

| Stage | Duration | Description |
|---|---|---|
| Introduction & consent | 5 min | Welcome, study overview, consent form |
| Tutorial (WMT) | 10 min | Interface walkthrough with all HITL features |
| Phase 1: Baseline | 15 min | No HITL controls, observe AI output |
| Phase 2: HITL-R or HITL-G | 20 min | One point of control (group-dependent) |
| Phase 3: HITL-Full | 20 min | Both chunk selection and summary editing |
| Post-study questionnaire | 8 min | Mode preferences, quality perceptions, demographics |
| Optional interview | 5–10 min | Semi-structured qualitative feedback |

### Pre-defined queries

Each ticker has one standardized query used for all participants:

| Ticker | Query |
|---|---|
| AAPL | Identify and summarize the supply chain and geopolitical risks facing Apple's hardware operations. |
| AMZN | What are Amazon's key operational and competitive risks in e-commerce and cloud services? |
| MSFT | What are the key technology and cybersecurity risks that could impact Microsoft's cloud business? |
| TSLA | What regulatory and safety risks does Tesla face related to its autonomous driving technology? |
| PFE | What are the key regulatory approval and patent expiration risks affecting Pfizer's drug pipeline? |
| WMT | Identify the competitive and supply chain risks facing Walmart's retail and e-commerce business. |
| XOM | What environmental and regulatory compliance risks does ExxonMobil disclose related to climate policy? |

---

## 6. Task Pipeline

Each phase follows this pipeline:

```
Query (pre-defined, shown in chat)
    │
    ▼
Retrieve (tree traversal → 3-8 chunks)
    │
    ├─ [HITL-R / HITL-Full] ► Chunk Selector checkpoint
    │                          User selects/deselects chunks
    │
    ▼
Generate (gpt-5.2 → cited summary from selected chunks)
    │
    ├─ [HITL-G / HITL-Full] ► Summary Editor checkpoint
    │                          User reviews and edits
    │
    ▼
Post-Generation Questionnaire
    │
    ▼
Phase Advance (or Session Complete)
```

### Checkpoints

| Checkpoint | Pipeline position | Modes | Purpose |
|---|---|---|---|
| **Chunk Selector** | `after_retrieval` | HITL-R, HITL-Full | Select which retrieved chunks the LLM uses |
| **Summary Editor** | `after_generation` | HITL-G, HITL-Full | Edit the AI-generated summary |
| **Questionnaire** | `post_generation` | All modes | Collect trust, accuracy, completeness, control, and feature feedback |

### Follow-ups

After a summary is generated, participants can:

- **Chat** (default): LLM answers from existing context (no retrieval). For clarification questions.
- **Search Document** (explicit button): Triggers the retrieval pipeline for new chunks. For finding additional information.

---

## 7. Data Collection

### Per task (automatic)

| Category | Fields |
|---|---|
| **Timing** | `started_at`, `completed_at`, `time_on_task_seconds` |
| **Retrieval** | `retrieved_nodes` (full JSON), `traversal_path` (navigation trace), `retrieval_mode` |
| **Selection** (HITL-R) | `selected_node_ids`, `rejected_node_ids` (with selection order) |
| **Generation** | `generated_summary` (original text) |
| **Editing** (HITL-G) | `edited_summary`, `characters_edited`, `flagged_spans` (hallucination markers) |
| **Self-report** | Questionnaire responses (completeness, accuracy, citations, control, feature usefulness, open feedback) |

### Post-study

- Mode preference ranking
- Per-ticker quality perceptions
- Deployment readiness rating
- Demographics (role, experience, AI familiarity)
- Optional semi-structured interview (recorded)

---

## 8. Chat Stream Model

Every action produces a typed message in the Zustand store's `messages[]` array — the single source of truth for the UI.

**10 message types in the stream:**

| Type | When | Content |
|---|---|---|
| `phase_start` | Phase begins | Phase number, mode, ticker |
| `text` | User/system message | Query text, system announcements |
| `loading` | Processing | "Retrieving...", "Generating..." |
| `retrieved_nodes` | After retrieval | Chunk count, collapsed preview |
| `traversal_path` | After tree retrieval | Navigation breadcrumbs (PART > Item > sub-section) |
| `selector` | HITL-R/Full modes | Checkbox list of chunks |
| `generate_prompt` | Before generation | Confirmation of chunk selection |
| `summary` | After generation | Formatted markdown with `[Section, Page N]` citations |
| `editable_summary` | HITL-G/Full modes | Editable text area |
| `submitted_checkpoint` | After questionnaire | Collapsed response card |

**3 tail action types (pinned below stream):**

| Type | When | Purpose |
|---|---|---|
| `questionnaire_prompt` | After summary | Opens the post-generation questionnaire |
| `phase_advance` | After questionnaire | Button to move to next phase |
| `session_complete` | After final phase | Session end marker |

Tail actions are pinned in a fixed CSS grid row — they never scroll off-screen.

---

## 9. API Endpoints

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/sessions/start` | Create session + first task for participant |
| GET | `/api/sessions/{id}` | Get session state |
| POST | `/api/sessions/{id}/next-phase` | Advance to next phase |
| POST | `/api/sessions/{id}/complete` | End session |
| POST | `/api/tasks/{id}/query` | Run retrieval pipeline |
| POST | `/api/tasks/{id}/generate` | Run LLM generation |
| POST | `/api/tasks/{id}/select-nodes` | Submit chunk selection (HITL-R) |
| POST | `/api/tasks/{id}/edit-summary` | Submit edited summary (HITL-G) |
| POST | `/api/tasks/{id}/chat` | Conversational follow-up (LLM only) |
| POST | `/api/tasks/{id}/complete` | Mark task complete with timing |
| GET | `/api/study/assignments` | List all participant assignments |
| GET | `/api/study/assignments/{pid}` | Get single assignment |
| PUT | `/api/study/assignments/{pid}` | Override assignment |
| POST | `/api/study/assignments/{pid}/reset` | Reset to computed defaults |
| POST | `/api/study/assignments/generate-defaults` | Regenerate all P01-P16 |
| GET | `/api/admin/overview` | Study-wide statistics |
| GET | `/api/admin/participants` | Participant list with session status |
| GET | `/api/admin/sessions/{id}` | Session detail with tasks |
| GET | `/api/admin/activity` | Recent activity feed |
| GET | `/api/documents/*` | PDF and document file access |

---

## 10. Frontend Pages

| Page | Purpose | Audience |
|---|---|---|
| **Study Chat** | Main study interface — ID entry → phase overview → chat stream | Participants |
| **Session Ledger** | Phase-by-phase summary within a session, with chunk detail view | Participants |
| **Study Control Panel** | Participant grid, phase/mode assignment editor | Admin |
| **Study Monitor** | Live session monitoring, overview stats, session detail, task drill-down | Admin |
| **Checkpoint Dashboard** | Checkpoint definition management | Admin |
| **Documents Panel** | PDF viewer overlay for source filings | Both |

---

## 11. Database Schema

| Table | Key fields | Purpose |
|---|---|---|
| `participants` | id, group, phase tickers | Participant registry |
| `sessions` | id, participant_id, current_phase, current_mode | Active study session |
| `tasks` | id, session_id, phase, mode, ticker, query_text, retrieved_nodes, selected/rejected node IDs, generated/edited summary, flagged_spans, characters_edited, traversal_path, timestamps | Per-phase task with full audit trail |
| `study_assignments` | participant_id, group, phases (JSON), status, override | Counterbalanced study design per participant |

---

## 12. Data Pipeline

### Initial setup (run once)

```
1. Download 10-K filings from SEC EDGAR
   scripts/download_10k_html.py --tickers AAPL AMZN MSFT TSLA PFE WMT XOM BA
   → data/10k_html/*.html, data/10k_pdfs/*.pdf

2. Index PDFs with PageIndex API
   scripts/index_pageindex_documents.py --tickers AAPL AMZN MSFT ...
   → data/metadata/pageindex_index_manifest.json

3. Build tree indexes from PageIndex trees
   scripts/build_tree_index.py --tickers AAPL AMZN MSFT ...
   → data/tree_index/{TICKER}_tree.json

4. (Optional) Ingest into ChromaDB for local fallback
   scripts/ingest_10k.py --tickers AAPL AMZN MSFT ...
   → data/chroma_db/
```

### Quality assurance

```
scripts/audit_chunk_quality.py     — Per-ticker leaf node quality report
scripts/tree_quality_gate.py       — Automated pass/fail quality gate
scripts/run_tree_eval_batch.py     — Batch evaluation queries across tickers
scripts/score_tree_eval.py         — Score retrieval evaluation results
```

---

## 13. File Structure

```
finrisk/
├── src/
│   ├── backend/
│   │   ├── app/
│   │   │   ├── main.py                          FastAPI entry + startup migrations
│   │   │   ├── config.py                        Pydantic settings
│   │   │   ├── db/database.py                   SQLAlchemy engine
│   │   │   ├── models/
│   │   │   │   ├── participant.py               Participant ORM model
│   │   │   │   ├── session.py                   Session ORM model
│   │   │   │   ├── task.py                      Task ORM model (+ traversal_path)
│   │   │   │   └── study_assignment.py          Assignment ORM model
│   │   │   ├── schemas/
│   │   │   │   ├── task.py                      Request/response + TraversalStep
│   │   │   │   └── admin.py                     Admin dashboard schemas
│   │   │   ├── routers/
│   │   │   │   ├── sessions.py                  /api/sessions/*
│   │   │   │   ├── tasks.py                     /api/tasks/*
│   │   │   │   ├── study_assignments.py         /api/study/assignments/*
│   │   │   │   ├── admin.py                     /api/admin/*
│   │   │   │   └── documents.py                 /api/documents/*
│   │   │   └── services/
│   │   │       ├── retrieval_service.py         Dual-mode router (tree/local/pageindex)
│   │   │       ├── tree_service.py              LLM-guided tree traversal
│   │   │       ├── chroma_service.py            Local ChromaDB vector search
│   │   │       ├── pageindex_service.py         Remote PageIndex API
│   │   │       ├── llm_service.py               OpenAI integration (gpt-5.2)
│   │   │       ├── template_summary.py          Deterministic fallback generator
│   │   │       ├── study_setup.py               Latin-square logic + ticker rotation
│   │   │       └── assignment_service.py        Default P01-P16 generation
│   │   └── requirements.txt
│   │
│   └── frontend/
│       ├── src/
│       │   ├── App.tsx                          Layout + sidebar routing
│       │   ├── types/index.ts                   All TypeScript types
│       │   ├── stores/studyStore.ts             Zustand session/messages/history
│       │   ├── data/checkpointDefinitions.ts    Checkpoint seeds + queries
│       │   ├── components/
│       │   │   ├── study/
│       │   │   │   ├── StudyChatGate.tsx        Main study UI (3 screens)
│       │   │   │   ├── StudyControlPanel.tsx    Admin: participant assignments
│       │   │   │   ├── SessionLedger.tsx        Phase-by-phase summary view
│       │   │   │   ├── LedgerPhaseCard.tsx      Individual phase card in ledger
│       │   │   │   ├── ChunkDetailView.tsx      Expanded chunk inspection
│       │   │   │   ├── ParticipantGrid.tsx      Participant assignment grid
│       │   │   │   ├── ParticipantEditor.tsx    Edit individual participant
│       │   │   │   ├── PhaseCard.tsx            Phase overview card
│       │   │   │   └── PipelinePreview.tsx      Pipeline step visualizer
│       │   │   ├── admin/
│       │   │   │   ├── StudyMonitor.tsx         Live study monitoring dashboard
│       │   │   │   ├── OverviewPanel.tsx        Study-wide stats
│       │   │   │   ├── SessionDetailPanel.tsx   Session drill-down
│       │   │   │   ├── TaskDetailModal.tsx      Task-level inspection
│       │   │   │   ├── CheckpointDashboard.tsx  Checkpoint definition manager
│       │   │   │   └── FieldSchemaBuilder.tsx   Checkpoint field schema editor
│       │   │   ├── messages/
│       │   │   │   ├── TraversalPathMessage.tsx Traversal breadcrumb display
│       │   │   │   ├── SummaryMessage.tsx       Formatted summary with citations
│       │   │   │   ├── EditableSummaryMessage.tsx  Editable summary (HITL-G)
│       │   │   │   ├── SectionSelectorMessage.tsx  Chunk selector (HITL-R)
│       │   │   │   ├── RetrievedNodesMessage.tsx   Retrieved chunk cards
│       │   │   │   └── LoadingMessage.tsx       Processing indicator
│       │   │   ├── controls/
│       │   │   │   ├── DynamicControlRenderer.tsx  Checkpoint form renderer
│       │   │   │   ├── FieldRenderer.tsx        Individual field renderer
│       │   │   │   ├── CheckpointTimeoutBar.tsx Timeout progress bar
│       │   │   │   └── CheckpointErrorBoundary.tsx  Error boundary
│       │   │   ├── MessageRenderer.tsx          Type-switch message router
│       │   │   ├── FormattedMarkdown.tsx        Markdown renderer
│       │   │   ├── DocumentsPanel.tsx           Document browser
│       │   │   └── PdfViewerOverlay.tsx         PDF viewer modal
│       │   └── index.css                        All styling (plain CSS)
│       └── package.json
│
├── scripts/
│   ├── download_10k_html.py                    SEC EDGAR downloader
│   ├── index_pageindex_documents.py            PageIndex API indexing
│   ├── build_tree_index.py                     Tree index builder
│   ├── ingest_10k.py                           ChromaDB ingestion
│   ├── audit_chunk_quality.py                  Leaf node quality audit
│   ├── tree_quality_gate.py                    Automated quality gate
│   ├── run_tree_eval_batch.py                  Batch retrieval evaluation
│   ├── score_tree_eval.py                      Evaluation scoring
│   └── inspect_assignments.py                  Assignment inspector
│
├── data/
│   ├── tree_index/                             Tree index JSON files (10 tickers)
│   ├── chroma_db/                              ChromaDB vector store
│   ├── 10k_html/                               Raw HTML filings
│   ├── 10k_pdfs/                               Native EDGAR PDFs
│   └── metadata/                               Manifests and mappings
│
├── docs/                                       Documentation (this file + archives)
├── experiments/                                Exploratory work (LlamaParse)
├── .env.example                                Environment template
└── README.md                                   Getting started guide
```

---

## 14. Configuration

All behaviour is controlled via environment variables in `.env`:

```bash
# Database
DATABASE_URL=sqlite:///./finrisk.db

# Retrieval mode (tree | local | pageindex)
RETRIEVAL_MODE=tree

# OpenAI (generation + tree navigation)
OPENAI_API_KEY=...
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-5.2

# Tree traversal tuning
TREE_NAV_MODEL=o3-mini
TREE_NAV_REASONING_EFFORT=low
TREE_MAX_BRANCHES=3
TREE_MAX_DEPTH=4
TREE_MAX_LEAVES=8

# PageIndex (for tree building + pageindex retrieval mode)
PAGEINDEX_API_KEY=...
PAGEINDEX_BASE_URL=https://api.pageindex.ai
PAGEINDEX_DOC_MAP=AAPL:doc-id-1,MSFT:doc-id-2,...

# ChromaDB (for local retrieval mode)
CHROMA_DB_PATH=./data/chroma_db
EMBEDDING_MODEL=all-MiniLM-L6-v2
```

---

## 15. Running Locally

```bash
# Backend
cd src/backend
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000

# Frontend
cd src/frontend
npm install
npm run dev

# Open http://localhost:5173
```

Swagger UI available at `http://localhost:8000/swagger`.

---

## 16. Known Limitations

| Limitation | Impact | Status |
|---|---|---|
| SQLite single-writer | Cannot run concurrent participant sessions | Acceptable — sequential study |
| No authentication | Anyone with URL can start a session | Controlled lab environment |
| Follow-up chat not persisted | Conversational exchanges not saved to task record | By design — focus on primary task |
| ChromaDB Windows/OneDrive instability | HNSW stale reader errors | Auto-retry implemented |
| No automated citation verification | LLM may hallucinate citations | Manual flagging in HITL-G (by design) |
| Template fallback is static | No real synthesis without LLM | Study sessions must use real LLM |
| Context window for follow-ups | Truncated to 8K characters | Sufficient for typical usage |

---

## 17. Documentation Map

### Current docs (in `docs/`)

| Document | Content |
|---|---|
| **SYSTEM_OVERVIEW.md** | This file — definitive system reference |
| `retrieval-architecture.md` | Deep dive on the three retrieval modes and tree traversal |
| `tree-index-pipeline-explained.md` | Step-by-step tree building transformation (raw → clean tree) |
| `USER_STUDY_DESIGN.md` | Full study protocol, questionnaire schemas, analysis plan |
| `chunk-quality-audit.md` | Quality assessment across all ticker tree indexes |
| `SAMPLE_SURVEY_FORMS.md` | Sample questionnaire forms for the study |
| `video-recording-guide.md` | Guide for creating recruitment and tutorial videos |

### Root-level docs

| Document | Content |
|---|---|
| `README.md` | Brief getting started guide |

### Archived (in `docs/archive/`)

Earlier design docs, planning files, progress updates, and evaluation results that have been superseded. Kept for historical reference but do not reflect the current system.
