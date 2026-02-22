# Session Ledger — Right Panel Artifact Tracker

**Component Name:** `SessionLedger`
**Location:** Right panel of `StudyChatGate` (always visible)
**Purpose:** A curated, persistent record of every deliberate participant decision and output across all phases — the "owned artifacts" as distinct from the noisy chat stream.

---

## 1. Concept: Tracker vs Ledger

### Why not a simple progress tracker?

| Aspect | Progress Tracker (v1 — rejected) | Session Ledger (v2 — this design) |
|--------|----------------------------------|-----------------------------------|
| **Shows** | Status labels + checkmarks | Actual queries, chunk counts, summaries |
| **Purpose** | "Where am I?" | "What did I produce? What do I own?" |
| **Interactivity** | Passive | Clickable — drill into chunks, view summaries |
| **After completion** | Useless | Reviewable evidence trail |
| **Relationship to chat** | Supplements it | **Replaces it** as the authoritative record |

### Core insight

> The chat stream contains generated intermediate content (retrieval animations, loading states, system messages) that the participant didn't choose. The right panel should only show **things the participant deliberately chose or produced** — their query, their chunk selections, their final summary, their questionnaire responses.

### Name Options
| Name | Rationale |
|------|-----------|
| **Session Ledger** ✅ | Implies a formal record of decisions/transactions — fits the "owned artifacts" concept |
| Session Artifact Panel | Accurate but verbose |
| Decision Trail | Good but sounds forensic |
| Session Roadmap | Too "progress-tracker", doesn't convey content |
| Phase Journal | Close, but "journal" implies notes |

**Chosen: Session Ledger**

---

## 2. Visual Mockup — Phase 2 in progress

