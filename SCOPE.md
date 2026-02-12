# FinRisk — System Scope

> Canonical reference for what the system **is**, what it **is not**, and where the boundary sits between implemented features and future work. Updated to reflect the current state of the codebase after exploratory development.

---

## 1. What FinRisk Is

### 1.1 One-line definition

A research prototype for running controlled within-subjects experiments that measure how different levels of human-in-the-loop (HITL) oversight affect the quality and trustworthiness of AI-generated financial risk summaries from SEC 10-K filings.

### 1.2 Core capabilities

| Capability | Status | Description |
|---|---|---|
| **RAG pipeline** | Implemented | Query → Retrieve (ChromaDB or PageIndex) → Generate (OpenAI GPT-4o-mini) with template fallback |
| **4 HITL modes** | Implemented | Baseline, HITL-R (retrieval control), HITL-G (generation control), HITL-Full (both) |
| **Study protocol** | Implemented | 16 participants (P01-P16), 2 groups, 3 phases, Latin-square counterbalancing, deterministic ticker rotation |
| **Stream-first UI** | Implemented | Single `messages[]` array as source of truth, pure type-switch renderer, all actions are typed entries |
| **Pinned tail actions** | Implemented | Questionnaire prompts, phase-advance buttons, and session-complete markers rendered outside the scrollable stream in a fixed zone |
| **Dual follow-up modes** | Implemented | Conversational follow-ups (LLM-only, default) and document search follow-ups (retrieval pipeline, explicit) |
| **Checkpoint framework** | Implemented | Extensible control system with pipeline positions, field schemas, and state machines |
| **Study control panel** | Implemented | Admin UI for viewing/editing participant assignments (P01-P16), group allocation, phase overrides |
| **Checkpoint dashboard** | Implemented | Admin UI for managing checkpoint definitions |
| **Session persistence** | Implemented | SQLite-backed sessions, tasks, participants, and study assignments with full audit trail |
| **Chat history** | Implemented | Sidebar-navigable snapshots of past sessions (read-only restore) |

### 1.3 System boundaries

```
                    ┌─────────────────────────────────────────┐
                    │             FinRisk Scope                │
                    │                                         │
  SEC EDGAR ───────►│  Ingest ──► Retrieve ──► Generate ──►  │
  (10-K filings)    │                                         │
                    │  HITL Controls:                          │
                    │    Chunk selection (HITL-R)              │
                    │    Summary editing (HITL-G)              │
                    │    Post-generation questionnaire         │
                    │    Conversational follow-ups             │
                    │                                         │
                    │  Study Management:                       │
                    │    Participant assignment                │
                    │    Phase progression                     │
                    │    Data collection (timing, edits, flags)│
                    └─────────────────────────────────────────┘
```

---

## 2. What FinRisk Is Not

| Not this | Why |
|---|---|
| **Not a production financial tool** | Prototype for academic study only. No SLA, no multi-tenancy, no auth. |
| **Not a general-purpose chatbot** | The LLM is constrained to answer from provided context only. It does not have open-ended conversational ability. |
| **Not a document management system** | 10-K filings are pre-ingested. There is no upload, indexing, or document lifecycle UI. |
| **Not a real-time data platform** | Works against static annual filings, not live market data or streaming feeds. |
| **Not multi-user concurrent** | Single-participant-at-a-time study flow. No user accounts, no authentication, no role-based access. |
| **Not a deployment-ready service** | SQLite database, no containerisation, no CI/CD, no monitoring. Runs on localhost. |
| **Not a scoring or grading system** | Collects participant responses (confidence, edits, flags) but does not compute quality scores or statistical analysis. Analysis happens offline. |
| **Not a citation verification engine** | LLM is prompted to cite sources as `[Section Title, Page N]`, but there is no automated verification that citations are accurate. Hallucination flagging is manual (HITL-G mode). |

---

## 3. Architecture Decisions (Settled)

These decisions were made during exploratory development and are now fixed.

### 3.1 Stream-first message model

Every visual element in the study UI is a typed entry in the Zustand store's `messages[]` array. The React renderer is a pure type-switch — no injection logic, no conditional scanning.

**10 message types in the stream:**
`phase_start` · `text` · `loading` · `retrieved_nodes` · `selector` · `generate_prompt` · `summary` · `editable_summary` · `submitted_checkpoint` · `follow_up_divider`

**3 tail action types (pinned outside stream):**
`questionnaire_prompt` · `phase_advance` · `session_complete`

### 3.2 Pinned tail action zone

Flow-control elements (questionnaire prompts, phase-advance buttons, session-complete markers) are **not** in the scrollable message stream. They live in a separate `tailAction` state slot rendered in a fixed CSS grid row between the stream and the follow-up input bar.

