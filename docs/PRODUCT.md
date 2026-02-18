# FinRisk HITL Prototype

A research platform for studying how **Human-in-the-Loop (HITL)** controls affect the quality and trustworthiness of AI-generated financial risk summaries from SEC 10-K filings.

---

## Part 1 — Engineering & Architecture

### What We Built

A full-stack prototype that runs a controlled within-subjects study comparing four levels of human oversight over a RAG (Retrieval-Augmented Generation) pipeline:

| Mode | Retrieval | Generation | User Role |
|------|-----------|------------|-----------|
| **Baseline** | Automatic | Automatic | Observer — no intervention |
| **HITL-R** | User selects/rejects retrieved chunks | Automatic (from selected chunks) | Curates the input data |
| **HITL-G** | Automatic | User reviews and edits the summary | Refines the output |
| **HITL-Full** | User selects chunks | User edits summary | Full oversight of both stages |

### System Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│  Frontend (React + Zustand + Vite)          localhost:5173       │
│                                                                  │
│  App.tsx ──► StudyChatGate ──► studyStore (Zustand)              │
│    │           │  Screen 1: Participant ID entry                  │
│    │           │  Screen 2: Phase overview                        │
│    │           │  Screen 3: Chat stream (messages, selectors,     │
│    │           │            summaries, checkpoints)               │
│    │           └─ Read-only restored view (past sessions)         │
│    │                                                              │
│    ├──► StudyControlPanel (admin: assignments, stats)             │
│    └──► CheckpointDashboard (admin: checkpoint definitions)       │
└───────────────────────┬──────────────────────────────────────────┘
                        │  HTTP (fetch)