```
┌─────────────────────────────────────────────────┐
│  SESSION LEDGER                     P04 · B     │
│  ███████████░░░░░░░░░░░  42%                    │
├─────────────────────────────────────────────────┤
│                                                 │
│  ✓ PHASE 1 · Baseline                   AMZN   │
│  ───────────────────────────────────────────    │
│                                                 │
│  QUERY                                          │
│  ┌─────────────────────────────────────────┐    │
│  │ "What are the main supply chain,        │    │
│  │  fulfillment, and regulatory risks      │    │
│  │  affecting Amazon's e-commerce and      │    │
│  │  cloud operations?"                     │    │
│  └─────────────────────────────────────────┘    │
│                                                 │
│  RETRIEVAL                                      │
│  8 chunks retrieved                             │
│  (no selection — baseline mode)                 │
│                                                 │
│  SUMMARY                               [View]   │
│  ┌─────────────────────────────────────────┐    │
│  │ Amazon faces significant operational    │    │
│  │ risks across its supply chain and...    │    │
│  │ ⋯ (truncated — click View)             │    │
│  └─────────────────────────────────────────┘    │
│                                                 │
│  FEEDBACK                        [View responses]│
│  Completeness: 3  ·  Accuracy: 4               │
│  Control: 1  ·  Citations: Yes                  │
│                                                 │
│  ═══════════════════════════════════════════    │
│                                                 │
│  ● PHASE 2 · HITL-R                     MSFT   │
│  ───────────────────────────────────────────    │
│                                                 │
│  QUERY                                          │
│  ┌─────────────────────────────────────────┐    │
│  │ "What are the key technology and        │    │
│  │  cybersecurity risks that could impact  │    │
│  │  Microsoft's cloud business?"           │    │
│  └─────────────────────────────────────────┘    │
│                                                 │
│  RETRIEVAL                              [View]   │
│  10 retrieved → 7 selected  ← YOU ARE HERE      │
│  ┌────┬────┬────┬────┬────┬────┬────┬───┬───┬───┐
│  │ ✓1 │ ✓2 │ ✓3 │ ✗4 │ ✓5 │ ✗6 │ ✓7 │✓8 │✗9 │✓10│
│  └────┴────┴────┴────┴────┴────┴────┴───┴───┴───┘
│  ↑ click any box to see chunk details           │
│                                                 │
│  SUMMARY                                        │
│  ○ Waiting for generation...                    │
│                                                 │
│  FEEDBACK                                       │
│  ○ Pending                                      │
│                                                 │
│  ═══════════════════════════════════════════    │
│                                                 │
│  ○ PHASE 3 · HITL-Full                  AAPL   │
│  ───────────────────────────────────────────    │
│  Upcoming — query, select chunks,               │
│  edit summary, questionnaire                    │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## 3. Artifact Sections per Phase

Each completed phase shows 4 artifact sections. Content varies by mode:

### 3.1 QUERY section (all modes)
Always shows the actual query text in a quote block.

```
QUERY
┌─────────────────────────────────────────┐
│ "Identify and summarize the supply      │
│  chain and geopolitical risks facing    │
│  Apple's hardware operations."          │
└─────────────────────────────────────────┘
```

### 3.2 RETRIEVAL section (varies by mode)

**Baseline / HITL-G** (no chunk selection):
```
RETRIEVAL
8 chunks retrieved (auto-selected)
```

**HITL-R / HITL-Full** (chunk selection):
```
RETRIEVAL                                    [View]
10 retrieved → 7 selected
┌────┬────┬────┬────┬────┬────┬────┬────┬────┬────┐
│ ✓1 │ ✓2 │ ✓3 │ ✗4 │ ✓5 │ ✗6 │ ✓7 │ ✓8 │ ✗9 │✓10│
└────┴────┴────┴────┴────┴────┴────┴────┴────┴────┘
```

**Chunk boxes:**
- `✓` green background = selected by participant
- `✗` grey/red background = deselected by participant
- **Clickable** — clicking a box slides in a detail panel showing:
  - Chunk title (e.g., "Item 1A > Supply Chain Risks")
  - Page reference
  - Truncated content preview (~200 chars)
  - Whether it was selected or rejected

### 3.3 SUMMARY section (varies by mode)

**Baseline / HITL-R** (no editing):
```
SUMMARY                                     [View]
┌─────────────────────────────────────────┐
│ Amazon faces significant operational    │
│ risks across its supply chain and...    │
│ ⋯ (3 paragraphs — click View)          │
└─────────────────────────────────────────┘
```

**HITL-G / HITL-Full** (summary edited):
```
SUMMARY (edited)                            [View]
┌─────────────────────────────────────────┐
│ Amazon faces significant operational    │
│ risks across its supply chain and...    │
│ ⋯ (3 paragraphs, 4 edits — click View) │
└─────────────────────────────────────────┘
3 additions · 1 deletion
```

- **[View] button** opens full summary in the right panel detail view (reusing existing `paneSummary` mechanism)
- For edited summaries, optionally show edit count

### 3.4 FEEDBACK section (all modes, after questionnaire)

```
FEEDBACK                              [View responses]
Completeness: 3  ·  Accuracy: 4
Control: 2  ·  Citations: Partly
```

- Shows key metrics inline as a compact row
- **[View responses]** opens full questionnaire detail (reusing existing `paneCheckpoint` mechanism)

---

## 4. State Progression

Each section transitions through states as the phase progresses:

| State | Appearance | Example |
|-------|-----------|---------|
| **Upcoming** | Greyed out label only | `○ Pending` |
| **Active** | Highlighted, may show partial data | `● 10 retrieved → selecting...` with `← CURRENT` marker |
| **Completed** | Full artifact content | Query text, chunk boxes, summary preview, scores |

### Phase-level states

| Phase State | Header | Content |
|-------------|--------|---------|
| **Completed** | `✓ PHASE 1 · Baseline  AMZN` (green check) | All 4 sections with full content |
| **Active** | `● PHASE 2 · HITL-R  MSFT` (blue dot) | Sections filled progressively |
| **Upcoming** | `○ PHASE 3 · HITL-Full  AAPL` (grey) | Collapsed one-liner: "Upcoming — query, select chunks, edit summary, questionnaire" |

---

## 5. Chunk Detail Slide-in

When a participant clicks a chunk box (e.g., `✓3`), a detail card slides in below the chunk row or replaces the right panel content:

```
┌─────────────────────────────────────────────────┐
│  ← Back to Ledger          Chunk 3 of 10        │
├─────────────────────────────────────────────────┤
│                                                 │
│  STATUS: ✓ Selected                             │
│                                                 │
│  TITLE                                          │
│  Item 1A > Cybersecurity & Data Breach Risks    │
│                                                 │
│  SOURCE                                         │
│  MSFT 10-K FY2024, Page 14                      │
│                                                 │
│  CONTENT                                        │
│  ┌─────────────────────────────────────────┐    │
│  │ Microsoft's products and services may   │    │
│  │ have security vulnerabilities that      │    │
│  │ could be exploited... Cyberattacks and  │    │
│  │ security incidents could result in...   │    │
│  │                                         │    │
│  │ We face risks related to the security   │    │
│  │ of our cloud infrastructure, customer   │    │
│  │ data, and operational continuity...     │    │
│  └─────────────────────────────────────────┘    │
│                                                 │
│  ◄ Prev chunk                  Next chunk ►     │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Navigation:** `◄ Prev` / `Next ►` to browse chunks without going back.