**Rationale:** Follow-up queries append to `messages[]`. If tail actions were in the array, new messages would push them off-screen or require insertion logic. Pinning them guarantees they are always visible regardless of follow-up scroll position.

### 3.3 Dual follow-up strategy

After a summary is generated, the user can:

1. **Chat** (default, Enter key): Sends the query to `/api/tasks/{id}/chat`. The LLM answers from existing context (summary + prior exchanges). No retrieval. Response appears as an assistant text message in the stream.

2. **Search Document** (explicit button): Sends the query to `/api/tasks/{id}/query`. Triggers the retrieval pipeline. Retrieved chunks appear as a `retrieved_nodes` message in the stream.

**Rationale:** Most follow-ups are conversational ("give me a shorter version", "what does this mean?"). Routing every follow-up through retrieval was slow and produced irrelevant chunks. Separating the two modes gives the user explicit control over when new document search is needed.

### 3.4 Dual retrieval backend

The retrieval service is mode-agnostic. Set `RETRIEVAL_MODE=local` for ChromaDB (offline development) or `RETRIEVAL_MODE=pageindex` for the remote PageIndex API. Both produce the same `RetrievalResult` shape. Downstream code does not know which backend was used.

### 3.5 LLM with template fallback

If OpenAI is unavailable or fails, the generation endpoint falls back to a deterministic template that formats retrieved node content into a structured summary. This ensures the study UI remains functional without an API key during development.

### 3.6 Study design: 2-group, 3-phase, within-subjects

```
Group A (odd IDs):   baseline → hitl_r    → hitl_full
Group B (even IDs):  baseline → hitl_g    → hitl_full
```

- 16 participants, 8 tickers, Latin-square counterbalancing
- Deterministic ticker rotation avoids ordering/carryover effects
- Pre-defined risk queries per ticker for consistent evaluation

---

## 4. Data Model

### 4.1 What is persisted (SQLite)

| Table | Key Fields | Purpose |
|---|---|---|
| `participants` | id, group, phase tickers | Participant registry |
| `sessions` | id, participant_id, current_phase, current_mode | Active study session |
| `tasks` | id, session_id, phase, mode, ticker, query, retrieved_nodes, selected/rejected node IDs, generated/edited summary, flagged_spans, characters_edited, timestamps | Per-phase task with full audit trail |
| `study_assignments` | participant_id, group, phases (JSON), status, override | Counterbalanced study design per participant |

### 4.2 What is collected per task

- **Timing:** started_at, completed_at, time_on_task_seconds
- **Retrieval:** retrieved_nodes (full JSON), selected_node_ids, rejected_node_ids (with selection order)
- **Generation:** generated_summary (original), edited_summary (if modified), characters_edited
- **Quality flags:** flagged_spans (hallucination markers with start/end offsets and labels)
- **Self-report:** confidence (1-5), citation_helpfulness (yes/partly/no), free-form notes

### 4.3 What is NOT persisted