┌───────────────────────▼──────────────────────────────────────────┐
│  Backend (FastAPI + SQLAlchemy + SQLite)     localhost:8000       │
│                                                                  │
│  Routers:                                                        │
│    /api/sessions/*          Session lifecycle                     │
│    /api/tasks/*             Query → Retrieve → Generate → Edit   │
│    /api/study/assignments/* Study design & participant config     │
│                                                                  │
│  Services:                                                       │
│    RetrievalService ──► ChromaService (local) OR PageIndexService │
│    LLMService ──► OpenAI API (gpt-4o-mini)                       │
│    StudySetup ──► Latin-square counterbalancing                   │
│    AssignmentService ──► Default generation for P01-P16           │
└───────────────────────┬──────────────────────────────────────────┘
                        │
┌───────────────────────▼──────────────────────────────────────────┐
│  Data Layer                                                      │
│    SQLite DB ── sessions, tasks, participants, study_assignments  │
│    ChromaDB  ── 10k_{TICKER} collections (8 tickers, ~100+       │
│                 chunks each, embedded with all-MiniLM-L6-v2)     │
│    10-K HTML ── Downloaded from SEC EDGAR                        │
└──────────────────────────────────────────────────────────────────┘
```

### Data Pipeline

```
SEC EDGAR ──► download_10k_html.py ──► data/10k_html/*.html
                                           │
                                    ingest_10k.py
                                           │
                                    ┌──────▼──────┐
                                    │  ChromaDB    │
                                    │  10k_MSFT    │
                                    │  10k_AAPL    │
                                    │  10k_TSLA    │
                                    │  10k_JPM     │
                                    │  10k_PFE     │
                                    │  10k_WMT     │
                                    │  10k_XOM     │
                                    │  10k_BA      │
                                    └─────────────┘
```

Each 10-K filing is chunked by page boundaries (~2000 chars soft max), given metadata (`node_id`, `title`, `page_index`), embedded with `all-MiniLM-L6-v2`, and stored in per-ticker ChromaDB collections.

### Study Design

**16 participants (P01-P16)** divided into two groups via Latin-square counterbalancing:

```
Group A (odd IDs):   Phase 1 = baseline    Phase 2 = hitl_r      Phase 3 = hitl_full
Group B (even IDs):  Phase 1 = baseline    Phase 2 = hitl_g      Phase 3 = hitl_full
```

Each participant gets **3 unique tickers** across their 3 phases, rotated deterministically from the 8-ticker pool to avoid ordering and carryover effects. Pre-defined risk queries per ticker ensure consistent evaluation.

### Task Pipeline (per phase)

```
                       ┌─────────────────────────────────────┐
  Query ──► Retrieve ──┤ [after_retrieval] HITL-R checkpoint  │──► Generate
                       └─────────────────────────────────────┘
                                                                     │
                       ┌─────────────────────────────────────┐       │
                       │ [after_generation] HITL-G checkpoint │◄──────┘
                       └──────────────┬──────────────────────┘
                                      │
                       ┌──────────────▼──────────────────────┐
                       │ [post_generation] Questionnaire      │
                       │   - Confidence (1-5)                 │
                       │   - Citation helpfulness (Y/P/N)     │
                       │   - Free-form notes                  │
                       └─────────────────────────────────────┘
```

### Chat Stream as Source of Truth

Every action in the study session produces a message in the Zustand store's `messages[]` array. This is the single source of truth — no ephemeral component state:

| Message Type | Persisted When | Survives Phase Advance |
|---|---|---|
| `text` (system/user) | Immediately | Yes |
| `retrieved_nodes` | After retrieval completes | Yes |
| `selector` | After retrieval (HITL-R/Full) | Yes |
| `summary` | After generation | Yes |
| `editable_summary` | After generation (HITL-G/Full) | Yes |
| `submitted_checkpoint` | After user submits/skips questionnaire | Yes |

The chat stream auto-saves to a snapshot map (`chatSnapshots`) so sidebar navigation can restore any past session.

### Key Technical Decisions

- **Dual retrieval modes**: `RETRIEVAL_MODE=local` (ChromaDB, offline-capable) vs `RETRIEVAL_MODE=pageindex` (remote API). Same `RetrievalResult` output — downstream code is mode-agnostic.
- **ChromaDB retry**: HNSW segment readers go stale on Windows/OneDrive. Auto-reset and retry on internal errors.
- **LLM citation enforcement**: System prompt requires `[Section Title, Page N]` format. Hallucination flagging in HITL-G mode.
- **Markdown rendering**: `react-markdown` for formatted summary display (headings, bold, lists, citations).
- **Checkpoint framework**: Extensible with timeouts, retries, circuit breakers. State machine: `pending → offered → active → submitted|skipped|failed|timed_out`.

### File Structure

```
src/
├── backend/
│   ├── app/
│   │   ├── main.py                          FastAPI entry + migrations
│   │   ├── config.py                        Pydantic settings
│   │   ├── db/database.py                   SQLAlchemy engine
│   │   ├── models/                          ORM models
│   │   ├── schemas/                         Pydantic request/response
│   │   ├── routers/
│   │   │   ├── sessions.py                  /api/sessions/*
│   │   │   ├── tasks.py                     /api/tasks/*
│   │   │   └── study_assignments.py         /api/study/assignments/*
│   │   └── services/
│   │       ├── retrieval_service.py          Dual-mode router
│   │       ├── chroma_service.py             Local ChromaDB
│   │       ├── pageindex_service.py          Remote PageIndex
│   │       ├── llm_service.py                OpenAI integration
│   │       ├── study_setup.py                Latin-square logic
│   │       └── assignment_service.py         Default P01-P16
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.tsx                           Layout + sidebar routing
│   │   ├── types/index.ts                    All TypeScript types
│   │   ├── stores/studyStore.ts              Zustand session/messages/history
│   │   ├── data/checkpointDefinitions.ts     Checkpoint seeds + queries
│   │   ├── components/
│   │   │   ├── study/StudyChatGate.tsx        Main study UI (3 screens)
│   │   │   ├── study/StudyControlPanel.tsx    Admin panel
│   │   │   ├── controls/DynamicControlRenderer.tsx  Checkpoint forms
│   │   │   ├── admin/CheckpointDashboard.tsx  Checkpoint manager
│   │   │   └── FormattedMarkdown.tsx          Markdown renderer
│   │   └── index.css                         All styling
│   └── package.json
├── scripts/
│   ├── download_10k_html.py                  SEC EDGAR downloader
│   ├── ingest_10k.py                         ChromaDB ingestion
│   └── index_pageindex_documents.py          Remote indexing
└── data/
    ├── chroma_db/                             Vector store
    ├── 10k_html/                              Raw filings
    └── metadata/                              Manifests
```

### Running Locally

```bash
# Backend
cd src/backend
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000

# Frontend
cd src/frontend
npm install
npm run dev

# Data ingestion (first time only)
cd scripts
pip install -r requirements-data.txt
python download_10k_html.py --tickers MSFT AAPL TSLA JPM PFE WMT XOM BA
python ingest_10k.py --tickers MSFT AAPL TSLA JPM PFE WMT XOM BA
```

---

## Part 2 — User Perspective

### What Is This?

FinRisk is a research tool that helps you explore how much human oversight is "just right" when AI generates financial risk summaries. You read real SEC 10-K filings, and the system generates risk summaries using AI — but depending on which phase you're in, you get different levels of control over the process.

### Getting Started

1. Open the app and you'll see a clean chat-style interface
2. Enter your participant ID (e.g. `P01`) and click **Load Participant**
3. You'll see your study plan: 3 phases, each analyzing a different company's annual filing
4. Click **Start Study Session** to begin

### The Three Phases

You'll go through 3 phases, each with a different company and a different level of AI assistance:

#### Phase 1 — Baseline (Observe Only)

The AI works entirely on its own. You ask a risk-related question, the system retrieves relevant sections from the 10-K filing, and generates a summary. You just read the result — no intervention needed.

What you'll see:
- A document card showing which filing is being analyzed
- Your query appears as a message
- Retrieved chunks flash briefly as a status card
- The AI-generated summary appears formatted with headings, citations, and bullet points

#### Phase 2 — Guided HITL (Retrieval or Generation)

Now you get one point of control:

**If you're in HITL-R (Retrieval) mode:**
- After the system retrieves document chunks, you see them listed with checkboxes
- Each chunk shows a truncated preview — click "Show more" to expand
- Deselect any chunks that seem irrelevant; the AI will only use your selected chunks to generate the summary

**If you're in HITL-G (Generation) mode:**
- The system retrieves and generates automatically
- You see the formatted summary with two buttons: **Looks Good** or **Edit Summary**
- If you edit, you get a text area to revise the AI's output
- Submit when satisfied — the original stays in the chat stream, and your edited version is accessible via the right panel

#### Phase 3 — Full HITL

You get both controls: first select which chunks to use, then review and edit the generated summary. This gives you maximum oversight over the entire pipeline.

### After Each Summary

Once a summary is generated (in any HITL mode), you'll see a short questionnaire:
- **Confidence**: How confident are you in this summary? (1-5 scale)
- **Citation helpfulness**: Were the inline citations useful?
- **Notes**: Any additional observations

This questionnaire stays in the chat stream permanently — it won't disappear when you move to the next phase.

### Advancing Phases

After completing a phase (summary generated + questionnaire filled), an **Advance to Phase N** button appears. Click it to move to the next company and mode. The previous phase's full transcript stays in the chat.

### Navigating Past Sessions

The sidebar shows your chat history. Click any past session to view its complete transcript in read-only mode. All messages, summaries, chunk selections, and questionnaire responses are preserved exactly as they happened.

### The Chat Stream

Everything is visible in a single scrollable transcript — think of it as a detailed audit trail:

- System messages (phase transitions, session info)
- Your queries
- Retrieved chunk summaries (collapsed, with count)
- Chunk selectors (HITL-R/Full modes, collapsed after submission)
- Generated summaries (formatted with markdown headings, bold text, and `[Section, Page N]` citations)
- Edit notices (if you modified a summary, with a link to view your version)
- Questionnaire responses (collapsed after submission, clickable to view in the right panel)
- Phase completion markers

### The Right Panel

Click "View responses" on a submitted questionnaire or "View edited version" on an edited summary to open the right panel. It shows the detail without disrupting your scroll position in the main stream.

### Key Interface Elements

| Element | What It Does |
|---------|--------------|
| Session bar | Shows participant ID, group, current phase, mode, and ticker |
| Document card | Shows the filing being analyzed (e.g., `MSFT_10-K_Annual_Report.html`) |
| Pulsing dots | System is working (retrieving or generating) |
| Chunk selector | Checkboxes to include/exclude retrieved sections |
| "Looks Good" / "Edit Summary" | Accept or modify the AI's summary |
| "Advance to Phase N" | Move to the next phase |
| Sidebar chat items | Switch between current and past sessions |

### Tips

- **Expand chunks before deciding**: Click "Show more" on retrieved sections to read the full content before selecting
- **Check citations**: The AI cites its sources as `[Section Title, Page N]` — verify these match the retrieved chunks
- **Use the right panel**: Don't lose your place in the chat — view questionnaire details and edited summaries in the side panel
- **Your edits are preserved**: If you edit a summary, both the original and your version are kept — the original stays in the stream, your edit is one click away