---

## 6. Data Model

```typescript
// One per phase — accumulated as the phase progresses
interface LedgerPhase {
  phase: number;                       // 1, 2, 3
  mode: Mode;
  ticker: string;
  status: "completed" | "active" | "upcoming";

  // Artifacts — populated as steps complete
  query: LedgerQuery | null;
  retrieval: LedgerRetrieval | null;
  summary: LedgerSummary | null;
  feedback: LedgerFeedback | null;

  // Active step tracking (for the progress indicator)
  activeStep: "query" | "retrieval" | "generation" | "edit" | "questionnaire" | null;
}

interface LedgerQuery {
  text: string;                        // The actual query submitted
  submittedAt: string;                 // Timestamp
}

interface LedgerRetrieval {
  totalRetrieved: number;              // e.g., 10
  totalSelected: number;               // e.g., 7 (same as totalRetrieved for baseline)
  chunks: LedgerChunk[];               // Individual chunk records
  selectionEnabled: boolean;           // true for hitl_r, hitl_full
}

interface LedgerChunk {
  id: string;
  index: number;                       // Display order (1-based)
  title: string;                       // "Item 1A > Supply Chain Risks"
  pageRef: string;                     // "Page 14"
  contentPreview: string;              // First ~200 chars
  selected: boolean;                   // Was it included?
}

interface LedgerSummary {
  text: string;                        // The final summary text
  wasEdited: boolean;                  // true if user modified it
  editCount?: number;                  // Number of edits (additions + deletions)
  additionCount?: number;
  deletionCount?: number;
}

interface LedgerFeedback {
  completeness?: number;               // 1-5
  accuracy?: number;                   // 1-5
  citationHelpfulness?: string;        // "yes" | "partly" | "no"
  perceivedControl?: number;           // 1-5 (HITL modes only)
  featureUsefulness?: number;          // 1-5 (HITL modes only)
  openFeedback?: string;               // Free text
}
```

### Derivation from existing store

Most data already exists in `studyStore` and the chat messages:

| Ledger field | Source |
|-------------|--------|
| `query.text` | `session.current_query` or `PhaseAssignment.query` |
| `retrieval.chunks` | From `queryTask()` API response (retrieval nodes) |
| `retrieval.totalSelected` | From `submitNodeSelection()` args |
| `summary.text` | From `generateTask()` response or `submitEditedSummary()` args |
| `summary.wasEdited` | `mode` is `hitl_g` or `hitl_full` and edit was submitted |
| `feedback.*` | From `submitCheckpoint("seed-questionnaire", data)` |

**New state needed in store:** A `ledgerPhases: LedgerPhase[]` array that accumulates artifacts as they're produced. Each action (query, retrieval, generation, checkpoint submit) appends to the current phase's ledger.

---

## 7. Component Structure

```
SessionLedger
├── LedgerHeader               — "SESSION LEDGER" + PID + group + progress bar
├── LedgerPhaseList            — scrollable vertical list
│   └── LedgerPhaseCard        — one per phase
│       ├── PhaseHeader        — "✓ PHASE 1 · Baseline  AMZN"
│       ├── QuerySection       — quote block with query text
│       ├── RetrievalSection   — chunk count + clickable boxes
│       │   └── ChunkBox       — small colored box, clickable
│       ├── SummarySection     — truncated preview + [View] button
│       └── FeedbackSection    — inline scores + [View responses]
└── LedgerFooter               — overall progress text
```

**Detail overlays (reuse existing right-panel mechanism):**
- `ChunkDetailView` — shown when clicking a chunk box
- Existing `paneSummary` — shown when clicking [View] on summary
- Existing `paneCheckpoint` — shown when clicking [View responses]

### Proposed Files
```
src/frontend/src/components/study/SessionLedger.tsx      — main component
src/frontend/src/components/study/LedgerPhaseCard.tsx    — per-phase card
src/frontend/src/components/study/ChunkDetailView.tsx    — chunk drill-in
```

---

## 8. Styling Spec

