# 28 March 2026 - System State & v2 Transition Plan

> Snapshot of the FinRisk system as of 28 March 2026, documenting the current (v1) implementation and the changes required to support the revised User Study v2 design.
> This document serves as a reference for the dissertation's system description and methodology chapters.

---

## 1. Context

### Why this document exists

On 28 March 2026, following recruitment difficulties for the original 16-participant user study, Dr. Kapetanios (supervisor) recommended pivoting to a downscoped qualitative comparative evaluation:

- **v1 design:** 16 participants, 4 HITL modes, 3 phases, 75-90 min sessions, Latin-square counterbalancing, repeated-measures ANOVA
- **v2 design:** 5-8 participants, 2 HITL modes (Baseline vs HITL-Full), 2 phases, 30-40 min sessions, alternated condition order, thematic analysis

The FinRisk prototype is functionally complete. The system changes required for v2 are configuration and display adjustments, not architectural rewrites. This document maps every location that needs updating.

---

## 2. Current System State (v1)

### 2.1 Architecture Overview

```
Frontend (React 18 + TypeScript + Zustand + Vite)     :5173
    |
    | HTTP (fetch)
    v
Backend (FastAPI + SQLAlchemy + SQLite)                :8000
    |
    v
Data Layer (SQLite DB + Tree Index JSON + ChromaDB + PDFs)
```

### 2.2 Technology Stack

| Layer | Technology | Version |
|---|---|---|
| Frontend | React, TypeScript, Vite, Zustand | 18.3, 5.5, 5.4, 5.0 |
| Backend | FastAPI, SQLAlchemy, Pydantic | 0.116, 2.0, 2.11 |
| Database | SQLite | Single-file, migrations in main.py |
| Vector store | ChromaDB (fallback) | sentence-transformers all-MiniLM-L6-v2 |
| Tree index | JSON per ticker | 10 tickers built |
| LLM (navigation) | OpenAI o3-mini | reasoning_effort: low |
| LLM (generation) | OpenAI gpt-5.2 | temperature: 0.2 |
| Document source | SEC EDGAR | 10-K PDFs + HTML |

### 2.3 Database Schema

#### participants table
```sql
CREATE TABLE participants (
  id VARCHAR(4) PRIMARY KEY,        -- P01-P16
  "group" VARCHAR(10) NOT NULL,     -- A or B
  phase1_ticker VARCHAR(10) NOT NULL,
  phase2_ticker VARCHAR(10) NOT NULL,
  phase3_ticker VARCHAR(10) NOT NULL  -- hardcoded 3 ticker columns
);
```

#### sessions table
```sql
CREATE TABLE sessions (
  id VARCHAR(36) PRIMARY KEY,
  participant_id VARCHAR(4) NOT NULL REFERENCES participants(id),
  current_phase INTEGER NOT NULL,     -- 1-3
  current_mode VARCHAR(20) NOT NULL,  -- baseline|hitl_r|hitl_g|hitl_full
  started_at TIMESTAMP NOT NULL,
  ended_at TIMESTAMP NULL
);
```

#### tasks table
```sql
CREATE TABLE tasks (
  id VARCHAR(36) PRIMARY KEY,
  session_id VARCHAR(36) NOT NULL REFERENCES sessions(id),
  phase INTEGER NOT NULL,
  mode VARCHAR(20) NOT NULL,
  ticker VARCHAR(10) NOT NULL,
  query_text TEXT NOT NULL,
  started_at TIMESTAMP NOT NULL,
  completed_at TIMESTAMP NULL,
  time_on_task_seconds INTEGER NULL,
  -- Retrieval
  pageindex_retrieval_id VARCHAR(100) NULL,
  retrieved_nodes JSON NULL,
  selected_node_ids JSON NULL,
  rejected_node_ids JSON NULL,
  traversal_path JSON NULL,
  -- Generation
  generated_summary TEXT NULL,
  edited_summary TEXT NULL,
  flagged_spans JSON NULL,
  characters_edited INTEGER NULL,
  -- Timing
  retrieval_completed_at TIMESTAMP NULL,
  generation_completed_at TIMESTAMP NULL,
  edit_completed_at TIMESTAMP NULL,
  first_edit_at TIMESTAMP NULL,
  -- Feedback
  feedback_responses JSON NULL,
  feedback_submitted_at TIMESTAMP NULL,
  -- Metrics
  llm_metrics JSON NULL,
  edit_distance INTEGER NULL,
  edit_similarity FLOAT NULL,
  pdf_view_duration_ms INTEGER NULL
);
```

