# Feedback-Driven Improvements

Changes implemented in response to external review feedback. These enhancements strengthen observability, measurement precision, and source traceability.

---

## 1. LLM Observability — Token & Latency Tracking

**Feedback:** Add observability tooling (Langfuse/LangSmith) to track LLM cost, latency, and token usage.

**What was implemented:** Lightweight built-in observability — no external dependency required.

### How it works

Every LLM call now captures three metrics from the OpenAI API response:

| Metric | Source | Storage |
|---|---|---|
| `prompt_tokens` | `response.usage.prompt_tokens` | `task.llm_metrics` JSON |
| `completion_tokens` | `response.usage.completion_tokens` | `task.llm_metrics` JSON |
| `duration_ms` | `time.time()` delta around the HTTP call | `task.llm_metrics` JSON |

Two distinct LLM call types are tracked:

**Summary generation** (`llm_service.py`) — one call per task using `gpt-5.2`:
```json
{
  "generation": {
    "prompt_tokens": 4821,
    "completion_tokens": 512,
    "duration_ms": 3200,
    "model": "gpt-5.2"
  }
}
```

**Tree navigation** (`tree_service.py`) — 2–4 calls per task using `o3-mini`, one at each traversal depth:
```json
{
  "navigation": [
    { "prompt_tokens": 380, "completion_tokens": 45, "duration_ms": 850, "model": "o3-mini", "depth": 0 },
    { "prompt_tokens": 620, "completion_tokens": 52, "duration_ms": 920, "model": "o3-mini", "depth": 1 },
    { "prompt_tokens": 890, "completion_tokens": 68, "duration_ms": 1100, "model": "o3-mini", "depth": 2 }
  ]
}
```

Both are merged into a single `llm_metrics` JSON field on the task record, populated incrementally:
- Navigation metrics are stored after the `/query` endpoint completes
- Generation metrics are stored after the `/generate` endpoint completes

### What this enables

- **Cost analysis:** Total tokens per session/condition, estimated cost at published API rates
- **Latency budgets:** Breakdown of where time is spent (navigation vs generation)
- **HITL impact measurement:** "Do HITL-R sessions use fewer generation tokens because participants filter irrelevant chunks?"
- **Per-depth navigation cost:** Which tree levels require the most reasoning effort?

### Implementation details

- `LLMService.generate_summary()` now returns an `LLMResult` dataclass (content + metrics) instead of a raw string
- `_call_nav_llm()` now returns a `(selected_ids, metrics_dict)` tuple
- `RetrievalResult` dataclass extended with optional `nav_metrics` field
- No external dependencies — uses existing OpenAI response `usage` field + `time.time()`

### Files changed

- `src/backend/app/services/llm_service.py` — `LLMResult` dataclass, timing, token extraction
- `src/backend/app/services/tree_service.py` — per-call metrics in `_call_nav_llm`, aggregation in `traverse_tree`
- `src/backend/app/services/pageindex_service.py` — `nav_metrics` on `RetrievalResult`
- `src/backend/app/routers/tasks.py` — store metrics on task in query + generate endpoints
- `src/backend/app/models/task.py` — `llm_metrics` JSON column

---

## 2. Edit Distance Metric

**Feedback:** Track implicit behavioral metrics such as edit distance to quantify editing effort.

**What was implemented:** Word-level Levenshtein edit distance + character-level similarity ratio, computed server-side on every HITL-G/HITL-Full edit submission.

### Previous implementation

```python
characters_edited = abs(len(edited) - len(original))
```

This is a simple length difference. Replacing 10 characters with 10 different characters produces `0` — it misses the actual editing work.

### New implementation

Two complementary metrics:

| Metric | Method | What it captures |
|---|---|---|
| `edit_distance` | Word-level Levenshtein | Number of word insertions, deletions, substitutions |
| `edit_similarity` | `difflib.SequenceMatcher.ratio()` | 0.0–1.0 similarity between original and edited text |

Word-level Levenshtein was chosen over character-level because:
- Summary edits are semantic (adding/removing sentences, rephrasing claims) not typographic
- Word-level distance is more interpretable: "5 words changed" vs "47 characters changed"
- Avoids inflation from whitespace or punctuation changes

### Example

| Original | Edited | `characters_edited` (old) | `edit_distance` (new) | `edit_similarity` (new) |
|---|---|---|---|---|
| "The company faces risks" | "The company faces significant risks" | 12 | 1 | 0.8889 |
| "Revenue declined 5%" | "Revenue increased 5%" | 0 | 1 | 0.6667 |

The second case is critical — the old metric showed 0 change for a factual correction.

### What this enables

- **Editing effort quantification:** Compare edit distance across HITL-G vs HITL-Full conditions
- **Quality proxy:** High edit distance suggests the participant found significant issues with the AI summary
- **Correlation analysis:** Edit distance vs trust ratings, edit distance vs retrieval quality tier

### Files changed

- `src/backend/app/models/task.py` — `edit_distance` (Integer), `edit_similarity` (Float) columns
- `src/backend/app/routers/tasks.py` — `_word_level_edit_distance()` function, computed in `edit_summary` endpoint
- `src/backend/app/schemas/task.py` — fields added to `EditSummaryResponse`

No external dependencies — uses `difflib.SequenceMatcher` (Python stdlib) and a compact Levenshtein implementation.

---

## 3. Time-to-First-Edit Tracking

**Feedback:** Capture implicit behavioral metrics — how long participants deliberate before editing.