### Phase cards
```css
.ledger-phase                { padding: 16px; border-bottom: 1px solid #1f2937; }
.ledger-phase.completed      { }
.ledger-phase.active         { background: rgba(96, 165, 250, 0.03); }
.ledger-phase.upcoming       { opacity: 0.4; }

.ledger-phase-header         { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
.ledger-phase-check.done     { color: #22c55e; }
.ledger-phase-check.active   { color: #60a5fa; animation: pulse 2s infinite; }
.ledger-phase-check.upcoming { color: #4b5563; }
.ledger-phase-ticker         { margin-left: auto; font-family: monospace; color: #9ca3af; font-size: 13px; }
```

### Artifact sections
```css
.ledger-section              { margin: 8px 0; }
.ledger-section-label        { font-size: 10px; letter-spacing: 0.08em; color: #6b7280;
                               text-transform: uppercase; margin-bottom: 4px; }
.ledger-query-block          { background: #111827; border-left: 3px solid #374151;
                               padding: 8px 12px; font-size: 13px; color: #d1d5db;
                               font-style: italic; border-radius: 4px; }
.ledger-summary-preview      { background: #111827; padding: 8px 12px; font-size: 12px;
                               color: #9ca3af; border-radius: 4px; max-height: 80px;
                               overflow: hidden; position: relative; }
.ledger-summary-preview::after { content: ''; position: absolute; bottom: 0; left: 0;
                               right: 0; height: 30px;
                               background: linear-gradient(transparent, #111827); }
```

### Chunk boxes
```css
.ledger-chunk-grid           { display: flex; flex-wrap: wrap; gap: 4px; margin: 6px 0; }
.ledger-chunk-box            { width: 32px; height: 28px; border-radius: 4px; display: flex;
                               align-items: center; justify-content: center;
                               font-size: 11px; font-weight: 600; cursor: pointer;
                               transition: transform 0.15s ease; }
.ledger-chunk-box:hover      { transform: scale(1.15); }
.ledger-chunk-box.selected   { background: #065f46; color: #6ee7b7; border: 1px solid #059669; }
.ledger-chunk-box.rejected   { background: #1f2937; color: #6b7280; border: 1px solid #374151; }
```

### Feedback inline
```css
.ledger-feedback-row         { display: flex; flex-wrap: wrap; gap: 8px; font-size: 12px; color: #9ca3af; }
.ledger-feedback-item        { display: flex; gap: 4px; }
.ledger-feedback-label       { color: #6b7280; }
.ledger-feedback-value       { color: #d1d5db; font-weight: 500; }
```

### Progress bar (in header)
```css
.ledger-progress             { height: 3px; background: #1f2937; border-radius: 2px; margin-top: 8px; }
.ledger-progress-fill        { height: 100%; background: #60a5fa; border-radius: 2px;
                               transition: width 0.5s ease; }
```

---

## 9. Interaction Model

### Default behavior
- Ledger is **always visible** in the right panel
- Scrollable — as phases complete, user scrolls to see earlier work
- Active phase auto-scrolls into view when phase advances

### Click interactions

| Target | Action |
|--------|--------|
| Chunk box (`✓3`) | Opens `ChunkDetailView` as overlay (with ← Back) |
| `[View]` on summary | Opens full summary in existing `paneSummary` overlay |
| `[View responses]` on feedback | Opens questionnaire detail in existing `paneCheckpoint` overlay |
| Collapsed upcoming phase | No interaction (read-only preview) |
| `← Back to Ledger` (in any overlay) | Returns to main ledger scroll position |

### Overlay priority
```
Layer 0: SessionLedger (always rendered, may be hidden)
Layer 1: ChunkDetailView | paneSummary | paneCheckpoint (one at a time)
```

Closing any Layer 1 overlay returns to the ledger at the same scroll position.

---

## 10. Mockup Variants

### A. Phase 1 Active — Query Just Submitted

```
┌─────────────────────────────────────────────────┐
│  SESSION LEDGER                     P04 · B     │
│  ░░░░░░░░░░░░░░░░░░░░░  0%                     │
├─────────────────────────────────────────────────┤
│                                                 │
│  ● PHASE 1 · Baseline                   AMZN   │
│  ───────────────────────────────────────────    │
│                                                 │
│  QUERY                                          │
│  ┌─────────────────────────────────────────┐    │
│  │ "What are the main supply chain,        │    │
│  │  fulfillment, and regulatory risks      │    │
│  │  affecting Amazon's e-commerce and      │    │
│  │  cloud operations?"                     │    │
│  └─────────────────────────────────────────┘    │
│                                                 │
│  RETRIEVAL                                      │
│  ◌ Retrieving chunks...                         │
│                                                 │
│  SUMMARY                                        │
│  ○ Pending                                      │
│                                                 │
│  FEEDBACK                                       │
│  ○ Pending                                      │
│                                                 │
│  ═══════════════════════════════════════════    │
│                                                 │
│  ○ PHASE 2 · HITL-R                     MSFT   │
│  ○ PHASE 3 · HITL-Full                  AAPL   │
│                                                 │
└─────────────────────────────────────────────────┘
```

