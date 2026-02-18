# FinRisk — Project State
_Last updated: 17 Feb 2026_

This is the single source of truth for what the project is, what is built, and what comes next. All older formative planning documents have been moved to `docs/archive/`.

---

## 1. What This Project Is

A research prototype for running a controlled within-subjects study that measures how different levels of human-in-the-loop (HITL) oversight affect the quality and trustworthiness of AI-generated financial risk summaries from SEC 10-K filings.

**Thesis scope (frozen):** Evaluate whether HITL checkpoints improve output quality and user trust versus baseline automation, with acceptable time cost.

**Three primary outcomes:**
1. Summary quality score (blinded rubric)
2. User trust / confidence score
3. Time-on-task

---

## 2. Study Design

| | |
|---|---|
| **Participants** | 16 (P01–P16) |
| **Groups** | A (odd IDs): baseline → hitl_r → hitl_full |
| | B (even IDs): baseline → hitl_g → hitl_full |
| **Phases per participant** | 3 (each a different company ticker) |
| **Tickers** | MSFT, AAPL, TSLA, JPM, PFE, WMT, XOM, BA |
| **Counterbalancing** | Latin-square; deterministic ticker rotation |

**Four modes:**

| Mode | Retrieval | Generation | User role |
|------|-----------|------------|-----------|
| `baseline` | Automatic | Automatic | Observer |
| `hitl_r` | User selects chunks | Automatic | Curates input |
| `hitl_g` | Automatic | User edits summary | Refines output |
| `hitl_full` | User selects chunks | User edits summary | Full oversight |

---

## 3. System Architecture

```
Frontend (React + Zustand + Vite)          localhost:5173
  App.tsx → StudyChatGate → studyStore
    Screen 1: Participant ID entry
    Screen 2: Phase overview
    Screen 3: Chat stream (messages, selectors, summaries, checkpoints)
  StudyControlPanel   — admin: participant assignments
  CheckpointDashboard — admin: checkpoint definitions

Backend (FastAPI + SQLAlchemy + SQLite)    localhost:8000
  /api/sessions/*         Session lifecycle
  /api/tasks/*            Query → Retrieve → Generate → Edit
  /api/study/assignments/ Study design & participant config

  Services:
    RetrievalService → ChromaService (local) OR TreeRetrievalService (current default)
    LLMService       → OpenAI API
    StudySetup       → Latin-square counterbalancing
    AssignmentService → Default P01–P16 assignments
```

---

## 4. Retrieval Architecture (Current)

**Active mode:** `RETRIEVAL_MODE=tree` (set in `.env`)

The flat ChromaDB vector search has been replaced with **LLM-guided tree traversal** over PageIndex-built document trees.

### How it works

```
User Query
    │
    ▼
RetrievalService (mode=tree)
    │
    ▼
TreeRetrievalService
    ├── Load {TICKER}_tree.json
    ├── o3-mini (low): Pick PARTs         → traversal_path[0]
    ├── o3-mini (low): Pick Items         → traversal_path[1]
    └── o3-mini (low): Pick Sub-sections  → traversal_path[2]
    │
    ▼
RetrievalResult (nodes + traversal_path + retrieval_mode)
    │
    ▼
QueryResponse → Frontend shows breadcrumbs + node cards
    │
    ▼
HITL Selection → gpt-5.2 Synthesis → Cited Answer
```

### Key decisions

| Decision | Rationale |
|----------|-----------|
| Native EDGAR PDFs only | Playwright-rendered PDFs produce flat, broken trees. Native PDFs are free from EDGAR and produce proper nested structure. |
| o3-mini for navigation | Chain-of-thought reasoning for branch selection; fast and cheap at low effort (~$0.007/call). |
| gpt-5.2 for synthesis | Flagship quality where it matters most. |
| Tree mode is default | `.env` ships with `RETRIEVAL_MODE=tree`. |
| No sec-api subscription | EDGAR PDFs are free — $50/month saved. |

### Tree index status

| Ticker | PDF source | Tree status |
|--------|-----------|-------------|
| AAPL | EDGAR native (`aapl-20240928.pdf`) | **Done** — 41 nodes, 36 leaves, depth 3 |
| MSFT | — | Pending |
| TSLA | — | Pending |
| JPM | — | Pending |
| PFE | — | Pending |
| WMT | — | Pending |
| XOM | — | Pending |
| BA | — | Pending |

### Retrieval mode options (for reference)

| Mode | Service | Use case |
|------|---------|----------|
| `tree` | `TreeRetrievalService` | **Current default.** LLM-guided traversal of PageIndex trees. |
| `local` | `ChromaService` | Offline dev; ChromaDB vector search with all-MiniLM-L6-v2. |
| `pageindex` | `PageIndexService` | Remote PageIndex retrieval API (currently `retrieval_ready: false`). |

---