- Conversational follow-up exchanges (chat replies live in frontend `messages[]` only, not saved to task record)
- Individual follow-up retrieval results (appended to stream, not to the task's `retrieved_nodes`)
- Frontend UI state (scroll position, panel open/closed, sidebar selection)

---

## 5. API Surface

### 5.1 Implemented endpoints

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

### 5.2 Endpoints referenced in README but superseded

| Endpoint | Status | Notes |
|---|---|---|
| `POST /api/synthetic/retrieve` | Superseded | Replaced by real ChromaDB retrieval |
| `POST /api/synthetic/generate` | Superseded | Replaced by real OpenAI generation + template fallback |
| `GET /api/synthetic/chat/stream` | Superseded | SSE streaming replaced by REST request/response pattern |

---

## 6. Frontend Pages

| Page | Route Key | Purpose |
|---|---|---|
| **Study Chat** | `chat` | Main participant-facing study UI — 3 screens (ID entry, phase overview, chat stream) |
| **Study Control Panel** | `study` | Admin view — participant grid, phase/mode assignment editor |
| **Checkpoint Dashboard** | `dashboard` | Admin view — checkpoint definition CRUD |

---

## 7. What Remains from the Original Spec but Is Not Yet Built

The original `SYSTEM_DESIGN_FRAMEWORK.md` and `PRODUCT.md` describe some capabilities that were designed but not implemented during the exploratory phase:

| Feature | Spec Reference | Current Status |
|---|---|---|
| **Citation verification control** | SYSTEM_DESIGN_FRAMEWORK §Planned Control Extensions | Not implemented. Spec describes `mark supported / weak / missing` but no renderer or submit handler exists. |
| **Risk-priority ranking control** | SYSTEM_DESIGN_FRAMEWORK §Planned Control Extensions | Not implemented. Spec describes drag/reorder with rationale. |
| **Policy/compliance override control** | SYSTEM_DESIGN_FRAMEWORK §Planned Control Extensions | Not implemented. |
| **Source conflict resolver** | SYSTEM_DESIGN_FRAMEWORK §Planned Control Extensions | Not implemented. |
| **Confidence calibration card** | SYSTEM_DESIGN_FRAMEWORK §Planned Control Extensions | Not implemented. |
| **Typed control registry** | SYSTEM_DESIGN_FRAMEWORK §Control Registry Sketch | Partially implemented. `DynamicControlRenderer` + `FieldRenderer` exist, but the full `ControlModule<T>` generic registry pattern from the spec is not implemented. Controls are rendered via simpler type-switch. |
| **Right-pane artifact inspection** | SYSTEM_DESIGN_FRAMEWORK §Right Pane Framework | Partially implemented. Right pane exists but not all `View ...` actions are wired from every control type. |
| **Mock retrieval scenarios** | README §Provider Wiring | Superseded. The `MOCK_RETRIEVAL_SCENARIO` system (happy_path, slow_processing, etc.) was for synthetic development. Real ChromaDB and PageIndex retrieval replaced it. |
| **SSE streaming** | README §Synthetic Pipeline | Superseded. The `GET /api/synthetic/chat/stream` SSE endpoint was replaced by REST request/response pattern with loading states. |

---

## 8. Known Limitations

| Limitation | Impact | Workaround |
|---|---|---|
| **SQLite single-writer** | Cannot run concurrent participant sessions against the same database | Acceptable for sequential study administration |
| **No authentication** | Anyone with the URL can start a session as any participant ID | Controlled lab environment assumed |
| **Follow-up chat not persisted** | Conversational exchanges after summary generation are not saved to the task record | Data collection focuses on primary task artifacts (summary, edits, flags, timing) |
| **ChromaDB Windows/OneDrive instability** | HNSW segment stale reader errors on first query | Auto-retry with client reset (implemented) |
| **No automated citation accuracy check** | LLM may hallucinate citations that don't match source sections | Hallucination flagging is manual (HITL-G), which is by design for the study |
| **Template fallback is static** | When LLM is unavailable, the generated summary is a mechanical formatting of node content, not a true synthesis | Acceptable for development; study sessions should use real LLM |
| **Context window for follow-ups** | `assembleContext()` truncates to 8K characters | Sufficient for typical 300-500 word summaries + a few follow-up exchanges |

---

## 9. Technology Stack (Locked)

| Layer | Technology | Version Constraint |
|---|---|---|
| Frontend | React 18, Vite, TypeScript, Zustand | As per package.json |
| Backend | FastAPI, SQLAlchemy, Pydantic | As per requirements.txt |
| Database | SQLite | Single-file, no migration framework |
| Vector store | ChromaDB (local) or PageIndex (remote) | Sentence-transformers all-MiniLM-L6-v2 for local |
| LLM | OpenAI API (gpt-4o-mini default) | Any OpenAI-compatible endpoint |
| Styling | Plain CSS (index.css) | No CSS framework, no preprocessor |

---

## 10. Extending the System

The checkpoint framework is designed for extension. To add a new HITL control:

1. Define a `CheckpointDefinition` with `control_type`, `pipeline_position`, and `field_schema`
2. Add a renderer case in `DynamicControlRenderer`
3. Add a submit handler in the Zustand store
4. Set `applicable_modes` to control which study modes show the checkpoint
5. The chat stream, tail zone, and phase progression handle the rest automatically

New retrieval backends follow the same pattern — implement the `retrieve(ticker, query) → RetrievalResult` interface and register in `RetrievalService`.

---

## 11. Glossary

| Term | Definition |
|---|---|
| **Phase** | One of 3 study blocks. Each phase has a mode, ticker, and query. |
| **Mode** | Level of HITL control: baseline, hitl_r, hitl_g, or hitl_full. |
| **Task** | A single query→retrieve→generate→edit cycle within a phase. |
| **Tail action** | A flow-control element pinned below the scrollable stream (questionnaire prompt, phase advance, session complete). |
| **Checkpoint** | A structured HITL control point (chunk selector, summary editor, or questionnaire) rendered at a specific pipeline position. |
| **Stream message** | A typed entry in the `messages[]` array that the renderer displays. |
| **Follow-up (chat)** | A conversational query answered by the LLM from existing context, no retrieval. |
| **Follow-up (search)** | A document query that triggers the retrieval pipeline for new chunks. |
| **Ticker** | A stock symbol (MSFT, AAPL, etc.) identifying which 10-K filing to analyse. |
| **Node** | A retrieved chunk from a 10-K filing, with node_id, title, page_index, and content. |