### B. Phase 3 — HITL-Full, Editing Summary

```
┌─────────────────────────────────────────────────┐
│  SESSION LEDGER                     P04 · B     │
│  █████████████████░░░░░  75%                    │
├─────────────────────────────────────────────────┤
│                                                 │
│  ✓ PHASE 1 · Baseline                   AMZN   │
│  ───────────────────────────────────────────    │
│  QUERY  "What are the main supply chain..."     │
│  RETRIEVAL  8 chunks (auto)                     │
│  SUMMARY  3 paragraphs              [View]      │
│  FEEDBACK  C:3 A:4 Ctrl:1 Cite:Yes  [Detail]   │
│                                                 │
│  ═══════════════════════════════════════════    │
│                                                 │
│  ✓ PHASE 2 · HITL-R                     MSFT   │
│  ───────────────────────────────────────────    │
│  QUERY  "What are the key technology..."        │
│  RETRIEVAL  10 → 7 selected          [View]     │
│  ┌────┬────┬────┬────┬────┬────┬────┬───┬───┬───┐
│  │ ✓1 │ ✓2 │ ✓3 │ ✗4 │ ✓5 │ ✗6 │ ✓7 │✓8 │✗9 │✓10│
│  └────┴────┴────┴────┴────┴────┴────┴───┴───┴───┘
│  SUMMARY  4 paragraphs              [View]      │
│  FEEDBACK  C:4 A:4 Ctrl:3 Cite:Yes  [Detail]   │
│                                                 │
│  ═══════════════════════════════════════════    │
│                                                 │
│  ● PHASE 3 · HITL-Full                  AAPL   │
│  ───────────────────────────────────────────    │
│                                                 │
│  QUERY                                          │
│  ┌─────────────────────────────────────────┐    │
│  │ "Identify and summarize the supply      │    │
│  │  chain and geopolitical risks facing    │    │
│  │  Apple's hardware operations."          │    │
│  └─────────────────────────────────────────┘    │
│                                                 │
│  RETRIEVAL                              [View]  │
│  12 retrieved → 9 selected                      │
│  ┌────┬────┬────┬────┬────┬────┬────┬───┬───┬───┐
│  │ ✓1 │ ✓2 │ ✓3 │ ✓4 │ ✗5 │ ✓6 │ ✓7 │✓8 │✗9 │...│
│  └────┴────┴────┴────┴────┴────┴────┴───┴───┴───┘
│                                                 │
│  SUMMARY (editing)               ← CURRENT     │
│  ┌─────────────────────────────────────────┐    │
│  │ Apple faces significant supply chain    │    │
│  │ concentration risks, particularly in... │    │
│  │ ⋯ (editing in progress)                │    │
│  └─────────────────────────────────────────┘    │
│                                                 │
│  FEEDBACK                                       │
│  ○ Pending                                      │
│                                                 │
└─────────────────────────────────────────────────┘
```

Note how completed phases **auto-compact** — query truncated to one line, summary just shows paragraph count. The active phase stays expanded with full content.

### C. All Complete — Full Session Record