**What was implemented:** Frontend captures the timestamp of the first keystroke in the edit textarea, sent to the backend with the edit submission.

### How it works

1. `EditableSummaryCard` component uses a `useRef<number | null>(null)` to track first edit time
2. On the first `onChange` event of the textarea, `firstEditRef.current = Date.now()`
3. The timestamp is passed through the API chain: component → store → client → backend
4. Backend converts from Unix milliseconds to a `datetime` and stores as `first_edit_at`

### What this enables

**Deliberation time** = `first_edit_at - generation_completed_at`

This measures how long the participant reads the AI summary before deciding to make their first edit. Combined with edit distance:

| Deliberation time | Edit distance | Interpretation |
|---|---|---|
| Short | Low | Quick cosmetic fix |
| Short | High | Immediate recognition of significant issues |
| Long | Low | Careful review, minor adjustment |
| Long | High | Thorough evaluation before substantial rewrite |

### Files changed

- `src/frontend/src/components/study/StudyChatGate.tsx` — `firstEditRef` in `EditableSummaryCard`
- `src/frontend/src/stores/studyStore.ts` — `firstEditAtMs` parameter on `submitEditedSummary`
- `src/frontend/src/api/client.ts` — `first_edit_at_ms` in `editSummaryTask` request body
- `src/backend/app/schemas/task.py` — `first_edit_at_ms` on `EditSummaryRequest`
- `src/backend/app/models/task.py` — `first_edit_at` DateTime column
- `src/backend/app/routers/tasks.py` — stores converted timestamp

---

## 4. PDF Source Highlighting

**Feedback:** Add PDF deep-linking with highlighting so participants can verify AI citations against the original document.

**What was implemented:** When a citation chip is clicked, the PDF viewer now highlights the matching section heading on the rendered page using the react-pdf text layer.

### Previous behavior

Click citation → PDF opens at correct page. No visual indication of which section is referenced.

### New behavior

Click citation → PDF opens at correct page → section heading is highlighted in yellow → page scrolls to the highlighted text.

### How it works

1. `CitationChip` now passes the section title as `highlightText` when opening the PDF viewer
2. `PdfViewerOverlay` uses react-pdf's `onRenderTextLayerSuccess` callback
3. After the text layer renders, it searches for `<span>` elements matching the section title
4. Matching spans receive a `pdf-highlight-match` CSS class (yellow background)
5. The first match is scrolled into view with `scrollIntoView({ behavior: "smooth", block: "center" })`

The matching is fuzzy — it extracts the first 5 significant words (>2 chars) from the title, strips "(Part N)" suffixes, and looks for spans containing at least 2 matching terms. This handles cases where the PDF text layer splits headings across multiple spans.

### Files changed

- `src/frontend/src/stores/studyStore.ts` — `highlightText` optional field on `pdfViewer` state
- `src/frontend/src/components/PdfViewerOverlay.tsx` — `onRenderTextLayerSuccess` highlighting logic
- `src/frontend/src/components/study/StudyChatGate.tsx` — pass `highlightText` in `CitationChip`
- `src/frontend/src/components/study/ChunkDetailView.tsx` — pass `highlightText` in chunk detail PDF link
- `src/frontend/src/index.css` — `.pdf-highlight-match` class

---

## 5. PDF Viewer Dwell Time

**Purpose:** Measure source verification behaviour — how long participants spend viewing the original PDF when checking citations.

### How it works

1. `openPdfViewer` records `pdfViewOpenedAt = Date.now()` in the store
2. `closePdfViewer` computes the elapsed time and adds it to a running `pdfViewDurationMs` accumulator
3. Multiple open/close cycles within a single phase are summed (a participant may check several citations)
4. When the questionnaire is submitted (`submitFeedbackTask`), the accumulated duration is sent as `pdf_view_duration_ms` and stored on the task record
5. The accumulator resets to 0 after submission, ready for the next phase

### What this enables

| Metric | Analysis |
|---|---|
| Total PDF view time per task | Do participants verify sources more in HITL-R (where they chose the chunks) vs Baseline? |
| PDF view time vs trust rating | Does source verification correlate with higher trust scores? |
| PDF view time by quality tier | Do participants spend more time verifying when retrieval quality is lower? |
| View count (open/close cycles) | How many distinct citations do participants check? |

### Files changed

- `src/frontend/src/stores/studyStore.ts` — `pdfViewOpenedAt`, `pdfViewDurationMs` state + open/close tracking
- `src/frontend/src/api/client.ts` — `pdfViewDurationMs` parameter on `submitFeedbackTask`
- `src/backend/app/schemas/task.py` — `pdf_view_duration_ms` on `SubmitFeedbackRequest`
- `src/backend/app/models/task.py` — `pdf_view_duration_ms` Integer column
- `src/backend/app/routers/tasks.py` — store value in `submit_feedback` endpoint
- `src/backend/app/main.py` — SQLite migration for new column

---

## Database Schema Changes

All new columns are nullable and added via the existing SQLite compatibility migration in `main.py`:

```sql
ALTER TABLE tasks ADD COLUMN llm_metrics JSON;
ALTER TABLE tasks ADD COLUMN edit_distance INTEGER;
ALTER TABLE tasks ADD COLUMN edit_similarity FLOAT;
ALTER TABLE tasks ADD COLUMN first_edit_at TIMESTAMP;
ALTER TABLE tasks ADD COLUMN pdf_view_duration_ms INTEGER;
```

Existing data is unaffected — new fields default to `NULL` for historical records.
