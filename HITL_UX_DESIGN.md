# HITL UX, Chat Stream, Session Management & Observability

## Design Reference for Retrieval-Based AI Systems

---

## 1. The Problem with AI Chat Interfaces

Most retrieval-based AI systems ship as a chatbot: text in, text out. This works for simple Q&A but fails when:

- Users need to **trust** the output before acting on it (finance, legal, healthcare, compliance)
- The system needs to **explain** where its answer came from
- Users need to **intervene** at specific pipeline stages, not just accept or reject the final output
- The organisation needs an **audit trail** of what the AI did, what the user saw, and what they changed
- Multiple pipeline steps happen between query and answer, and each step has its own failure mode

The solution is a **structured chat stream** — a conversational interface where every pipeline stage produces a visible, typed element that can be inspected, overridden, and audited.

---

## 2. Chat Stream Architecture

### Core Concept: Everything Is a Message

Instead of a simple `{role, content}` message array, every visual element in the UI is a **typed message** in an append-only stream. The renderer is a pure type-switch — each message type has its own component, zero conditional logic.

```
Store:
  messages: TypedMessage[]      ← scrollable stream (the process)
  tailAction: TailAction        ← pinned zone below stream (next action)
```

### Message Types for a Retrieval-Based AI System

| Type                   | When                             | What Renders                                                | Purpose                              |
| ---------------------- | -------------------------------- | ----------------------------------------------------------- | ------------------------------------ |
| `phase_start`        | New task begins                  | Task banner with context (document, mode)                   | Orientation                          |
| `text`               | User/system message              | Chat bubble                                                 | Conversational context               |
| `loading`            | Pipeline step running            | Spinner with status text                                    | System feedback                      |
| `traversal_path`     | After retrieval                  | Navigation breadcrumbs showing how the system found content | **Explainability**             |
| `retrieved_nodes`    | After retrieval                  | Chunk cards with title, page reference, content preview     | **Transparency**               |
| `selector`           | When user can control retrieval  | Expandable chunks with checkboxes                           | **Human control (retrieval)**  |
| `generate_prompt`    | Before generation                | Confirmation of what will be sent to the LLM                | **Consent**                    |
| `summary`            | After generation                 | Formatted output with inline citations                      | Delivery                             |
| `editable_summary`   | When user can control generation | Editable text area with diff tracking                       | **Human control (generation)** |
| `submitted_feedback` | After user feedback              | Collapsed response card                                     | Record                               |

### Pinned Tail Actions

Actions that should never scroll off-screen:

| Type          | When                        | Purpose                        |
| ------------- | --------------------------- | ------------------------------ |
| `next_step` | After current step complete | Advance to next pipeline stage |
| `submit`    | After review complete       | Confirm and finalise           |
| `complete`  | All steps done              | Close the task                 |

Rendered in a fixed CSS grid row below the scrollable stream. The user always sees their next action.

### The Type-Switch Renderer

```typescript
// No conditional logic. No "if mode === X, show Y."
// The store decides which messages to append.
// Components just render their type.

function MessageRenderer({ message }) {
  if (message.type === "traversal_path") return <TraversalPath steps={message.steps} />;
  if (message.type === "selector")       return <ChunkSelector nodes={message.nodes} />;
  if (message.type === "summary")        return <Summary text={message.summary} />;
  if (message.type === "editable_summary") return <EditableSummary text={message.summary} />;
  // ...
}
```

This pattern means:

- **Adding a new pipeline stage** = add a new message type + renderer component
- **Changing what users see** = change which messages the store appends (not the renderer)
- **Replaying a session** = feed the same message array into the same renderer

---

## 3. Human-in-the-Loop Control Points

### The Pipeline

Every retrieval-based AI system follows some version of this:

```
Query → Retrieve → [Checkpoint?] → Generate → [Checkpoint?] → Deliver
```

The question is: **where do you let humans intervene?**

### Four Control Levels

| Level                        | Retrieval                   | Generation                      | User Role                        | Use Case                                                                |
| ---------------------------- | --------------------------- | ------------------------------- | -------------------------------- | ----------------------------------------------------------------------- |
| **Fully Automatic**    | System retrieves            | System generates                | Observer — read the output      | Low-stakes, high-volume queries                                         |
| **Retrieval Control**  | User selects/rejects chunks | System generates from selection | Curator — controls the input    | When retrieval quality varies, domain experts know which sources matter |
| **Generation Control** | System retrieves            | User reviews and edits output   | Editor — refines the output     | When generation quality varies, output must meet specific standards     |
| **Full Control**       | User selects chunks         | User edits output               | Overseer — controls both stages | High-stakes, regulated, compliance-critical                             |

### The Key Design Decision

Don't build 4 separate UIs. Build **one pipeline** with control points that can be toggled on/off:

```
                  Retrieval         Generation
                  Control           Control
                     │                  │
Query → Retrieve → [Selector?] → Generate → [Editor?] → Deliver
                     │                  │
                  ON for:            ON for:
                  - Retrieval        - Generation
                    Control            Control
                  - Full Control     - Full Control
```

Same chat stream, same message types, same renderer. The store simply decides whether to append a `selector` message or skip straight to generation.

### Chunk Selector UX (Retrieval Control Point)

When active, each retrieved chunk renders as an expandable card:

```
┌─ Chunk 4: Supply Chain Risk Factors ──── Page 12 ───── [✓] ─┐
│                                                               │
│  ▼ Expand to read full content                                │
│                                                               │
│  "Disruptions or restrictions could make it difficult or      │
│   impossible to manufacture and deliver products, create      │
│   delays/inefficiencies, increase costs..."                   │
│                                                               │
│  [from_traversal: true] ← provenance flag                    │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

What to capture on selection:

- `selected_node_ids[]` — which chunks the user kept
- `rejected_node_ids[]` — which chunks the user removed
- `selection_order[]` — the sequence of clicks (reveals decision-making process)
- `from_traversal` — per chunk, whether it came from structured navigation or re-ranking

### Summary Editor UX (Generation Control Point)

When active, the generated summary renders with two options:

```
┌─ AI-Generated Summary ──────────────────────────────────────────┐
│                                                                  │
│  [formatted markdown with [Section, Page N] citations]           │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐                              │
│  │  Accept   	  │  │ Edit Summary │                              │
│  └──────────────┘  └──────────────┘                              │
└──────────────────────────────────────────────────────────────────┘
```

If "Edit Summary" → text area opens. What to capture:

- `original_output` — the AI's version (never overwritten)
- `edited_output` — the user's version
- `characters_edited` — raw count
- `edit_distance` — Levenshtein distance
- `edit_similarity` — normalised 0-1 (how much they changed)
- `flagged_spans[]` — text ranges the user marked as incorrect (with reason)
- `first_edit_timestamp` — how long they read before modifying

Preserving both versions is critical in regulated environments — you need to show what the AI produced and what the human approved.

---

## 4. Session Management & Task Navigation

### The Problem

In a single-query chatbot, session management is trivial. But retrieval-based AI systems often involve:

- Multiple documents or tasks in a session
- Multi-step pipelines per task
- Users needing to review past tasks while working on current ones
- Facilitators or admins monitoring progress

### Dual-Panel Layout

```
┌─── Chat Stream (scrollable) ────────┬─── Session Map (persistent) ──────┐
│                                      │                                    │
│  [phase_start: Task 1, Document A]   │  ✓ TASK 1  [Automatic]    DOC-A   │
│  [text: query]                       │    Query: "..."                    │
│  [traversal_path: D0→D1→D2]         │    Retrieved: 8 chunks     [View]  │
│  [retrieved_nodes: 8 chunks]         │    Output: 4 paragraphs   [View]  │
│  [summary: ...]                      │                                    │
│                                      │  ● TASK 2  [Retrieval Ctrl] DOC-B │
│  [phase_start: Task 2, Document B]   │    Query: "..."                    │
│  [text: query]                       │    Retrieved: 8 → 6 selected      │
│  [selector: choose chunks]           │    ✓1 ✓2 ✓3 ✓4 ✓5 ✓6 ✗7 ✗8      │
│  ...                                 │    Output: ○ Generating...         │
│                                      │                                    │
│ ─────────────────────────────────── │  ○ TASK 3  [Full Control]   DOC-C  │
│  [tail action: Generate Summary ▶]   │    Upcoming                        │
│                                      │                                    │
└──────────────────────────────────────┴────────────────────────────────────┘
```

**Left panel (Chat Stream):** temporal — messages in order, the detailed process.
**Right panel (Session Map):** structural — task overview, progress tracking, quick access to past results.

### Session Map Data Model

```typescript
interface SessionTask {
  taskId: string;
  document: string;
  controlLevel: "automatic" | "retrieval" | "generation" | "full";
  status: "completed" | "active" | "upcoming";
  activeStep: "query" | "retrieval" | "generation" | "review" | null;
  query: { text: string; submittedAt: string } | null;
  retrieval: {
    totalRetrieved: number;
    totalSelected: number;
    chunks: { id: string; title: string; pageRef: string; selected: boolean }[];
  } | null;
  output: {
    text: string;
    wasEdited: boolean;
    editMetrics?: { characters: number; distance: number; similarity: number };
    sourceNodes?: RetrievalNode[];
  } | null;
}
```

### Key UX Patterns

| Pattern                              | Implementation                                                | Why                                 |
| ------------------------------------ | ------------------------------------------------------------- | ----------------------------------- |
| **Auto-scroll to active task** | When a new task starts, session map scrolls to it             | User always knows where they are    |
| **Chunk status pills**         | Green (selected) / grey (rejected) numbered badges            | At-a-glance retrieval outcome       |
| **View buttons on past tasks** | Click to see full retrieval or output from earlier tasks      | Review without leaving current work |
| **Chunk detail drill-down**    | Click a chunk pill → full content, page ref, provenance      | Deep inspection when needed         |
| **Progress indicator**         | Percentage or step count at top of session map                | Session-level awareness             |
| **Upcoming task preview**      | Shows pipeline steps for next task based on its control level | Reduces surprise                    |

---

## 5. Follow-Up System Design

After an initial output is generated, users often want more. Two distinct modes prevent confusion:

### Conversational Follow-Up (Default)

```
User: "Can you explain the supply chain risk in more detail?"
→ LLM answers from existing context (retrieved chunks + generated output)
→ No new retrieval triggered
→ Cheap, fast, stays in context
```

### Document Search (Explicit Action)

```
User clicks [Search Document]: "Are there any tariff-related risks?"
→ Full retrieval pipeline triggered (tree traversal + re-ranking)
→ New chunks returned, can trigger new generation
→ Expensive, slow, new context
```

**Why separate them:**

- Prevents accidental retrieval calls on simple clarification questions
- Makes the cost/latency difference explicit to the user
- Creates cleaner data — you know when users wanted clarification vs new information
- Users explicitly signal intent: "answer from what you have" vs "go find something new"

---

## 6. Source Document Verification

For retrieval-based systems, users need to verify that the AI's output actually matches the source. Build source access into the flow:

```
Citation in output: [Business Risks (Part 2), Page 10]
    │
    ├─ Click citation → Document viewer opens at Page 10
    │
    ├─ Timer starts (pdf_view_opened_at)
    │
    ├─ User reads, verifies, closes viewer
    │
    └─ Timer stops → pdf_view_duration_ms captured