#### study_assignments table
```sql
CREATE TABLE study_assignments (
  participant_id VARCHAR(4) PRIMARY KEY,
  "group" VARCHAR(10) NOT NULL,
  phases JSON NOT NULL,              -- array of PhaseAssignment objects
  status VARCHAR(20) NOT NULL,       -- not_started|in_progress|completed
  override BOOLEAN NOT NULL,
  updated_at TIMESTAMP NOT NULL
);
```

### 2.4 Study Configuration (v1)

#### Modes
```python
# src/backend/app/models/enums.py
class ModeType(str, Enum):
    baseline = "baseline"
    hitl_r = "hitl_r"
    hitl_g = "hitl_g"
    hitl_full = "hitl_full"
```

#### Group logic
```python
# src/backend/app/services/study_setup.py
def get_group(participant_id):
    # Odd = Group A, Even = Group B
    return GroupType.A if participant_num % 2 == 1 else GroupType.B

def get_phase_modes(group):
    if group == GroupType.A:
        return [ModeType.baseline, ModeType.hitl_r, ModeType.hitl_full]   # 3 modes
    return [ModeType.baseline, ModeType.hitl_g, ModeType.hitl_full]       # 3 modes
```

#### Ticker assignment
```python
# src/backend/app/services/study_setup.py
TICKERS = ["AAPL", "AMZN", "BA", "MSFT", "PFE", "TSLA", "WMT", "XOM"]

def get_ticker_sequence(participant_id):
    offset = ((participant_num - 1) // 2) % len(TICKERS)
    seq = [TICKERS[(offset + i) % len(TICKERS)] for i in range(3)]  # hardcoded 3
    return seq
```

#### Assignment generation
```python
# src/backend/app/services/assignment_service.py
def generate_default_assignment(participant_id):
    for i in range(3):              # hardcoded 3 phases
        ...

def generate_all_defaults(count=16): # hardcoded 16 participants
    ...
```

#### Checkpoint definitions
```python
# src/backend/app/services/assignment_service.py
DEFAULT_CHECKPOINTS = [
    { "definition_id": "seed-chunk-selector",   "applicable_modes": ["hitl_r", "hitl_full"] },
    { "definition_id": "seed-summary-editor",   "applicable_modes": ["hitl_g", "hitl_full"] },
    { "definition_id": "seed-questionnaire",    "applicable_modes": ["hitl_r", "hitl_g", "hitl_full"] },
]
```

**Note:** The questionnaire checkpoint currently excludes baseline mode. For v2 (Baseline vs HITL-Full comparison), it needs to apply to all modes including baseline.

#### Questionnaire fields (already updated to 6 fields)
```typescript
// src/frontend/src/data/checkpointDefinitions.ts
field_schema: [
  { key: "completeness",        type: "select",   label: "How complete was this summary?", required: true },
  { key: "accuracy",            type: "select",   label: "How accurate was this summary...?", required: true },
  { key: "citation_helpfulness", type: "radio",   label: "Were the source citations helpful...?", required: true },
  { key: "perceived_control",   type: "select",   label: "How much control did you have...?", required: true },
  { key: "feature_usefulness",  type: "select",   label: "How helpful was the feedback tool...?", required: true },
  { key: "open_feedback",       type: "textarea", label: "Any concerns or observations...?", required: false },
]
```

### 2.5 Session Lifecycle (v1)

```
1. User enters participant ID (e.g. P03)
2. Frontend fetches assignment from /api/study/assignments/P03
3. Frontend calls POST /api/sessions/start { participant_id: "P03" }
4. Backend creates Participant (if new), Session (phase=1), Task for phase 1
5. Backend looks up group -> mode sequence, assigns first mode
6. Frontend displays Phase 1 in chat stream

Per phase:
  Query -> Retrieve -> [HITL-R checkpoint] -> Generate -> [HITL-G checkpoint] -> Questionnaire -> Phase Advance

7. After phase 3, session completes
```

### 2.6 Frontend Phase Logic (v1)

#### Phase completion check
```typescript
// src/frontend/src/stores/studyStore.ts
// Line 846: after summary finalized
} else if (session && session.current_phase < 3) {
    // show phase_advance button
} else {
    // show session_complete
}

// Line 883: after all checkpoints done
if (session && session.current_phase < 3) {
    // show phase_advance button
} else {
    // show session_complete
}
```