## 5. Task Pipeline

```
Query
  │
  ▼
POST /api/tasks/{id}/query  →  RetrievalService (tree mode)
  │
  ├── [after_retrieval]  HITL-R: chunk selector checkpoint
  │
  ▼
POST /api/tasks/{id}/generate  →  LLMService (gpt-5.2)
  │
  ├── [after_generation]  HITL-G: editable summary checkpoint
  │
  ▼
[post_generation]  Questionnaire checkpoint
  │  - Confidence (1–5)
  │  - Citation helpfulness (yes/partly/no)
  │  - Free-form notes
  │
  ▼
Phase complete → Advance to next phase
```

---

## 6. What Is Fully Implemented

| Capability | Status |
|---|---|
| RAG pipeline (query → retrieve → generate) | ✅ Done |
| LLM-guided tree traversal (`tree_service.py`) | ✅ Done |
| Traversal breadcrumb display in chat (`TraversalPathMessage`) | ✅ Done |
| 4 HITL modes (baseline, hitl_r, hitl_g, hitl_full) | ✅ Done |
| Stream-first message model (`messages[]` as source of truth) | ✅ Done |
| Pinned tail action zone (questionnaire, phase-advance, session-complete) | ✅ Done |
| Dual follow-up modes (chat vs search document) | ✅ Done |
| Checkpoint framework (pipeline positions, field schemas, state machine) | ✅ Done |
| Study control panel (admin: P01–P16 assignments) | ✅ Done |
| Checkpoint dashboard (admin: checkpoint definition CRUD) | ✅ Done |
| Session persistence (SQLite: sessions, tasks, participants, assignments) | ✅ Done |
| Chat history (sidebar-navigable read-only restore) | ✅ Done |
| Latin-square study design (2 groups, 3 phases, 8 tickers) | ✅ Done |
| LLM template fallback (when OpenAI unavailable) | ✅ Done |
| ChromaDB retry on stale HNSW reader | ✅ Done |

---

## 7. What Is Not Built (and Why)

| Feature | Status | Notes |
|---|---|---|
| Citation verification control | Not implemented | Designed in old arch docs; not needed for thesis |
| Risk-priority ranking control | Not implemented | Designed; not in study scope |
| SSE streaming | Superseded | Replaced by REST + loading states |
| Synthetic pipeline (`/api/synthetic/*`) | Superseded | Replaced by real ChromaDB + tree retrieval |
| Multi-document traversal | Future | Phase 4 enhancement post-eval |
| Traversal caching | Future | Phase 4 optimisation |
| Auth / RBAC | Out of scope | Controlled lab environment assumed |
| CI/CD / containerisation | Out of scope | Localhost prototype |

---

## 8. Data Collected Per Task

| Field | Description |
|---|---|
| `task_id`, `session_id`, `participant_id`, `phase`, `mode` | Identity |
| `query` | The fixed risk query for this phase |
| `retrieved_nodes` | Full JSON of retrieved chunks + traversal path |
| `selected_node_ids`, `rejected_node_ids` | Chunk curation (HITL-R/Full) |
| `generated_summary` | Original LLM output |
| `edited_summary`, `characters_edited` | User edits (HITL-G/Full) |
| `flagged_spans` | Hallucination markers with offsets and labels |
| `traversal_path` | JSON — navigation breadcrumbs from tree traversal |
| `confidence` | 1–5 self-report (questionnaire) |
| `citation_helpfulness` | yes/partly/no (questionnaire) |
| `notes` | Free-form (questionnaire) |
| `started_at`, `completed_at`, `time_on_task_seconds` | Timing |

---

## 9. Running Locally

### Prerequisites
- Python 3.11+
- Node 18+
- OpenAI API key
- PageIndex API key (only needed to build new tree indexes; not needed for retrieval)

### Setup

```bash
# 1. Copy env and fill in API keys
cp .env.example .env
# Set: OPENAI_API_KEY, PAGEINDEX_API_KEY (optional)

# 2. Create backend venv
cd src/backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# 3. Frontend deps already installed
# (node_modules present)
```

### Run

```bash
# Terminal 1 — backend (http://localhost:8000)
./run_backend.sh

# Terminal 2 — frontend (http://localhost:5173)
./run_frontend.sh
```

### Build tree indexes (one-time, per ticker)

```bash
# Download native EDGAR PDF for a ticker and save to data/10k_pdfs/
# Submit to PageIndex and get a doc_id
# Then:
python scripts/build_tree_index.py --ticker MSFT --doc-id <pageindex-doc-id>
# Output: data/tree_index/MSFT_tree.json
```

---

## 10. Immediate Next Steps

