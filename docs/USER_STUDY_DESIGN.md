# User Study Design: AI-Assisted Financial Risk Analysis with Human-in-the-Loop

**Project:** Enhancing Trust in AI-Generated Financial Risk Summaries through Human-in-the-Loop Feedback
**Duration:** 75-90 minutes per participant
**Modality:** Online via Microsoft Teams
**Date:** 2026-02-22

---

## Table of Contents
1. [Study Overview](#study-overview)
2. [Participants](#participants)
3. [Ticker Quality Tiers & Assignment](#ticker-quality-tiers--assignment)
4. [Study Structure & Timing](#study-structure--timing)
5. [Human-in-the-Loop Checkpoints](#human-in-the-loop-checkpoints)
6. [Phase Designs](#phase-designs)
7. [Data Collection](#data-collection)
8. [Implementation Changes](#implementation-changes)

---

## 1. Study Overview

### Research Questions
1. **RQ1:** How does human-in-the-loop (HITL) feedback at different pipeline stages affect trust in AI-generated risk summaries?
2. **RQ2:** Does retrieval-level feedback (HITL-R: chunk selection) versus generation-level feedback (HITL-G: summary editing) differ in perceived control and trust?
3. **RQ3:** How does document quality (retrieval accuracy) moderate the effectiveness of HITL interventions?
4. **RQ4:** What is the minimum acceptable retrieval quality for professional use?

### Study Design
- **Between-subjects:** Group A vs Group B (counterbalanced HITL modes)
- **Within-subjects:** 3 phases per participant (different modes)
- **Mixed quality:** Participants experience tickers across quality tiers
- **Standardized queries:** Same query per ticker for all participants

---

## 2. Participants

### Inclusion Criteria (Ethics-Approved)
- Aged 18 or over
- **Professional analysts:** ≥2 years relevant experience, OR
- **Advanced learners:** MSc/MBA students, CFA Level 2/3, or final-year finance undergraduates with relevant training

### Sample Size
- **Target:** 16-24 participants
- **Minimum:** 12 participants (6 per group)
- **Statistical power:** Sufficient for within-subjects comparisons (3 phases × 16 participants = 48 observations)

### Compensation
- RM150 (£25 equivalent) regardless of completion
- Provided after session

---

## 3. Ticker Quality Tiers & Assignment

### Quality Tiers (Based on Standardized top-k=10, 80% threshold)

#### Tier 1: Excellent (90%+) - Primary
| Ticker | Sector | Retrieval | Item 1A Children | Use For |
|--------|--------|-----------|------------------|---------|
| **WMT** | Retail | 100% (8/8) | 19 | Tutorial, anchor |
| **AMZN** | E-commerce | 93.3% (14/15) | 27 | Main tasks |
| **AAPL** | Tech (Consumer) | 88.2% (15/17) | 3 | Main tasks |

#### Tier 2: Good (80-89%) - Secondary
| Ticker | Sector | Retrieval | Item 1A Children | Use For |
|--------|--------|-----------|------------------|---------|
| **MSFT** | Tech (Software) | 80.0% (8/10) | 16 | Main tasks |

#### Tier 3: Acceptable (75-79%) - Exploratory
| Ticker | Sector | Retrieval | Item 1A Children | Use For |
|--------|--------|-----------|------------------|---------|
| **TSLA** | Automotive | 75.0% (6/8) | 8 | Quality comparison |
| **PFE** | Pharmaceutical | 75.0% (6/8) | 6 | Quality comparison |
| **XOM** | Energy | 77.8% (7/9) | 4 | Quality comparison* |

**Notes:**
- Tier 3 includes quality as research variable
- XOM has missing Item 1 (use only for risk factor queries)
- **BA** excluded (100% retrieval but needs verification)
- **JPM** excluded (previous tree build failures)

### Ticker Assignment Strategy

**Each participant completes 3 phases with 3 different tickers:**

**Assignment principles:**
1. **Anchor with quality:** Start with Tier 1 ticker
2. **Balanced exposure:** Each tier represented across participants
3. **Sector diversity:** Avoid same sector across phases
4. **Quality gradient:** High → Medium → Variable (not always descending)

**Example assignments:**
```
P01 (Group A): WMT → MSFT → PFE  (Tier 1 → 2 → 3)
P02 (Group B): AMZN → AAPL → TSLA (Tier 1 → 1 → 3)
P03 (Group A): WMT → AAPL → XOM  (Tier 1 → 1 → 3)
P04 (Group B): AMZN → MSFT → PFE (Tier 1 → 2 → 3)
```

**Counterbalancing matrix:**
- Each ticker used ~6 times across 16 participants
- Tier 1 tickers over-represented (higher confidence)
- Tier 3 tickers under-represented (exploratory)

---

## 4. Study Structure & Timing

### Total Session Duration: 75-90 minutes

```
┌─────────────────────────────────────────────────────────────┐
│ STUDY TIMELINE                                              │
├─────────────────────────────────────────────────────────────┤
│ 1. Introduction & Consent       │  5 minutes                │
│ 2. Tutorial (WMT)               │ 10 minutes                │
│ 3. Phase 1: Baseline            │ 15 minutes                │
│ 4. Phase 2: HITL-R or HITL-G    │ 20 minutes                │
│ 5. Phase 3: HITL-Full           │ 20 minutes                │
│ 6. Post-Study Questionnaire     │  8 minutes                │
│ 7. Optional Interview           │  5-10 minutes (optional)  │
│ 8. Debrief & Compensation       │  2 minutes                │
├─────────────────────────────────────────────────────────────┤
│ TOTAL                           │ 75-90 minutes             │
└─────────────────────────────────────────────────────────────┘
```

### Detailed Timing Breakdown

#### 1. Introduction & Consent (5 min)
- Welcome and rapport building (1 min)
- Study overview and expectations (2 min)
- Consent form review and signing (2 min)
- **Recording starts**

#### 2. Tutorial Phase (10 min)
- **Ticker:** WMT (Tier 1, 100% quality - guaranteed good experience)
- **Mode:** Simplified HITL-Full (all features)
- **Query:** "Identify the competitive and supply chain risks facing Walmart's retail and e-commerce business."
- **Goal:** Familiarize with interface, explain all checkpoints
- **Activities:**
  - Interface walkthrough (2 min)
  - Demo query submission (1 min)
  - Demo chunk selector (HITL-R) (3 min)
  - Demo summary editor (HITL-G) (3 min)
  - Q&A (1 min)
- **No data collection** - practice only

#### 3. Phase 1: Baseline (15 min)
- **Mode:** Baseline (no HITL checkpoints)
- **Ticker:** Assigned from Tier 1-2
- **Query:** Pre-defined standardized query
- **Activities:**
  1. Query submission (1 min)
  2. AI processes query (1-2 min)
     - Retrieval (tree traversal)
     - Generation (risk summary)
  3. Review AI-generated summary (8 min)
     - Read summary
     - Evaluate quality
  4. **Checkpoint: Post-generation questionnaire** (4 min)
     - Trust rating (1-5 scale)
     - Accuracy perception
     - Completeness rating
     - Control perception
     - Open feedback
  5. Phase transition (1 min)

#### 4. Phase 2: HITL-R or HITL-G (20 min)
- **Mode:**
  - **Group A:** HITL-R (chunk selector only)
  - **Group B:** HITL-G (summary editor only)
- **Ticker:** Assigned from Tier 1-3
- **Query:** Pre-defined standardized query
- **Activities:**
  1. Query submission (1 min)
  2. AI retrieval (1-2 min)
  3. **[Group A] Checkpoint: Chunk selector** (7 min)
     - Review retrieved chunks (~5-10 chunks)
     - Select/deselect relevant chunks
     - Indicate confidence in selection
  4. AI generation (1-2 min)
  5. **[Group B] Checkpoint: Summary editor** (7 min)
     - Review AI-generated draft
     - Edit summary (add/remove/modify content)
     - Track changes
  6. Review final summary (4 min)
  7. **Checkpoint: Post-generation questionnaire** (4 min)
     - Same metrics as Phase 1
     - Additional: "How did the [chunk selector/editor] affect your trust?"
  8. Phase transition (1 min)

#### 5. Phase 3: HITL-Full (20 min)
- **Mode:** HITL-Full (both chunk selector AND summary editor)
- **Ticker:** Assigned from Tier 1-3
- **Query:** Pre-defined standardized query
- **Activities:**
  1. Query submission (1 min)
  2. AI retrieval (1-2 min)
  3. **Checkpoint: Chunk selector** (6 min)
     - Select relevant chunks
  4. AI generation (1-2 min)
  5. **Checkpoint: Summary editor** (6 min)
     - Edit summary
  6. Review final summary (2 min)
  7. **Checkpoint: Post-generation questionnaire** (4 min)
     - Same metrics + cumulative comparison

#### 6. Post-Study Questionnaire (8 min)
- Overall trust in system (1 min)
- Mode preference ranking (1 min)
- Perceived usefulness per mode (2 min)
- Quality perceptions per ticker (2 min)
- Deployment readiness rating (1 min)
- Open feedback (1 min)

#### 7. Optional Interview (5-10 min)
- **Participation:** Voluntary
- **Format:** Semi-structured
- **Topics:**
  - Most/least helpful HITL feature
  - Moments of high/low trust
  - Real-world applicability
  - Suggested improvements

#### 8. Debrief & Compensation (2 min)
- Thank participant
- Explain compensation process
- Provide contact for questions
- **Recording stops**

---

## 5. Human-in-the-Loop Checkpoints

### Current Checkpoints (from codebase)

#### 1. Chunk Selector (HITL-R) ✅ **KEEP**
**Definition ID:** `seed-chunk-selector`
**Pipeline Position:** `after_retrieval`
**Applicable Modes:** `hitl_r`, `hitl_full`

**Purpose:** Allow user to review and select retrieved document chunks before generation

**Interface:**
```
┌─────────────────────────────────────────────────┐
│ Retrieved Chunks (5-10 items)                   │
├─────────────────────────────────────────────────┤
│ ☑ 1. Item 1A > Supply Chain Risks (1,245 chars)│
│   "Apple relies heavily on outsourced..."      │
│   [Expand] [Confidence: High/Med/Low]          │
│                                                 │
│ ☑ 2. Item 1A > Geopolitical Risks (987 chars)  │
│   "Operations in Greater China face..."        │
│   [Expand] [Confidence: High/Med/Low]          │
│                                                 │
│ ☐ 3. Item 7 > Revenue by Segment (543 chars)   │
│   "Geographic revenue breakdown..."             │
│   [Expand] [Confidence: High/Med/Low]          │
└─────────────────────────────────────────────────┘
[Deselect All] [Select All]        [Continue →]
```

**User Actions:**
- Check/uncheck chunks
- Expand to read full content
- Indicate confidence in relevance
- Continue to generation

**Rationale for KEEPING:**
- **High value:** Allows transparency into retrieval
- **Low cognitive load:** Simple select/deselect
- **Direct control:** Impacts generation quality
- **Research value:** Measures trust at retrieval stage

---

#### 2. Summary Editor (HITL-G) ✅ **KEEP**
**Definition ID:** `seed-summary-editor`
**Pipeline Position:** `after_generation`
**Applicable Modes:** `hitl_g`, `hitl_full`

**Purpose:** Allow user to edit AI-generated summary before finalizing

**Interface:**
```
┌─────────────────────────────────────────────────┐
│ AI-Generated Summary                            │
├─────────────────────────────────────────────────┤
│ [Editable text area with tracked changes]      │
│                                                 │
│ Apple faces significant supply chain risks...  │
│ <edited>particularly from Taiwan suppliers     │
│ </edited>...geopolitical tensions...           │
│                                                 │
│ Changes tracked:                                │
│  • Added 1 sentence (line 2)                   │
│  • Modified 3 words (line 4)                   │
│  • Deleted 1 paragraph (Item 7 data)           │
└─────────────────────────────────────────────────┘
[Revert All] [Accept All]           [Finalize →]
```

**User Actions:**
- Edit text freely (add/remove/modify)
- See tracked changes
- Revert or accept changes
- Finalize summary

**Rationale for KEEPING:**
- **High value:** Direct control over output
- **Professional need:** Analysts must verify content
- **Trust mechanism:** Correcting AI builds confidence
- **Research value:** Measures generation trust

---

#### 3. Post-Generation Questionnaire ✅ **KEEP (Modified)**
**Definition ID:** `seed-questionnaire`
**Pipeline Position:** `post_generation`
**Applicable Modes:** All modes

**Purpose:** Collect immediate feedback after each task

**Current content (from code):** "Post-Generation Questionnaire"

**Proposed content (EXPANDED):**

```
Phase [X] Complete - Quick Feedback (4 minutes)

1. Trust in Summary
   How much do you trust this AI-generated summary?
   [1 - Not at all] [2] [3 - Somewhat] [4] [5 - Completely]

2. Accuracy Assessment
   Based on your understanding, how accurate is this summary?
   [1 - Very inaccurate] [2] [3 - Moderately] [4] [5 - Very accurate]

3. Completeness
   Did the summary cover the key risks adequately?
   [1 - Major gaps] [2] [3 - Some gaps] [4] [5 - Comprehensive]

4. Control & Agency
   How much control did you feel over the analysis process?
   [1 - No control] [2] [3 - Some control] [4] [5 - Full control]

5. [If HITL-R/HITL-G/Full] Feature Usefulness
   How helpful was the [chunk selector/summary editor]?
   [1 - Not helpful] [2] [3 - Somewhat] [4] [5 - Very helpful]

6. Open Feedback (Optional)
   Any concerns or observations about this task?
   [Text box - 200 chars max]

[Next Phase →]
```

**Rationale for KEEPING (with modifications):**
- **Essential data:** Primary outcome measures
- **Short duration:** 4 minutes acceptable
- **Immediate recall:** Capture reactions while fresh
- **Comparable:** Same questions across phases

---

### Proposed Additional Checkpoints (OPTIONAL)

#### 4. Query Refinement Checkpoint ❓ **CONSIDER**
**Proposed Definition ID:** `query-refinement`
**Pipeline Position:** `before_retrieval`
**Applicable Modes:** All (exploratory)

**Purpose:** Allow users to refine their query before retrieval

**Interface:**
```
┌─────────────────────────────────────────────────┐
│ Your Query                                      │
├─────────────────────────────────────────────────┤
│ [Editable text area]                            │
│ What are the key technology and cybersecurity  │
│ risks that could impact Microsoft's cloud      │
│ business?                                       │
│                                                 │
│ Suggestions:                                    │
│  • Add: "including Azure and Office 365"       │
│  • Clarify: specify timeframe or region        │
└─────────────────────────────────────────────────┘
[Use Original] [Edit Query]          [Search →]
```

**Rationale for REMOVING (NOT RECOMMENDED):**
- ❌ **Confounding:** Changes query = changes task
- ❌ **Comparability:** Can't compare across participants
- ❌ **Time:** Adds 2-3 min per task
- ❌ **Study design:** Standardized queries required
- **Decision:** **DO NOT IMPLEMENT** for this study

---

#### 5. Confidence Indicator ❓ **CONSIDER**
**Proposed Definition ID:** `ai-confidence-indicator`
**Pipeline Position:** `with_generation`
**Applicable Modes:** All (passive display)

**Purpose:** Show AI's confidence in generated content

**Interface:**
```
┌─────────────────────────────────────────────────┐
│ AI-Generated Summary                            │
├─────────────────────────────────────────────────┤
│ Apple faces supply chain risks (Conf: High ●●●) │
│ particularly from Taiwan suppliers              │
│ (Conf: Medium ●●○). Geopolitical tensions...   │
│ (Conf: High ●●●)                                │
│                                                 │
│ Overall Confidence: Medium (73%)                │
└─────────────────────────────────────────────────┘
```

**Rationale for REMOVING (NOT RECOMMENDED):**
- ❌ **Complexity:** Hard to calibrate accurately
- ❌ **Interpretation:** Users may misunderstand meaning
- ❌ **Development cost:** Significant implementation
- ❌ **Study scope:** Not core to RQ1-RQ4
- **Decision:** **DO NOT IMPLEMENT** for this study

---

### Checkpoint Decision Summary

| Checkpoint | Keep/Remove | Rationale |
|------------|-------------|-----------|
| **Chunk Selector** | ✅ **KEEP** | Core HITL-R, essential for RQ2 |
| **Summary Editor** | ✅ **KEEP** | Core HITL-G, essential for RQ2 |
| **Post-Gen Questionnaire** | ✅ **KEEP (expand)** | Primary outcome measures |
| Query Refinement | ❌ **REMOVE** | Breaks standardization |
| Confidence Indicator | ❌ **REMOVE** | Out of scope, complex |

**Final checkpoint set:** 3 checkpoints (chunk selector, summary editor, questionnaire)

---

## 6. Final Checkpoint Implementation Review

### Current Frontend Implementation Analysis

**Date:** 2026-02-22
**Source:** `src/frontend/src/data/checkpointDefinitions.ts`

The frontend currently implements **3 checkpoints** matching the recommendations:

#### ✅ 1. Chunk Selector (`seed-chunk-selector`)
- **Control type:** `chunk_selector`
- **Pipeline position:** `after_retrieval`
- **Applicable modes:** `hitl_r`, `hitl_full`
- **Status:** ✅ **APPROVED** - Keep as-is
- **Rationale:** Essential for RQ2 (retrieval-level feedback), low cognitive load, direct control

#### ✅ 2. Summary Editor (`seed-summary-editor`)
- **Control type:** `summary_editor`
- **Pipeline position:** `after_generation`
- **Applicable modes:** `hitl_g`, `hitl_full`
- **Status:** ✅ **APPROVED** - Keep as-is
- **Rationale:** Essential for RQ2 (generation-level feedback), professional need, high research value

#### ✅ 3. Post-Generation Questionnaire (`seed-questionnaire`)
- **Control type:** `questionnaire`
- **Pipeline position:** `post_generation`
- **Applicable modes:** `hitl_r`, `hitl_g`, `hitl_full`
- **Status:** ⚠️ **NEEDS REVISION** - Expand field schema
- **Current fields:** 3 questions (confidence, citation_helpfulness, notes)
- **Recommended fields:** 6 questions (see below)

---

### Questionnaire Field Schema Comparison

#### Current Implementation (3 fields)
```typescript
field_schema: [
  {
    key: "confidence",
    type: "select",
    label: "Confidence in this summary",
    required: true,
    options: ["1 - Very low", "2 - Low", "3 - Medium", "4 - High", "5 - Very high"]
  },
  {
    key: "citation_helpfulness",
    type: "radio",
    label: "Were citations helpful?",
    required: true,
    options: ["Yes", "Partly", "No"]
  },
  {
    key: "notes",
    type: "textarea",
    label: "Additional notes",
    required: false,
    placeholder: "Anything unclear or missing?"
  }
]
```

**Issues with current schema:**
1. ❌ **"Confidence" is ambiguous** - conflates completeness, accuracy, and trust
2. ❌ **Missing perceived control measure** - needed for RQ1 (trust via control)
3. ❌ **Missing feature usefulness measure** - needed for RQ2 (HITL feedback comparison)
4. ⚠️ **Citation helpfulness too narrow** - doesn't capture overall summary quality

---

### Recommended Final Questionnaire Schema (6 fields)

#### Field 1: Summary Completeness ✅ **ADD**
```typescript
{
  key: "completeness",
  type: "select",
  label: "How complete was this summary?",
  required: true,
  options: [
    { value: "1", label: "1 - Very incomplete" },
    { value: "2", label: "2 - Somewhat incomplete" },
    { value: "3", label: "3 - Acceptable" },
    { value: "4", label: "4 - Complete" },
    { value: "5", label: "5 - Very complete" }
  ]
}
```
**Rationale:** Separates completeness from accuracy (RQ3 - quality moderation). Essential for detecting retrieval failures (missing content).

---

#### Field 2: Summary Accuracy ✅ **ADD**
```typescript
{
  key: "accuracy",
  type: "select",
  label: "How accurate was this summary based on the retrieved documents?",
  required: true,
  options: [
    { value: "1", label: "1 - Very inaccurate" },
    { value: "2", label: "2 - Somewhat inaccurate" },
    { value: "3", label: "3 - Acceptable" },
    { value: "4", label: "4 - Accurate" },
    { value: "5", label: "5 - Very accurate" }
  ]
}
```
**Rationale:** Measures generation quality separately from completeness. Detects hallucination or misinterpretation (distinct from missing content).

---

#### Field 3: Citation Helpfulness ✅ **KEEP**
```typescript
{
  key: "citation_helpfulness",
  type: "radio",
  label: "Were the source citations helpful for verifying the summary?",
  required: true,
  options: [
    { value: "yes", label: "Yes" },
    { value: "partly", label: "Partly" },
    { value: "no", label: "No" }
  ]
}
```
**Rationale:** Traceability is critical for trust (RQ1). Keep as-is, already well-designed.

---

#### Field 4: Perceived Control ✅ **ADD** (Conditional)
```typescript
{
  key: "perceived_control",
  type: "select",
  label: "How much control did you have over the final summary?",
  required: true,
  options: [
    { value: "1", label: "1 - No control" },
    { value: "2", label: "2 - Little control" },
    { value: "3", label: "3 - Some control" },
    { value: "4", label: "4 - Good control" },
    { value: "5", label: "5 - Full control" }
  ],
  // Only show for HITL modes
  condition: {
    applicable_modes: ["hitl_r", "hitl_g", "hitl_full"]
  }
}
```
**Rationale:** **Core to RQ1** (trust via control). Measures whether HITL features actually increase perceived agency. Not applicable to baseline mode (no HITL controls).

**Implementation note:** If frontend doesn't support conditional fields yet, show to all modes but expect baseline to score ~1-2 (low control), HITL modes ~3-5 (higher control).

---

#### Field 5: Feature Usefulness ✅ **ADD** (Conditional)
```typescript
{
  key: "feature_usefulness",
  type: "select",
  label: "How helpful was the [chunk selector / summary editor / both] for improving the summary?",
  required: true,
  options: [
    { value: "1", label: "1 - Not helpful" },
    { value: "2", label: "2 - Slightly helpful" },
    { value: "3", label: "3 - Somewhat helpful" },
    { value: "4", label: "4 - Helpful" },
    { value: "5", label: "5 - Very helpful" }
  ],
  // Only show for HITL modes
  condition: {
    applicable_modes: ["hitl_r", "hitl_g", "hitl_full"]
  }
}
```
**Rationale:** **Core to RQ2** (comparing HITL-R vs HITL-G effectiveness). Directly measures feature value. Label changes based on mode:
- `hitl_r`: "...the **chunk selector**..."
- `hitl_g`: "...the **summary editor**..."
- `hitl_full`: "...the **chunk selector and summary editor**..."

**Implementation note:** If conditional labels aren't supported, use generic "...the feedback tool(s)..." and filter by mode during analysis.

---

#### Field 6: Open Feedback ✅ **KEEP** (Renamed)
```typescript
{
  key: "open_feedback",  // Renamed from "notes" for clarity
  type: "textarea",
  label: "Any concerns or observations about this task? (Optional)",
  required: false,
  placeholder: "Anything unclear or missing? Any issues with the tools?",
  maxLength: 200  // Add character limit for timing control
}
```
**Rationale:** Captures unexpected issues and qualitative insights. Keep optional to reduce pressure. 200-char limit keeps it brief (~30 seconds to write).

---

### Final Questionnaire Implementation Summary

| Field | Current | Recommended | Priority | RQ Link |
|-------|---------|-------------|----------|---------|
| **Completeness** | ❌ Missing | ✅ Add | **HIGH** | RQ3 (quality moderation) |
| **Accuracy** | ❌ Missing | ✅ Add | **HIGH** | RQ3 (quality moderation) |
| **Citation Helpfulness** | ✅ Present | ✅ Keep as-is | **MEDIUM** | RQ1 (trust via traceability) |
| **Perceived Control** | ❌ Missing | ✅ Add (conditional) | **CRITICAL** | **RQ1** (trust via control) |
| **Feature Usefulness** | ❌ Missing | ✅ Add (conditional) | **CRITICAL** | **RQ2** (HITL comparison) |
| **Open Feedback** | ✅ Present | ✅ Keep (rename) | **LOW** | Qualitative insights |
| ~~Confidence~~ | ⚠️ Ambiguous | ❌ Remove | - | Replaced by completeness + accuracy |

**Total questions:**
- Baseline mode: 4 questions (completeness, accuracy, citations, feedback)
- HITL modes: 6 questions (+ perceived control, + feature usefulness)

**Estimated time:**
- Baseline: ~2 minutes (4 questions)
- HITL modes: ~3 minutes (6 questions)
- **Acceptable** within 75-90 min study duration

---

### Implementation Changes Required

#### Backend: `src/backend/app/services/assignment_service.py`
**Status:** No changes needed
- Checkpoint definitions match frontend ✅
- Only questionnaire field schema needs updating (frontend-only)

#### Frontend: `src/frontend/src/data/checkpointDefinitions.ts`
**Changes required:**

```typescript
// BEFORE (current - 3 fields)
field_schema: [
  { key: "confidence", type: "select", ... },           // ❌ Remove
  { key: "citation_helpfulness", type: "radio", ... },  // ✅ Keep
  { key: "notes", type: "textarea", ... }               // ✅ Keep (rename)
]

// AFTER (recommended - 6 fields)
field_schema: [
  { key: "completeness", type: "select", label: "How complete was this summary?", required: true, ... },
  { key: "accuracy", type: "select", label: "How accurate was this summary based on the retrieved documents?", required: true, ... },
  { key: "citation_helpfulness", type: "radio", label: "Were the source citations helpful for verifying the summary?", required: true, ... },
  { key: "perceived_control", type: "select", label: "How much control did you have over the final summary?", required: true, ... },
  { key: "feature_usefulness", type: "select", label: "How helpful was the feedback tool for improving the summary?", required: true, ... },
  { key: "open_feedback", type: "textarea", label: "Any concerns or observations about this task? (Optional)", required: false, maxLength: 200, ... }
]
```

**Note:** If conditional fields aren't supported:
- Show all 6 fields to all modes
- Filter responses during analysis (baseline shouldn't have perceived_control/feature_usefulness data or expect low scores)

**Alternative (simpler implementation):**
- Use 4 core fields for all modes: completeness, accuracy, citations, feedback
- Add perceived_control and feature_usefulness as **post-phase survey questions** instead of per-task checkpoints
- **Trade-off:** Loses immediate per-task feedback but reduces implementation complexity

---

### Decision: Questionnaire Scope

**Recommended approach:** ✅ **Implement full 6-field schema**

**Rationale:**
1. **RQ1 & RQ2 require per-task measures** - Post-study survey would conflate all 3 phases
2. **Conditional logic is simple** - Show fields 4-5 only when `mode != "baseline"`
3. **Time cost is minimal** - 1 extra minute per task (3 min vs 2 min)
4. **Data quality is higher** - Immediate feedback while task is fresh in memory

**Alternative (if time-constrained):** Move perceived_control and feature_usefulness to post-study survey, keep 4-field per-task questionnaire

---

## 6. Phase Designs

### Phase 1: Baseline (No HITL)

**Purpose:** Establish baseline trust and performance without human intervention

**Flow:**
```
User submits query
    ↓
AI retrieves chunks (hidden from user)
    ↓
AI generates summary
    ↓
User reviews final summary only
    ↓
Post-generation questionnaire
```

**No checkpoints except questionnaire**

**Measures:**
- Baseline trust (T₁)
- Baseline accuracy perception (A₁)
- Baseline control (C₁ ≈ minimal)

**Expected outcomes:**
- Lower control perception (no interaction)
- Trust depends on output quality
- Establishes individual baseline

---

### Phase 2A: HITL-R (Group A)

**Purpose:** Test retrieval-level intervention

**Flow:**
```
User submits query
    ↓
AI retrieves chunks
    ↓
👤 CHECKPOINT: User selects relevant chunks
    ↓
AI generates summary from selected chunks
    ↓
User reviews final summary
    ↓
Post-generation questionnaire
```

**Hypothesis:**
- Higher control perception vs Baseline
- Trust depends on retrieval quality visibility
- May expose retrieval errors (if Tier 3 ticker)

---

### Phase 2B: HITL-G (Group B)

**Purpose:** Test generation-level intervention

**Flow:**
```
User submits query
    ↓
AI retrieves chunks (hidden from user)
    ↓
AI generates summary
    ↓
👤 CHECKPOINT: User edits summary
    ↓
User reviews edited final summary
    ↓
Post-generation questionnaire
```

**Hypothesis:**
- Highest control perception (direct output editing)
- Trust depends on generation quality
- May catch factual errors

---

### Phase 3: HITL-Full (Both Groups)

**Purpose:** Test combined intervention (both retrieval and generation)

**Flow:**
```
User submits query
    ↓
AI retrieves chunks
    ↓
👤 CHECKPOINT 1: User selects chunks
    ↓
AI generates summary from selected chunks
    ↓
👤 CHECKPOINT 2: User edits summary
    ↓
User reviews final summary
    ↓
Post-generation questionnaire
```

**Hypothesis:**
- Maximum control (two touchpoints)
- Cumulative trust benefits
- Longer task time (~20 min)

**Comparison enabled:**
- Group A: Baseline → HITL-R → HITL-Full (gradual addition)
- Group B: Baseline → HITL-G → HITL-Full (different gradual addition)
- Both experience full intervention by Phase 3

---

## 7. Data Collection

### 7.1 Automatic Interaction Logs

**Collected automatically by system:**

#### Per Phase
- `phase_id`: Unique identifier
- `participant_id`: P01-P16
- `ticker`: AAPL, MSFT, etc.
- `mode`: baseline, hitl_r, hitl_g, hitl_full
- `query`: Standardized query text
- `start_time`: Phase start timestamp
- `end_time`: Phase end timestamp
- `duration_seconds`: Total phase time

#### Retrieval Data
- `retrieved_chunks`: List of chunk IDs returned by tree traversal
- `chunk_count`: Number of chunks retrieved
- `retrieval_time_ms`: Time to retrieve
- `tree_depth_reached`: Max depth in tree traversal

#### HITL-R Data (if applicable)
- `selected_chunks`: Chunk IDs user selected
- `deselected_chunks`: Chunk IDs user removed
- `chunk_confidence`: User-indicated confidence per chunk
- `selection_time_seconds`: Time spent in chunk selector

#### Generation Data
- `original_summary`: AI-generated summary (before editing)
- `generation_time_ms`: Time to generate
- `summary_length_chars`: Character count

#### HITL-G Data (if applicable)
- `edited_summary`: User-edited summary
- `edit_operations`: List of edits (add/remove/modify)
- `edit_count`: Number of edits
- `editing_time_seconds`: Time spent editing

#### Questionnaire Data
- `trust_rating`: 1-5 scale
- `accuracy_rating`: 1-5
- `completeness_rating`: 1-5
- `control_rating`: 1-5
- `feature_usefulness`: 1-5 (if applicable)
- `open_feedback`: Text

---

### 7.2 Post-Study Questionnaire

**Collected at end of session:**

#### Demographics
- Age range: [18-24, 25-34, 35-44, 45-54, 55+]
- Role: [Professional analyst, MSc/MBA student, CFA candidate, Undergraduate, Other]
- Years of experience: [0-2, 2-5, 5-10, 10+]
- Familiarity with AI tools: [None, Basic, Intermediate, Advanced]

#### Mode Preferences
1. **Ranking:** Rank the 3 modes from most to least preferred
   - Baseline (no intervention)
   - HITL-R (chunk selection)
   - HITL-G (summary editing)
   - HITL-Full (both)

2. **Usefulness:** Rate usefulness of each mode (1-5)

3. **Trust:** Which mode gave you most trust? Least trust?

4. **Deployment:** Would you use this system in your work? (Yes/No/Maybe)
   - If yes: Which mode would you prefer?
   - If no/maybe: What concerns do you have?

#### Quality Perceptions
For each ticker experienced:
- How satisfied were you with results for [TICKER]? (1-5)
- Did you notice any quality issues? (Yes/No)
- If yes: Describe issue briefly

#### Open Feedback
- Most helpful feature?
- Least helpful feature?
- Suggested improvements?
- Any concerns about AI accuracy or bias?

---

### 7.3 Optional Interview

**Semi-structured questions (5-10 min):**

1. **Trust moments:**
   - "Tell me about a moment when you felt high trust in the AI."
   - "Was there a moment when you doubted the AI's output?"

2. **HITL value:**
   - "Did the ability to select chunks (or edit summaries) make you more confident?"
   - "Were there times when the HITL features felt unnecessary?"

3. **Quality differences:**
   - "Did you notice differences in quality across the 3 companies?"
   - "How did quality affect your trust?"

4. **Real-world use:**
   - "Would you use this in your actual work?"
   - "What would need to change for you to rely on it?"

5. **Improvements:**
   - "If you could add one feature, what would it be?"

---

### 7.4 Screen & Audio Recording

**Purpose:** Qualitative analysis, usability insights

**Collected:**
- Full screen recording (interface interactions)
- Audio recording (think-aloud if prompted)
- Facial expressions (if webcam enabled - optional)

**Analysis:**
- Hesitation points (pauses, backtracking)
- Error recovery (how users handle bad outputs)
- Feature usage patterns (which features used, ignored)
- Emotional reactions (frustration, satisfaction)

**Storage:**
- Encrypted, anonymized after transcription
- Deleted after study completion (per ethics)

---

## 8. Implementation Changes

### 8.1 Update Ticker List

**Current (study_setup.py line 3):**
```python
TICKERS = ["MSFT", "AAPL", "TSLA", "JPM", "PFE", "WMT", "XOM", "BA"]
```

**Proposed:**
```python
# Quality-tiered tickers (top-k=10, 80% threshold)
TIER_1_TICKERS = ["WMT", "AMZN", "AAPL"]     # 90%+ retrieval
TIER_2_TICKERS = ["MSFT"]                     # 80-89% retrieval
TIER_3_TICKERS = ["TSLA", "PFE", "XOM"]      # 75-79% retrieval (exploratory)

# All tickers (tutorial uses WMT, removed JPM and BA)
ALL_TICKERS = TIER_1_TICKERS + TIER_2_TICKERS + TIER_3_TICKERS
# ["WMT", "AMZN", "AAPL", "MSFT", "TSLA", "PFE", "XOM"]

# Tutorial ticker (highest quality)
TUTORIAL_TICKER = "WMT"
```

**Rationale:**
- Remove **JPM** (tree build failures)
- Remove **BA** (pending verification - can add later)
- Add **AMZN** (93.3% - excellent)
- Organize by quality tier
- 7 tickers total

---

### 8.2 Add AMZN Query

**Add to QUERIES dict (study_setup.py line 5-14):**
```python
QUERIES = {
    "MSFT": "What are the key technology and cybersecurity risks that could impact Microsoft's cloud business?",
    "AAPL": "Identify and summarize the supply chain and geopolitical risks facing Apple's hardware operations.",
    "AMZN": "What are the main supply chain, fulfillment, and regulatory risks affecting Amazon's e-commerce and cloud operations?",  # NEW
    "TSLA": "What regulatory and safety risks does Tesla face related to its autonomous driving technology?",
    "PFE": "What are the key regulatory approval and patent expiration risks affecting Pfizer's drug pipeline?",
    "WMT": "Identify the competitive and supply chain risks facing Walmart's retail and e-commerce business.",
    "XOM": "What environmental and regulatory compliance risks does ExxonMobil disclose related to climate policy?",
    # Removed: "JPM" and "BA"
}
```

---

### 8.3 Ticker Assignment Logic

**Replace `get_ticker_sequence()` in study_setup.py:**

```python
def get_ticker_sequence(participant_id: str) -> list[str]:
    """Assign 3 tickers per participant with quality-tier balancing.

    Strategy:
    - Phase 1: Always Tier 1 (high quality anchor)
    - Phase 2: Tier 1-2 (maintain quality)
    - Phase 3: Tier 1-3 (introduce variability)
    """
    participant_num = parse_participant_index(participant_id)

    # Assignments designed for 16 participants
    # Each ticker appears ~6-7 times
    # Tier 1 over-represented, Tier 3 under-represented

    assignments = [
        # P01-P04: Tier 1 → Tier 2 → Tier 3
        ["WMT", "MSFT", "PFE"],   # P01
        ["AMZN", "MSFT", "TSLA"], # P02
        ["AAPL", "MSFT", "XOM"],  # P03
        ["WMT", "MSFT", "TSLA"],  # P04

        # P05-P08: Tier 1 → Tier 1 → Tier 3
        ["AMZN", "AAPL", "PFE"],  # P05
        ["WMT", "AMZN", "XOM"],   # P06
        ["AAPL", "WMT", "TSLA"],  # P07
        ["AMZN", "AAPL", "XOM"],  # P08

        # P09-P12: Tier 1 → Tier 2 → Tier 1 (no Tier 3)
        ["WMT", "MSFT", "AMZN"],  # P09
        ["AAPL", "MSFT", "WMT"],  # P10
        ["AMZN", "MSFT", "AAPL"], # P11
        ["WMT", "MSFT", "AAPL"],  # P12

        # P13-P16: Tier 1 → Tier 1 → Tier 2 (high quality focus)
        ["AMZN", "WMT", "MSFT"],  # P13
        ["AAPL", "AMZN", "MSFT"], # P14
        ["WMT", "AAPL", "MSFT"],  # P15
        ["AMZN", "WMT", "MSFT"],  # P16
    ]

    idx = (participant_num - 1) % len(assignments)
    return assignments[idx]
```

**Coverage:**
- WMT: 10 times (Tier 1, 100%)
- AMZN: 10 times (Tier 1, 93%)
- AAPL: 10 times (Tier 1, 88%)
- MSFT: 12 times (Tier 2, 80%)
- PFE: 3 times (Tier 3, 75%)
- TSLA: 4 times (Tier 3, 75%)
- XOM: 4 times (Tier 3, 78%)

**Quality distribution:**
- Phase 1 (all participants): 100% Tier 1 (anchor)
- Phase 2: 75% Tier 1-2, 25% Tier 3
- Phase 3: 50% Tier 1-2, 50% Tier 3

---

### 8.4 Questionnaire Expansion

**Update questionnaire checkpoint (assignment_service.py line 34-40):**

```python
{
    "definition_id": "seed-questionnaire",
    "control_type": "questionnaire",
    "label": "Post-Task Feedback",  # Clearer label
    "pipeline_position": "post_generation",
    "sort_order": 0,
    "applicable_modes": ["baseline", "hitl_r", "hitl_g", "hitl_full"],
    "questions": [  # NEW: Explicit question definitions
        {
            "id": "trust",
            "type": "likert_5",
            "text": "How much do you trust this AI-generated summary?",
            "labels": ["Not at all", "Slightly", "Moderately", "Very", "Completely"]
        },
        {
            "id": "accuracy",
            "type": "likert_5",
            "text": "Based on your understanding, how accurate is this summary?",
            "labels": ["Very inaccurate", "Somewhat inaccurate", "Moderately accurate", "Accurate", "Very accurate"]
        },
        {
            "id": "completeness",
            "type": "likert_5",
            "text": "Did the summary cover the key risks adequately?",
            "labels": ["Major gaps", "Several gaps", "Some gaps", "Mostly complete", "Comprehensive"]
        },
        {
            "id": "control",
            "type": "likert_5",
            "text": "How much control did you feel over the analysis process?",
            "labels": ["No control", "Little control", "Some control", "Good control", "Full control"]
        },
        {
            "id": "feature_usefulness",
            "type": "likert_5",
            "text": "How helpful was the [chunk selector/summary editor] feature?",
            "labels": ["Not helpful", "Slightly helpful", "Moderately helpful", "Very helpful", "Extremely helpful"],
            "conditional": "mode != 'baseline'"  # Only for HITL modes
        },
        {
            "id": "open_feedback",
            "type": "text",
            "text": "Any concerns or observations about this task? (Optional)",
            "max_length": 500
        }
    ]
},
```

---

### 8.5 Tutorial Setup

**Add tutorial configuration:**

```python
# In study_setup.py or new tutorial_config.py

TUTORIAL_CONFIG = {
    "ticker": "WMT",
    "query": "Identify the competitive and supply chain risks facing Walmart's retail and e-commerce business.",
    "mode": "hitl_full",  # Show all features
    "duration_target_minutes": 10,
    "steps": [
        {
            "step": 1,
            "title": "Interface Overview",
            "content": "This is the AI-assisted risk analysis interface. You'll submit a query, review AI-retrieved information, and generate a risk summary.",
            "duration_sec": 60
        },
        {
            "step": 2,
            "title": "Submitting a Query",
            "content": "Enter your query in the search box. For this tutorial, we'll use a pre-filled query about Walmart.",
            "duration_sec": 30
        },
        {
            "step": 3,
            "title": "Chunk Selector (HITL-R)",
            "content": "After retrieval, you'll see relevant document chunks. Check or uncheck boxes to select which chunks the AI should use.",
            "demo": True,
            "duration_sec": 180
        },
        {
            "step": 4,
            "title": "AI Generation",
            "content": "The AI will generate a summary using your selected chunks. This takes 1-2 minutes.",
            "duration_sec": 120
        },
        {
            "step": 5,
            "title": "Summary Editor (HITL-G)",
            "content": "Review the AI's draft. You can edit the text, add missing information, or remove incorrect statements.",
            "demo": True,
            "duration_sec": 180
        },
        {
            "step": 6,
            "title": "Ready to Start",
            "content": "You'll now complete 3 tasks with different companies. Each task has a different mode (features available). Good luck!",
            "duration_sec": 30
        }
    ]
}
```

---

## 9. Analysis Plan

### 9.1 Primary Outcomes (RQ1-RQ2)

**Dependent Variables:**
- Trust rating (1-5 scale)
- Accuracy perception (1-5)
- Completeness rating (1-5)
- Control perception (1-5)

**Independent Variables:**
- Mode (Baseline, HITL-R, HITL-G, HITL-Full)
- Group (A vs B)
- Phase (1, 2, 3)

**Analysis:**
- **Repeated measures ANOVA:** Trust ~ Mode + Group + (1|Participant)
- **Pairwise comparisons:** Baseline vs HITL-R vs HITL-G vs HITL-Full
- **Effect sizes:** Cohen's d for mode differences

**Hypotheses:**
- H1: HITL-Full > HITL-R/HITL-G > Baseline (trust)
- H2: HITL-R and HITL-G have different trust profiles
- H3: Control rating correlates with trust

---

### 9.2 Exploratory Outcomes (RQ3)

**Moderator Variable:**
- Ticker quality tier (Tier 1, 2, 3)

**Analysis:**
- **Moderation:** Trust ~ Mode * QualityTier + (1|Participant)
- **By-tier analysis:** Separate ANOVAs for each tier
- **Interaction plots:** Mode effect by quality

**Hypotheses:**
- H4: Quality tier moderates HITL effectiveness
- H5: Tier 3 (75% quality) shows larger trust variance
- H6: HITL features partially compensate for lower quality

---

### 9.3 Behavioral Measures

**Chunk selection patterns:**
- Selection rate (% chunks selected)
- Selection accuracy (if ground truth available)
- Time to select

**Editing patterns:**
- Edit rate (edits per summary)
- Edit types (add/remove/modify distribution)
- Time to edit

**Correlations:**
- Selection rate ↔ Trust
- Edit rate ↔ Accuracy perception

---

### 9.4 Qualitative Analysis

**Interview coding (if conducted):**
- Trust moments (positive/negative)
- HITL value perceptions
- Feature preferences
- Quality awareness

**Thematic analysis:**
- Common concerns
- Suggested improvements
- Professional use cases

---

## 10. Pilot Study

**Before main study, conduct pilot with N=2-4 participants:**

### Pilot Goals
1. **Timing validation:** Confirm 75-90 min feasible
2. **Interface usability:** Identify confusion points
3. **Technical stability:** Test recording, logging
4. **Questionnaire clarity:** Refine question wording

### Pilot Procedure
- Recruit 2 advanced learners (not professional analysts)
- Run full protocol
- Collect feedback on clarity, duration, technical issues
- Iterate on questionnaire and tutorial

### Pilot Checklist
- [ ] Tutorial duration acceptable (≤10 min)
- [ ] Each phase duration acceptable (15-20 min)
- [ ] Checkpoints function correctly
- [ ] Data logging works
- [ ] Recording quality sufficient
- [ ] Questionnaire understandable
- [ ] No technical crashes

**Timeline:** 1 week before main study

---

## 11. Study Checklist

### Pre-Study
- [ ] Ethics approval confirmed (already done)
- [ ] Recruitment advert distributed
- [ ] Consent forms prepared
- [ ] Compensation process arranged (RM150)
- [ ] Recording software tested (Teams recording)
- [ ] System deployed and stable
- [ ] Ticker assignment spreadsheet prepared
- [ ] Pilot study completed (N=2-4)

### Per-Session
- [ ] Participant scheduled (Teams link sent)
- [ ] Pre-session tech check (5 min before)
- [ ] Recording enabled
- [ ] Consent obtained and recorded
- [ ] Tutorial completed
- [ ] 3 phases completed
- [ ] Post-study questionnaire completed
- [ ] Optional interview (if agreed)
- [ ] Recording stopped and saved
- [ ] Compensation initiated
- [ ] Thank participant

### Post-Session
- [ ] Data exported from system
- [ ] Recording transcribed (if needed)
- [ ] Files organized (anonymized IDs)
- [ ] Backup created

### Post-Study
- [ ] All data collected (N=16 target)
- [ ] Statistical analysis completed
- [ ] Qualitative coding completed
- [ ] Results written up
- [ ] Participants debriefed (if required by ethics)

---

## Summary

### Study Design Decisions

This study design:

✅ **Meets ethics approval:** 75-90 min, online, standardized tasks, compensation
✅ **Addresses RQs:** HITL effectiveness, mode comparison, quality moderation
✅ **Uses quality tiers:** 7 tickers across 3 tiers (WMT, AMZN, AAPL, MSFT, TSLA, PFE, XOM)
✅ **Keeps essential checkpoints:** Chunk selector, summary editor, questionnaire
✅ **Removes unnecessary checkpoints:** Query refinement, confidence indicators
✅ **Balances rigor and feasibility:** 16 participants, 3 phases each, 48 observations
✅ **Enables rich analysis:** Trust measures, behavioral logs, quality moderation

---

### Checkpoint Implementation Decisions (Final)

Based on review of `src/frontend/src/data/checkpointDefinitions.ts`:

#### ✅ **APPROVED - Keep As-Is (2 checkpoints)**
1. **Chunk Selector** (`seed-chunk-selector`)
   - Pipeline: `after_retrieval`
   - Modes: `hitl_r`, `hitl_full`
   - **Action:** No changes needed

2. **Summary Editor** (`seed-summary-editor`)
   - Pipeline: `after_generation`
   - Modes: `hitl_g`, `hitl_full`
   - **Action:** No changes needed

#### ⚠️ **REQUIRES UPDATE (1 checkpoint)**
3. **Post-Generation Questionnaire** (`seed-questionnaire`)
   - Pipeline: `post_generation`
   - Modes: All (`baseline`, `hitl_r`, `hitl_g`, `hitl_full`)
   - **Action:** Expand from 3 fields → 6 fields

**Current questionnaire (3 fields):**
- ❌ `confidence` (1-5 select) - Too ambiguous, remove
- ✅ `citation_helpfulness` (yes/partly/no radio) - Keep
- ✅ `notes` (textarea) - Keep and rename to `open_feedback`

**Recommended questionnaire (6 fields):**
1. ✅ `completeness` (1-5 select) - **NEW** - "How complete was this summary?"
2. ✅ `accuracy` (1-5 select) - **NEW** - "How accurate was this summary based on the retrieved documents?"
3. ✅ `citation_helpfulness` (yes/partly/no radio) - **KEEP** - "Were the source citations helpful for verifying the summary?"
4. ✅ `perceived_control` (1-5 select) - **NEW** - "How much control did you have over the final summary?" (HITL modes only)
5. ✅ `feature_usefulness` (1-5 select) - **NEW** - "How helpful was the feedback tool for improving the summary?" (HITL modes only)
6. ✅ `open_feedback` (textarea, 200 char max) - **KEEP** - "Any concerns or observations about this task?" (Optional)

**Rationale:**
- Fields 1-2 (completeness, accuracy) replace ambiguous "confidence" → **Essential for RQ3** (quality moderation)
- Field 4 (perceived control) → **Critical for RQ1** (trust via control)
- Field 5 (feature usefulness) → **Critical for RQ2** (HITL mode comparison)
- Fields 4-5 conditional on HITL modes (not applicable to baseline)

**Time impact:**
- Baseline: 4 fields × 30s = **2 minutes** (within 4-min budget ✅)
- HITL modes: 6 fields × 30s = **3 minutes** (within 4-min budget ✅)

---

### Implementation Roadmap

#### Phase 1: Questionnaire Update ⚡ **IMMEDIATE**
**File:** `src/frontend/src/data/checkpointDefinitions.ts`

**Changes required:**
```typescript
// Update seed-questionnaire field_schema:
{
  id: "seed-questionnaire",
  control_type: "questionnaire",
  label: "Post-Generation Questionnaire",
  description: "Captures summary quality, control, and feature feedback.",
  field_schema: [
    { key: "completeness", type: "select", label: "How complete was this summary?", required: true, options: [...] },
    { key: "accuracy", type: "select", label: "How accurate was this summary based on the retrieved documents?", required: true, options: [...] },
    { key: "citation_helpfulness", type: "radio", label: "Were the source citations helpful for verifying the summary?", required: true, options: [...] },
    { key: "perceived_control", type: "select", label: "How much control did you have over the final summary?", required: true, options: [...] },
    { key: "feature_usefulness", type: "select", label: "How helpful was the feedback tool for improving the summary?", required: true, options: [...] },
    { key: "open_feedback", type: "textarea", label: "Any concerns or observations about this task? (Optional)", required: false, maxLength: 200, placeholder: "Anything unclear or missing? Any issues with the tools?" }
  ],
  // ... rest of definition
}
```

**Implementation notes:**
- If conditional fields not supported, show all 6 fields to all modes
- Label for field 5 (`feature_usefulness`) can vary by mode:
  - `hitl_r`: "...the **chunk selector**..."
  - `hitl_g`: "...the **summary editor**..."
  - `hitl_full`: "...the **chunk selector and summary editor**..."
- If dynamic labels not supported, use generic "...the feedback tool(s)..."

**Testing:**
- [ ] Questionnaire displays correctly in baseline mode (4 visible fields)
- [ ] Questionnaire displays correctly in HITL modes (6 visible fields)
- [ ] Responses saved correctly to database
- [ ] Character limit enforced on `open_feedback` (200 chars)

---

#### Phase 2: Ticker Assignment Update 📋 **BEFORE PILOT**
**Files:**
- `src/backend/app/services/study_setup.py` (remove JPM, add AMZN query)
- `src/frontend/src/data/checkpointDefinitions.ts` (update QUERIES and TICKERS)

**Changes required:**
```python
# Update study_setup.py
TICKERS = ["AAPL", "AMZN", "MSFT", "PFE", "TSLA", "WMT", "XOM"]  # Removed: JPM, BA

QUERIES = {
    "AAPL": "Identify and summarize the supply chain and geopolitical risks facing Apple's hardware operations.",
    "AMZN": "What are Amazon's key operational and competitive risks in e-commerce and cloud services?",  # NEW
    "MSFT": "What are the key technology and cybersecurity risks that could impact Microsoft's cloud business?",
    "PFE": "What are the key regulatory approval and patent expiration risks affecting Pfizer's drug pipeline?",
    "TSLA": "What regulatory and safety risks does Tesla face related to its autonomous driving technology?",
    "WMT": "Identify the competitive and supply chain risks facing Walmart's retail and e-commerce business.",
    "XOM": "What environmental and regulatory compliance risks does ExxonMobil disclose related to climate policy?"
}

# Add quality tier assignment logic
def get_ticker_sequence(participant_id: str) -> list[str]:
    """Assign 3 tickers with quality tier stratification."""
    participant_num = parse_participant_index(participant_id)

    # Tier 1 (90%+): WMT, AMZN, BA
    # Tier 2 (80-89%): AAPL, MSFT
    # Tier 3 (75-79%): PFE, TSLA, XOM

    # Tutorial always uses WMT (Tier 1, 100% quality)
    # Phase assignments ensure:
    # - Phase 1 (Baseline): Tier 1 or 2 (high quality anchor)
    # - Phase 2-3: Mix of tiers

    # Example stratified assignment (expand based on participant_num)
    tier1 = ["WMT", "AMZN"]  # Removed BA (pending verification)
    tier2 = ["AAPL", "MSFT"]
    tier3 = ["PFE", "TSLA", "XOM"]

    # Assign based on participant number (see USER_STUDY_DESIGN.md Section 3)
    # ... (implement full stratification logic)
```

**Testing:**
- [ ] Each participant gets 3 unique tickers
- [ ] Tutorial always uses WMT
- [ ] Phase 1 always uses Tier 1-2 ticker
- [ ] Ticker distribution balanced across participants

---

#### Phase 3: Quality Gate Configuration Update 🛠️ **BEFORE BATCH INGESTION**
**File:** `scripts/tree_quality_gate.py`

**Changes required:**
```python
# Update default parameters based on standardized testing results
DEFAULT_CONFIG = {
    "top_k": 10,                           # Increased from 5
    "pass_rate_threshold": 0.80,           # Lowered from 0.85
    "min_item1a_children": 3,              # Keep
    "max_missing_physical_ratio": 0.15,    # Increased from 0.05
    "max_consecutive_missing_physical": 5, # Increased from 3
    "max_page_index_gap": 11               # Increased from 5
}
```

**Rationale:** Based on STANDARDIZED_QUALITY_GATE_RESULTS.md findings, these thresholds balance quality detection with PageIndex's normal behavior (page gaps, missing physical indices).

---

#### Phase 4: Pilot Study 🧪 **BEFORE MAIN STUDY**
**Participants:** N=2-4 (1-2 per group)
**Goal:** Test full study flow, timing, and questionnaire

**Checklist:**
- [ ] Questionnaire fields display correctly
- [ ] Conditional logic works (perceived_control/feature_usefulness only in HITL)
- [ ] Timing accurate (75-90 min total)
- [ ] Tutorial effective (participants understand all checkpoints)
- [ ] Data collection complete (all fields saved)
- [ ] No technical issues

**Adjustments after pilot:**
- [ ] Questionnaire wording refined if confusing
- [ ] Timing adjusted if over/under budget
- [ ] Tutorial extended if participants struggle

---

#### Phase 5: Main Study Launch 🚀 **READY WHEN PILOT PASSES**
**Participants:** N=16 (target)
**Duration:** ~2-3 weeks (8 participants/week)

---

### Next Steps (Prioritized)

1. ⚡ **IMMEDIATE:** Update questionnaire field schema in `checkpointDefinitions.ts`
   - **Owner:** Frontend developer
   - **Time:** 30-60 minutes
   - **Blocker:** No - can proceed immediately

2. 📋 **THIS WEEK:** Update ticker assignments and queries
   - **Owner:** Backend developer
   - **Time:** 1-2 hours
   - **Dependency:** Questionnaire update complete

3. 🛠️ **THIS WEEK:** Update quality gate default configuration
   - **Owner:** Backend developer
   - **Time:** 30 minutes
   - **Dependency:** None

4. 🧪 **NEXT WEEK:** Conduct pilot study (N=2-4)
   - **Owner:** Researcher
   - **Time:** 3-4 hours (setup + sessions)
   - **Dependency:** Steps 1-3 complete

5. 🚀 **WEEK AFTER PILOT:** Launch main study (N=16)
   - **Owner:** Researcher
   - **Time:** 2-3 weeks
   - **Dependency:** Pilot successful

---

**Version:** 2.0 (Final)
**Date:** 2026-02-22
**Status:** ✅ **Ready for implementation**
**Checkpoint review:** ✅ **Complete** (3 checkpoints approved, questionnaire expansion specified)