```

**What this gives you:**

- Users can verify citations without leaving the interface
- View duration is a behavioural signal — more time checking may indicate lower confidence in the output
- Page-level deep linking (not just "open the PDF" but "open page 10")
- Highlight text support for directing attention to specific passages

---

## 7. Observability & Audit Trail

### Per-Task Record

Every query through the system produces a complete audit record:

```
┌─ TASK AUDIT RECORD ───────────────────────────────────────────────┐
│                                                                    │
│  IDENTITY                                                          │
│    task_id, session_id, user_id, document, control_level           │
│                                                                    │
│  TIMING (per pipeline stage)                                       │
│    query_submitted_at                                              │
│    retrieval_completed_at                                          │
│    selection_completed_at          ← if retrieval control          │
│    generation_completed_at                                         │
│    first_edit_at                   ← first keystroke in editor     │
│    edit_completed_at               ← if generation control         │
│    task_completed_at                                               │
│    total_duration_seconds                                          │
│    source_view_duration_ms         ← time verifying source docs    │
│                                                                    │
│  RETRIEVAL                                                         │
│    retrieved_nodes[]                                               │
│      - node_id, title, page, content                               │
│      - from_traversal: bool        ← provenance flag               │
│    traversal_path[]                ← navigation trace              │
│      - depth, action, options_presented, selected                  │
│    retrieval_mode                  ← which retrieval method used   │
│                                                                    │
│  SELECTION (if retrieval control)                                  │
│    selected_node_ids[]                                             │
│    rejected_node_ids[]                                             │
│    selection_order[]               ← click sequence                │
│                                                                    │
│  GENERATION                                                        │
│    generated_output                ← original AI text              │
│    llm_metrics                     ← model, tokens, duration      │
│                                                                    │
│  EDITING (if generation control)                                   │
│    edited_output                   ← user's version                │
│    characters_edited                                               │
│    edit_distance                   ← Levenshtein                   │
│    edit_similarity                 ← normalised 0-1                │
│    flagged_spans[]                 ← text marked as incorrect      │
│      - start, end, text, reason                                    │
│                                                                    │
│  LLM METRICS                                                       │
│    navigation[]                    ← per-depth: model, tokens, ms  │
│    generation                      ← model, tokens, ms             │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

### Admin Dashboard — Three Levels of Drill-Down

```
Level 1: System Overview
  ├─ Active users, total tasks, completion rates
  ├─ Average time on task
  ├─ User grid (ID, status, current task, timing)
  └─ Activity feed (recent events across all users)

Level 2: Session Detail (click a user)
  ├─ Session metadata
  ├─ Per-task summary cards:
  │   ├─ Document, control level, query
  │   ├─ Retrieved → selected count
  │   ├─ Output preview, edit metrics
  │   ├─ Timing breakdown
  │   └─ [View Detail] button
  └─ Session timeline

Level 3: Task Detail Modal (click "View Detail")
  ├─ Full query text
  ├─ Chunk list with Selected / Rejected / Re-ranked badges
  ├─ Traversal path (D0 → D1 → D2 → hybrid_rank)
  ├─ LLM metrics (model, tokens, latency per call)
  ├─ Full generated output
  ├─ Full edited output (if applicable)
  ├─ Edit diff metrics
  ├─ Flagged spans (highlighted in text)
  └─ User feedback responses
```