### Step 1 — UI end-to-end test (unblocks everything else)
With the backend venv created and `.env` filled in, run a full AAPL study session and verify:
- [ ] Tree traversal fires on query
- [ ] Node cards render with traversal breadcrumbs
- [ ] HITL chunk selector works (HITL-R mode)
- [ ] gpt-5.2 synthesis fires and produces a cited answer
- [ ] Editable summary works (HITL-G mode)
- [ ] Questionnaire submits and persists
- [ ] Phase advance works

### Step 2 — Ingest remaining 7 tickers
For each of MSFT, TSLA, JPM, PFE, WMT, XOM, BA:
1. Download native EDGAR 10-K PDF → `data/10k_pdfs/`
2. Submit to PageIndex → get doc_id
3. Run `scripts/build_tree_index.py`
4. Spot-check tree: Items under correct PARTs, page numbers accurate

### Step 3 — Evaluation (Phase 4)
- Compare tree retrieval vs old ChromaDB on precision/recall
- Measure latency and cost per query (target: 2–4 o3-mini calls + 1 gpt-5.2 call)
- Tune `TREE_MAX_BRANCHES` / `TREE_NAV_REASONING_EFFORT` if needed
- Test multi-query follow-ups

### Step 4 — Study readiness (before recruiting participants)
Use `docs/next-steps/07-study-ready-checklist.md` as the gate. Key items still to verify:
- Required checkpoints enforce progression (backend-authoritative)
- Questionnaire response persists to backend
- Task/session completion endpoints called from frontend
- No critical data exists only in frontend state

---

## 11. File Structure

```
src/
├── backend/app/
│   ├── main.py                        FastAPI entry + startup migration
│   ├── config.py                      Pydantic settings (tree params, model defaults)
│   ├── models/task.py                 Task ORM (includes traversal_path JSON column)
│   ├── schemas/task.py                QueryResponse + TraversalStep schema
│   ├── routers/tasks.py               /api/tasks/* — query, generate, select-nodes, edit-summary
│   └── services/
│       ├── retrieval_service.py       Mode router: tree | local | pageindex
│       ├── tree_service.py            LLM-guided tree traversal (new)
│       ├── chroma_service.py          Local ChromaDB retrieval
│       ├── pageindex_service.py       Remote PageIndex API (blocked)
│       └── llm_service.py             OpenAI synthesis
├── frontend/src/
│   ├── stores/studyStore.ts           Zustand — session, messages, history, traversal injection
│   ├── types/index.ts                 All TS types incl. TraversalStep
│   └── components/
│       ├── study/StudyChatGate.tsx    Main study UI (3 screens)
│       ├── study/StudyControlPanel.tsx Admin panel
│       ├── controls/DynamicControlRenderer.tsx  Checkpoint forms
│       ├── admin/CheckpointDashboard.tsx         Checkpoint manager
│       ├── messages/TraversalPathMessage.tsx     Breadcrumb display (new)
│       └── FormattedMarkdown.tsx      react-markdown renderer
scripts/
├── build_tree_index.py               Fetch tree from PageIndex, output {TICKER}_tree.json
├── download_10k_html.py              SEC EDGAR HTML downloader (legacy)
├── ingest_10k.py                     ChromaDB ingestion (legacy, local mode)
└── index_pageindex_documents.py      Submit PDFs to PageIndex
data/
├── tree_index/AAPL_tree.json         41 nodes, 36 leaves — ready
├── 10k_pdfs/aapl-20240928.pdf        Native EDGAR PDF
└── chroma_db/                        Legacy vector store (local mode only)
docs/
├── PROJECT_STATE.md                  ← this file
├── PRODUCT.md                        User-facing description of the app
├── SCOPE.md                          System scope and architecture decisions
├── next-steps/                       Thesis study strategy artifacts (01–08)
└── archive/                          Superseded planning docs (for reference only)
```

---

## 12. Known Limitations

| Limitation | Impact | Workaround |
|---|---|---|
| SQLite single-writer | No concurrent sessions | Sequential study administration |
| No authentication | Anyone with URL can start a session | Controlled lab environment |
| Follow-up chat not persisted | Conversational exchanges not in task record | Study focuses on primary artifacts |
| Context window for follow-ups | `assembleContext()` truncates to 8K chars | Sufficient for 300–500 word summaries |
| Template fallback is static | When OpenAI unavailable, summary is mechanical | Study sessions should use real LLM |
| Tree index only for AAPL | Other tickers fall back or fail | Build remaining 7 trees (Step 2 above) |

---

## 13. Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, TypeScript, Zustand |
| Backend | FastAPI, SQLAlchemy, Pydantic |
| Database | SQLite |
| Vector store (local mode) | ChromaDB + sentence-transformers all-MiniLM-L6-v2 |
| Tree index | PageIndex API (build-time only) + local JSON cache |
| LLM — navigation | OpenAI o3-mini (reasoning_effort: low) |
| LLM — synthesis | OpenAI gpt-5.2 |
| Styling | Plain CSS (index.css) |