```
┌─────────────────────────────────────────────────┐
│  SESSION LEDGER                     P04 · B     │
│  ████████████████████████  100% ✓ Complete      │
├─────────────────────────────────────────────────┤
│                                                 │
│  ✓ PHASE 1 · Baseline                   AMZN   │
│  ───────────────────────────────────────────    │
│  QUERY  "What are the main supply chain..."     │
│  RETRIEVAL  8 chunks (auto)                     │
│  SUMMARY  3 paragraphs              [View]      │
│  FEEDBACK  C:3 A:4 Ctrl:1 Cite:Yes  [Detail]   │
│                                                 │
│  ═══════════════════════════════════════════    │
│                                                 │
│  ✓ PHASE 2 · HITL-R                     MSFT   │
│  ───────────────────────────────────────────    │
│  QUERY  "What are the key technology..."        │
│  RETRIEVAL  10 → 7 selected          [View]     │
│  ┌────┬────┬────┬────┬────┬────┬────┬───┬───┬───┐
│  │ ✓1 │ ✓2 │ ✓3 │ ✗4 │ ✓5 │ ✗6 │ ✓7 │✓8 │✗9 │✓10│
│  └────┴────┴────┴────┴────┴────┴────┴───┴───┴───┘
│  SUMMARY  4 paragraphs              [View]      │
│  FEEDBACK  C:4 A:4 Ctrl:3 Cite:Yes  [Detail]   │
│                                                 │
│  ═══════════════════════════════════════════    │
│                                                 │
│  ✓ PHASE 3 · HITL-Full                  AAPL   │
│  ───────────────────────────────────────────    │
│  QUERY  "Identify and summarize the..."         │
│  RETRIEVAL  12 → 9 selected          [View]     │
│  ┌────┬────┬────┬────┬────┬────┬────┬───┬───┬───┐
│  │ ✓1 │ ✓2 │ ✓3 │ ✓4 │ ✗5 │ ✓6 │ ✓7 │✓8 │✗9 │...│
│  └────┴────┴────┴────┴────┴────┴────┴───┴───┴───┘
│  SUMMARY (edited, 4 edits)           [View]     │
│  FEEDBACK  C:5 A:5 Ctrl:5 Cite:Yes  [Detail]   │
│                                                 │
│  ═══════════════════════════════════════════    │
│                                                 │
│  Session complete. Thank you!                   │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## 11. Compact vs Expanded Phase Display

Completed phases auto-compact to save vertical space, but remain expandable:

| Phase state | Display mode | Rationale |
|-------------|-------------|-----------|
| **Active** | **Expanded** — full query block, chunk grid, summary preview | Participant needs to see current work |
| **Completed** (most recent) | **Expanded** | Still fresh, may want to reference |
| **Completed** (older) | **Compact** — one-line per section | Save space, click to expand |
| **Upcoming** | **Collapsed** — single line with step preview | Not yet relevant |

### Compact format
```
✓ PHASE 1 · Baseline                           AMZN
  QUERY  "What are the main supply chain..."
  RETRIEVAL  8 chunks (auto)
  SUMMARY  3 paragraphs                       [View]
  FEEDBACK  C:3 A:4 Ctrl:1 Cite:Yes          [Detail]
```

### Expanded format (click to toggle)
Shows full query block, chunk grid, summary preview (as in Section 2 mockup).

---

## 12. Implementation Considerations

### New store state
```typescript
// Add to StudyState interface in studyStore.ts
ledgerPhases: LedgerPhase[];

// Actions to populate it
appendLedgerQuery: (phase: number, query: string) => void;
appendLedgerRetrieval: (phase: number, retrieval: LedgerRetrieval) => void;
appendLedgerSummary: (phase: number, summary: LedgerSummary) => void;
appendLedgerFeedback: (phase: number, feedback: LedgerFeedback) => void;
```

### Where to hook in (existing action flows)
| Store action | Ledger update |
|-------------|---------------|
| `askQuery(query)` | `appendLedgerQuery(currentPhase, query)` |
| `submitNodeSelection(...)` | `appendLedgerRetrieval(currentPhase, { chunks, selected, rejected })` |
| `triggerGeneration(...)` resolves | `appendLedgerSummary(currentPhase, { text, wasEdited: false })` |
| `submitEditedSummary(...)` | Update `ledgerSummary.text`, set `wasEdited: true` |
| `submitCheckpoint("seed-questionnaire", data)` | `appendLedgerFeedback(currentPhase, data)` |
| `advancePhase()` | Mark current ledger phase as completed |

### Priority

| Priority | Item | Effort |
|----------|------|--------|
| **P0** | `LedgerPhase` store state + append actions | ~2 hours |
| **P0** | `SessionLedger` component with query + retrieval count + summary preview | ~3 hours |
| **P0** | Integration into right pane (replaces default empty state) | ~30 min |
| **P1** | Clickable chunk boxes + `ChunkDetailView` overlay | ~2 hours |
| **P1** | Compact/expanded toggle for completed phases | ~1 hour |
| **P1** | [View] summary + [Detail] feedback buttons (reuse existing overlays) | ~1 hour |
| **P2** | Auto-scroll to active phase on advance | ~30 min |
| **P2** | Progress bar in header | ~30 min |
| **P3** | Edit diff display (additions/deletions count) | ~1 hour |

**Minimum viable (P0): ~5.5 hours**
**Full feature (P0+P1): ~9.5 hours**