#### Display strings
```typescript
// src/frontend/src/components/study/StudyChatGate.tsx
Line 222: `Phase ${session.current_phase}/3`           // chat history title
Line 409: "Your 3 phases"                               // phase overview label
Line 693: "All 3 phases finished."                      // completion message
Line 713: `Phase {session.current_phase}/3`             // session bar
```

#### TypeScript type
```typescript
// src/frontend/src/types/index.ts
Line 189: phases: [PhaseAssignment, PhaseAssignment, PhaseAssignment];  // fixed 3-tuple
```

#### Admin panels
```typescript
// src/frontend/src/components/admin/SessionDetailPanel.tsx
Line 74: const phases = [1, 2, 3].map(...)              // hardcoded phase list

// src/frontend/src/components/admin/OverviewPanel.tsx
Line 120: `${p.current_phase}/3`                        // phase display
Line 137: `${(p.phases_completed / 3) * 100}%`          // progress bar width
Line 142: `${p.phases_completed}/3`                     // progress text
```

### 2.7 Backend Phase Logic (v1)

#### Session router
```python
# src/backend/app/routers/sessions.py
Line 55:  phase3_ticker=ticker_seq[2]                   # creates participant with 3 tickers
Line 67-71: ticker_by_phase = {1: ..., 2: ..., 3: ...}  # hardcoded 3-phase lookup
Line 123: if study_session.current_phase >= 3:           # final phase check
```

#### Pydantic schema
```python
# src/backend/app/schemas/study_assignment.py
Line 17: phase: int = Field(ge=1, le=3)                 # phase range validation
```

---

## 3. What Changes for v2

### 3.1 Design Comparison

| Aspect | v1 | v2 |
|---|---|---|
| Participants | P01-P16 (16) | P01-P08 (8) |
| Groups | A (odd), B (even) | No groups - alternated condition order |
| Phases per session | 3 | 2 |
| Modes | baseline, hitl_r, hitl_g, hitl_full | baseline, hitl_full |
| Mode sequence (v1 Group A) | baseline -> hitl_r -> hitl_full | N/A |
| Mode sequence (v1 Group B) | baseline -> hitl_g -> hitl_full | N/A |
| Mode sequence (v2 odd) | baseline -> hitl_full | - |
| Mode sequence (v2 even) | hitl_full -> baseline | - |
| Tickers per participant | 3 | 2 |
| Ticker pool | All 8 | AAPL, AMZN, MSFT (Tier 1-2 only) |
| Tutorial ticker | WMT | WMT (unchanged) |
| Counterbalancing | Latin-square | Alternated condition order |
| Questionnaire | HITL modes only | All modes (including baseline) |
| Session duration | 75-90 min | 30-40 min |

### 3.2 Change Inventory

#### Backend changes (8 locations)

| File | Line | Current | Change | Effort |
|---|---|---|---|---|
| `models/participant.py` | 13-15 | 3 hardcoded ticker columns | Replace with JSON column `phase_tickers` | Medium |
| `migrations/001_init.sql` | 4-6 | 3 ticker columns | Update schema | Low |
| `services/study_setup.py` | 31-33 | Returns 3 modes per group | Return 2 modes, alternated order | Low |
| `services/study_setup.py` | 39 | `range(3)` for ticker sequence | `range(2)` | Low |
| `services/assignment_service.py` | 66 | `for i in range(3)` | `for i in range(num_phases)` | Low |
| `services/assignment_service.py` | 91 | `count=16` default | `count=8` default | Low |
| `routers/sessions.py` | 50-55, 67-71 | 3-phase ticker lookup | Dynamic from JSON/assignment | Medium |
| `routers/sessions.py` | 123 | `>= 3` final phase check | Dynamic from assignment phases length | Low |
| `schemas/study_assignment.py` | 17 | `Field(ge=1, le=3)` | `Field(ge=1, le=10)` or remove upper bound | Low |

#### Frontend changes (8 locations)