### Answering Audit Questions

| Question                                             | Data Source                                                            |
| ---------------------------------------------------- | ---------------------------------------------------------------------- |
| Why did the system retrieve this chunk?              | `traversal_path` — shows LLM navigation decisions per level         |
| Is this chunk from AI reasoning or keyword matching? | `from_traversal` flag — true = navigation, false = re-ranker        |
| What did the user actually see?                      | `retrieved_nodes` — exact chunks in order                           |
| What did they keep vs reject?                        | `selected_node_ids` / `rejected_node_ids` with `selection_order` |
| What did the AI generate?                            | `generated_output` — original, never overwritten                    |
| What did the user change?                            | `edited_output` + `edit_distance` + `edit_similarity`            |
| Did they flag anything as wrong?                     | `flagged_spans` — exact text ranges with reasons                    |
| How long did each step take?                         | Per-stage timestamps                                                   |
| How much time did they spend verifying sources?      | `source_view_duration_ms`                                            |
| What model was used and what did it cost?            | `llm_metrics` — model, tokens, duration                             |

---

## 8. Session History & Replay

### Snapshot Model

When a session completes (or at any save point), capture a full snapshot:

```typescript
interface SessionSnapshot {
  snapshotId: string;
  title: string;
  session: SessionState;
  messages: TypedMessage[];          // full message stream
  sessionTasks: SessionTask[];       // full session map state
}
```

### Replay

Feed the snapshot's message array into the same renderer → **read-only replay** of the entire session. The user (or admin) sees exactly what happened: same messages, same order, same session map.

Persist snapshots to localStorage (single-user) or server (multi-user). Zustand's `persist` middleware handles this cleanly for client-side state.

### Why This Matters

- **Users** can review past sessions before starting new ones
- **Admins** can replay any session without the user present
- **Crash recovery** — state survives page refreshes
- **Compliance** — full session record, reproducible at any time

---

## 9. Design Patterns Summary

### Reusable Patterns for Retrieval-Based AI Systems

| Pattern                                | What                                                                     | Why                                                                      |
| -------------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------ |
| **Typed message stream**         | Every UI element is a typed message in an append-only array              | Single source of truth, replayable, auditable                            |
| **Type-switch renderer**         | Renderer dispatches by `message.type`, each type has its own component | New pipeline stages = new message type + component, nothing else changes |
| **Pinned tail actions**          | Next-step buttons in fixed zone below scroll                             | User always sees their next action                                       |
| **Mode-driven control points**   | Same pipeline, toggle checkpoints on/off per user role                   | One codebase, multiple control levels                                    |
| **Dual-panel layout**            | Chat stream (detail) + session map (overview)                            | Temporal process + structural awareness                                  |
| **Provenance flags**             | `from_traversal` tag on each chunk                                     | Users and admins know where content came from                            |
| **Edit preservation**            | Original AI output never overwritten                                     | Both versions available for comparison and compliance                    |
| **Selection order capture**      | Array of click sequence, not just final state                            | Reveals decision-making process                                          |
| **Per-stage timestamps**         | Individual timestamps for each pipeline step                             | Granular timing analysis, bottleneck detection                           |
| **Source view duration**         | Timer on document viewer                                                 | Behavioural signal for confidence in AI output                           |
| **Follow-up bifurcation**        | Chat (no retrieval) vs Search (full pipeline)                            | Separate clarification from exploration                                  |
| **Session snapshots**            | Full state captured for read-only replay                                 | Audit, review, crash recovery                                            |
| **Three-level admin drill-down** | Overview → session → task detail                                       | Right level of detail for each question                                  |

### Applying Per Role

| Role                                  | What They Need                        | Which Patterns                                            |
| ------------------------------------- | ------------------------------------- | --------------------------------------------------------- |
| **End user (low-stakes)**       | Quick answers, basic citations        | Typed stream, summary + citations, follow-up chat         |
| **Analyst (medium-stakes)**     | Source verification, chunk inspection | + Dual-panel, source viewer, chunk detail                 |
| **Domain expert (high-stakes)** | Full retrieval + generation control   | + Selector, editor, provenance flags, edit preservation   |
| **Compliance officer**          | Audit trail, session replay           | + Three-level drill-down, per-stage timestamps, snapshots |
| **System admin**                | Monitoring, cost tracking             | + Overview dashboard, LLM metrics, activity feed          |