| File | Line | Current | Change | Effort |
|---|---|---|---|---|
| `types/index.ts` | 189 | `[PhaseAssignment, PhaseAssignment, PhaseAssignment]` | `PhaseAssignment[]` | Low |
| `stores/studyStore.ts` | 846 | `session.current_phase < 3` | `session.current_phase < assignment.phases.length` | Low |
| `stores/studyStore.ts` | 883 | `session.current_phase < 3` | `session.current_phase < assignment.phases.length` | Low |
| `components/study/StudyChatGate.tsx` | 222 | `Phase ${session.current_phase}/3` | `Phase ${session.current_phase}/${assignment.phases.length}` | Low |
| `components/study/StudyChatGate.tsx` | 409 | `"Your 3 phases"` | `"Your ${assignment.phases.length} phases"` or `"Your phases"` | Low |
| `components/study/StudyChatGate.tsx` | 693 | `"All 3 phases finished."` | `"All phases finished."` | Low |
| `components/study/StudyChatGate.tsx` | 713 | `Phase {session.current_phase}/3` | `Phase {session.current_phase}/{assignment.phases.length}` | Low |
| `components/admin/OverviewPanel.tsx` | 120,137,142 | Hardcoded `/3` | Dynamic from assignment | Low |
| `components/admin/SessionDetailPanel.tsx` | 74 | `[1, 2, 3].map(...)` | Dynamic from session tasks | Low |

#### Checkpoint changes (1 location)

| File | Line | Current | Change | Effort |
|---|---|---|---|---|
| `services/assignment_service.py` | 39 | Questionnaire excludes baseline | Add `"baseline"` to applicable_modes | Low |
| `data/checkpointDefinitions.ts` | ~45 | Questionnaire applicable to hitl_r, hitl_g, hitl_full | Add `"baseline"` | Low |

#### Database migration

The `participants` table needs a schema change from 3 fixed ticker columns to a flexible approach. Two options:

**Option A: JSON column (recommended for v2)**
```sql
ALTER TABLE participants ADD COLUMN phase_tickers JSON;
-- Migrate existing: UPDATE participants SET phase_tickers = json_array(phase1_ticker, phase2_ticker, phase3_ticker);
-- Then drop old columns (or leave for backward compat)
```

**Option B: Keep columns, add nullable phase3_ticker**
```sql
-- Make phase3_ticker nullable for 2-phase participants
-- Simpler but messier
```

---

## 4. Implementation Order

### Phase 1: Backend (do first - frontend depends on it)

1. **Update Participant model** - JSON phase_tickers column
2. **Update study_setup.py** - 2-mode sequences, 2-ticker sequences, v2 ticker pool
3. **Update assignment_service.py** - 2 phases, 8 participants, questionnaire for baseline
4. **Update sessions.py** - Dynamic ticker lookup from assignment, dynamic phase limit
5. **Update Pydantic schema** - Remove `le=3` constraint
6. **Delete old database** - Fresh start (no production data to preserve)

### Phase 2: Frontend (after backend is working)

7. **Update types/index.ts** - Tuple to array
8. **Update studyStore.ts** - Dynamic phase completion logic
9. **Update StudyChatGate.tsx** - Dynamic phase display strings
10. **Update admin panels** - Dynamic phase counts

### Phase 3: Verify

11. **Test full session flow** - P01 through both phases
12. **Test assignment generation** - P01-P08 all correct
13. **Test admin dashboard** - Correct phase counts and progress bars

---

## 5. What Does NOT Change

The following components are mode-agnostic and require zero changes:

| Component | Why it's fine |
|---|---|
| **Retrieval pipeline** (tree_service, chroma_service, pageindex_service) | Mode-agnostic, called the same way |
| **LLM generation** (llm_service.py) | Takes nodes + query, no phase awareness |
| **Template fallback** (template_summary.py) | Same interface |
| **Task router** (tasks.py) | All endpoints (query, generate, select-nodes, edit-summary, feedback) are phase-agnostic |
| **Document router** (documents.py) | PDF serving, no study logic |
| **Chat message types** | All 10 message types + 3 tail actions work for any phase count |
| **Checkpoint components** (SectionSelectorMessage, EditableSummaryMessage, DynamicControlRenderer) | Rendered based on mode, not phase count |
| **Message components** (SummaryMessage, TraversalPathMessage, RetrievedNodesMessage) | Content display only |
| **Session Ledger** (SessionLedger.tsx, LedgerPhaseCard.tsx) | Renders from ledgerPhases array, already dynamic |
| **PDF viewer** (PdfViewerOverlay.tsx, DocumentsPanel.tsx) | Independent of study design |
| **Checkpoint definitions** (field schema) | Already has 6-field questionnaire |
| **Config** (config.py, .env) | Retrieval mode, API keys, tree tuning - all unchanged |
| **CSS** (index.css) | No phase-count-dependent styling |

---

## 6. v2 Assignment Table

The following assignments will be generated for P01-P08:

| ID | Phase 1 Mode | Phase 1 Ticker | Phase 2 Mode | Phase 2 Ticker | Condition Order |
|---|---|---|---|---|---|
| P01 | Baseline | AMZN | HITL-Full | AAPL | Baseline first |
| P02 | HITL-Full | AAPL | Baseline | MSFT | HITL-Full first |
| P03 | Baseline | MSFT | HITL-Full | AMZN | Baseline first |
| P04 | HITL-Full | AMZN | Baseline | AAPL | HITL-Full first |
| P05 | Baseline | AAPL | HITL-Full | MSFT | Baseline first |
| P06 | HITL-Full | MSFT | Baseline | AMZN | HITL-Full first |
| P07 | Baseline | AMZN | HITL-Full | MSFT | Baseline first |
| P08 | HITL-Full | AAPL | Baseline | AMZN | HITL-Full first |

**Rules:**
- Odd IDs: Baseline first, HITL-Full second
- Even IDs: HITL-Full first, Baseline second
- Tickers: AAPL, AMZN, MSFT only (Tier 1-2)
- No ticker repeated within a session
- WMT reserved for tutorial (not assigned to measured tasks)

---

## 7. Questionnaire Applicability Change

### v1: Questionnaire skips baseline
```
Baseline:  retrieve -> generate -> [no questionnaire] -> phase_advance
HITL-R:    retrieve -> [chunk selector] -> generate -> [questionnaire] -> phase_advance
HITL-G:    retrieve -> generate -> [summary editor] -> [questionnaire] -> phase_advance
HITL-Full: retrieve -> [chunk selector] -> generate -> [summary editor] -> [questionnaire] -> phase_advance
```

### v2: Questionnaire applies to all modes
```
Baseline:  retrieve -> generate -> [questionnaire] -> phase_advance
HITL-Full: retrieve -> [chunk selector] -> generate -> [summary editor] -> [questionnaire] -> phase_advance
```

This is critical for v2 because the within-subjects comparison (Baseline vs HITL-Full) requires questionnaire data from both conditions.

---

## 8. Data Collection Comparison

### What v2 captures (per task)

| Category | Baseline | HITL-Full |
|---|---|---|
| Timing (started_at, completed_at, time_on_task) | Yes | Yes |
| Retrieved nodes + traversal path | Yes | Yes |
| Selected/rejected node IDs | No (auto) | Yes |
| Generated summary | Yes | Yes |
| Edited summary + characters_edited | No | Yes |
| Edit distance + edit similarity | No | Yes |
| Flagged spans | No | Yes |
| Questionnaire (6 fields) | Yes (new in v2) | Yes |
| PDF view duration | Yes | Yes |
| LLM metrics (tokens, duration) | Yes | Yes |

### What v2 does NOT capture (compared to v1)

- No HITL-R only condition (chunk selection without summary editing)
- No HITL-G only condition (summary editing without chunk selection)
- No phase 3 data
- No cross-quality-tier comparison (Tier 3 tickers excluded)
- Fewer total observations (16 tasks from 8 participants vs 48 tasks from 16 participants)

---

## 9. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| DB migration breaks existing data | Low | Low | Delete old DB, fresh start (no production data) |
| Frontend type change causes build errors | Medium | Low | TypeScript compiler will catch all affected locations |
| Admin panel shows wrong progress | Low | Low | Only affects researcher view, easy to verify |
| Questionnaire on baseline confuses participants | Low | Medium | Researcher explains during tutorial that all tasks end with feedback |
| Still can't recruit 5 participants | Medium | High | Expert evaluation as fallback (supervisor's secondary recommendation) |

---

## 10. Post-Implementation Verification Checklist

- [ ] P01 assignment has 2 phases (Baseline, HITL-Full)
- [ ] P02 assignment has 2 phases (HITL-Full, Baseline) - reversed order
- [ ] Session starts correctly for P01
- [ ] Phase 1 runs full pipeline (retrieve -> generate -> questionnaire)
- [ ] Phase advance works after phase 1
- [ ] Phase 2 runs full pipeline with correct mode
- [ ] Session completes after phase 2 (not waiting for phase 3)
- [ ] Session bar shows "Phase X/2" not "Phase X/3"
- [ ] Phase overview shows 2 phases not 3
- [ ] Completion message says "All phases finished" not "All 3 phases"
- [ ] Admin overview shows correct progress (X/2)
- [ ] Admin session detail shows 2 phase cards not 3
- [ ] Questionnaire appears after baseline task (new behaviour)
- [ ] All questionnaire responses saved to task.feedback_responses
- [ ] Chat history title shows "Phase X/2"
