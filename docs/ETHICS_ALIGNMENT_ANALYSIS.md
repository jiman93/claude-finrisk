# Ethics Alignment Analysis: Study Design vs Approved Instruments

**Date:** 2026-02-22
**Study:** Enhancing Trust in AI-Generated Financial Risk Summaries through Human-in-the-Loop Feedback

---

## Executive Summary

⚠️ **CRITICAL MISMATCH IDENTIFIED**

The proposed study design ([USER_STUDY_DESIGN.md](USER_STUDY_DESIGN.md)) recommends a **6-field per-task questionnaire** that **differs significantly** from the ethics-approved **3-question post-task ratings**.

**Status:** ❌ **NOT ALIGNED** - Ethics amendment OR design revision required

---

## Detailed Comparison

### 1. Per-Task Questionnaire (After Each Phase)

#### Ethics-Approved (Survey 2: Post-task ratings)
**Source:** `Survey_Instruments_v4.docx`
**Timing:** ~2 minutes per task
**Scale:** 7-point Likert (1 = strongly disagree, 7 = strongly agree)

**Questions (3 total):**
1. "The summary accurately reflects the company's risk factors."
2. "The summary contains no factual errors."
3. "I trust this summary for investment decisions."

---

#### Proposed Design (seed-questionnaire)
**Source:** `USER_STUDY_DESIGN.md` Section 6
**Timing:** 2-3 minutes per task
**Scale:** Mixed (5-point Likert + radio + textarea)

**Questions (6 total):**
1. **Completeness** (1-5): "How complete was this summary?"
2. **Accuracy** (1-5): "How accurate was this summary based on the retrieved documents?"
3. **Citation Helpfulness** (Yes/Partly/No): "Were the source citations helpful for verifying the summary?"
4. **Perceived Control** (1-5): "How much control did you have over the final summary?" *(HITL only)*
5. **Feature Usefulness** (1-5): "How helpful was the feedback tool for improving the summary?" *(HITL only)*
6. **Open Feedback** (textarea, 200 char): "Any concerns or observations about this task?" *(Optional)*

---

### Key Differences

| Aspect | Ethics-Approved | Proposed Design | Aligned? |
|--------|----------------|-----------------|----------|
| **Number of questions** | 3 | 6 (4 for baseline) | ❌ NO |
| **Scale type** | 7-point Likert | 5-point Likert + radio | ❌ NO |
| **Completeness measure** | ❌ Not measured | ✅ Question 1 | ❌ NO |
| **Accuracy measure** | ✅ Questions 1-2 | ✅ Question 2 | ⚠️ PARTIAL |
| **Trust measure** | ✅ Question 3 | ❌ Not in per-task | ⚠️ PARTIAL |
| **Perceived control** | ❌ Not measured | ✅ Question 4 | ❌ NO |
| **Feature usefulness** | ❌ Not measured | ✅ Question 5 | ❌ NO |
| **Citation helpfulness** | ❌ Not measured | ✅ Question 3 | ❌ NO |
| **Open feedback** | ❌ Not included | ✅ Question 6 | ❌ NO |
| **Timing** | 2 min per task | 2-3 min per task | ✅ YES |

---

### 2. Post-Session Surveys

#### Ethics-Approved
**Source:** `Survey_Instruments_v4.docx`

1. **Survey 3: System Usability Scale (SUS)**
   - Standard 10-item SUS instrument
   - Scale: 1-5 Likert
   - Time: ~3 minutes

2. **Survey 4: NASA-TLX**
   - Standard 6 dimensions (mental demand, physical demand, temporal demand, performance, effort, frustration)
   - Scale: 0-100
   - Time: ~3 minutes

3. **Survey 5: Trust questionnaire**
   - 8-item trust questionnaire
   - Scale: 1-7 Likert
   - Time: ~6 minutes

**Total post-session time:** ~12 minutes

---

#### Proposed Design
**Source:** `USER_STUDY_DESIGN.md` Section 4.6

**Post-Study Questionnaire (8 minutes):**
- Not explicitly defined in study design
- Assumed to include system-level questions

**Comparison:**
- Ethics-approved: SUS + NASA-TLX + 8-item Trust = **3 separate surveys**
- Proposed design: 1 consolidated post-study questionnaire

**Alignment:** ⚠️ **UNCLEAR** - Proposed design doesn't specify post-session survey content

---

### 3. Semi-Structured Interview

#### Ethics-Approved
**Source:** `Interview_questions_guide_v4.docx`
**Timing:** 10-15 minutes (end of session)
**Format:** Audio recording only

**Core Questions (5 total):**
1. Which phase/mode did you prefer overall, and why?
2. How did your trust in the system change across Baseline, Phase 2, and HITL-Full?
3. How useful was section-level control (selection/reordering) when available?
4. How useful was summary editing/hallucination flagging when available?
5. What improvements would you suggest for practical adoption?

---

#### Proposed Design
**Source:** `USER_STUDY_DESIGN.md` Section 4.7
**Timing:** 5-10 minutes (optional)
**Format:** Not specified

**Alignment:** ⚠️ **PARTIAL**
- Ethics-approved: 10-15 minutes, 5 core questions
- Proposed: 5-10 minutes, optional, questions not specified
- **Issue:** Ethics-approved timing is LONGER than proposed (10-15 vs 5-10 min)

---

## Total Time Comparison

### Ethics-Approved Instruments
```
Demographics (pre-task):          5 min
Post-task ratings (3 tasks):      6 min (2 min × 3)
SUS (post-session):               3 min
NASA-TLX (post-session):          3 min
Trust questionnaire (post-session): 6 min
Interview (optional):             10-15 min
─────────────────────────────────────────
Questionnaires total:             23 min
With interview:                   33-38 min
Within 75-90 min session:         ✅ YES
```

---

### Proposed Design
```
Post-task questionnaire (3 tasks): 6-9 min (2-3 min × 3)
Post-study questionnaire:          8 min
Interview (optional):              5-10 min
─────────────────────────────────────────
Questionnaires total:              14-17 min
With interview:                    19-27 min
Within 75-90 min session:          ✅ YES (MORE BUFFER than ethics)
```

**Time alignment:** ✅ **YES** - Proposed design uses LESS questionnaire time than ethics-approved (14-17 min vs 23 min)

---

## Research Question Coverage Analysis

### RQ1: How does HITL feedback affect trust?
**Measurement needs:**
- Trust in AI-generated summaries
- Perceived control over process

**Ethics-approved coverage:**
- ✅ Trust: "I trust this summary for investment decisions" (per-task)
- ✅ Trust: 8-item trust questionnaire (post-session)
- ❌ Perceived control: **NOT MEASURED**

**Proposed design coverage:**
- ❌ Trust: Not in per-task questionnaire
- ⚠️ Trust: Assumed in post-study questionnaire (not detailed)
- ✅ Perceived control: Question 4 (per-task, HITL only)

**Gap:** Neither approach measures BOTH trust AND perceived control per-task

---

### RQ2: Does HITL-R vs HITL-G differ in perceived control and trust?
**Measurement needs:**
- Feature-specific usefulness (chunk selector vs summary editor)
- Comparative trust across modes

**Ethics-approved coverage:**
- ✅ Mode comparison: Interview questions 3-4 (qualitative)
- ❌ Feature usefulness: **NOT MEASURED** quantitatively

**Proposed design coverage:**
- ✅ Feature usefulness: Question 5 (per-task, quantitative)
- ✅ Mode comparison: Same as ethics-approved

**Gap:** Ethics-approved lacks quantitative feature usefulness measure (critical for RQ2)

---

### RQ3: How does document quality moderate HITL effectiveness?
**Measurement needs:**
- Summary completeness (detects retrieval failures)
- Summary accuracy (detects generation errors)

**Ethics-approved coverage:**
- ⚠️ Completeness: Partially measured by "accurately reflects risk factors" (conflates completeness + accuracy)
- ✅ Accuracy: "The summary contains no factual errors"

**Proposed design coverage:**
- ✅ Completeness: Question 1 (explicit)
- ✅ Accuracy: Question 2 (explicit)

**Gap:** Ethics-approved conflates completeness and accuracy into single question

---

### RQ4: What is minimum acceptable retrieval quality?
**Measurement needs:**
- Per-ticker quality assessment
- Acceptability threshold identification

**Ethics-approved coverage:**
- ⚠️ Indirect: Overall trust ratings per task
- ❌ No explicit quality threshold question

**Proposed design coverage:**
- ⚠️ Same as ethics-approved (indirect via completeness + accuracy)
- ❌ No explicit quality threshold question

**Gap:** Both approaches lack explicit acceptability question

---

## Critical Gaps Summary

### Ethics-Approved Instruments MISSING:
1. ❌ **Perceived control** (per-task) - **CRITICAL for RQ1**
2. ❌ **Feature usefulness** (per-task, quantitative) - **CRITICAL for RQ2**
3. ❌ **Completeness measure** (separate from accuracy) - **Important for RQ3**
4. ❌ **Citation helpfulness** - Important for trust mechanisms

### Proposed Design MISSING:
1. ❌ **Trust measure** (per-task) - **CRITICAL for RQ1**
2. ❌ **SUS, NASA-TLX, 8-item trust** (post-session) - Standard validated instruments
3. ⚠️ **Interview questions not specified** - Alignment unclear

---

## Recommendations

### Option 1: Use Ethics-Approved Instruments (NO CHANGES)
**Action:** Revise `USER_STUDY_DESIGN.md` and `checkpointDefinitions.ts` to match ethics submission

**Changes required:**
```typescript
// Update seed-questionnaire field_schema to match Survey 2
field_schema: [
  {
    key: "q1_accuracy_reflects",
    type: "select",
    label: "The summary accurately reflects the company's risk factors.",
    required: true,
    options: [
      { value: "1", label: "1 - Strongly disagree" },
      { value: "2", label: "2 - Disagree" },
      { value: "3", label: "3 - Somewhat disagree" },
      { value: "4", label: "4 - Neither agree nor disagree" },
      { value: "5", label: "5 - Somewhat agree" },
      { value: "6", label: "6 - Agree" },
      { value: "7", label: "7 - Strongly agree" }
    ]
  },
  {
    key: "q2_no_errors",
    type: "select",
    label: "The summary contains no factual errors.",
    required: true,
    options: [/* same 7-point scale */]
  },
  {
    key: "q3_trust_decision",
    type: "select",
    label: "I trust this summary for investment decisions.",
    required: true,
    options: [/* same 7-point scale */]
  }
]
```

**Add post-session surveys:**
- Implement SUS (10 items)
- Implement NASA-TLX (6 dimensions)
- Implement 8-item trust questionnaire

**Pros:**
- ✅ No ethics amendment needed
- ✅ Uses validated instruments (SUS, NASA-TLX)
- ✅ Ethics-approved, no delay

**Cons:**
- ❌ Missing perceived control (RQ1 incomplete)
- ❌ Missing feature usefulness (RQ2 incomplete)
- ❌ Missing completeness (RQ3 weaker)
- ❌ No citation helpfulness measure

**Mitigation:**
- Interview questions 3-4 capture perceived control and feature usefulness **qualitatively**
- Post-session trust questionnaire may include control items
- Can still answer RQs, but with weaker quantitative evidence

---

### Option 2: Amend Ethics Submission (RECOMMENDED)
**Action:** Submit ethics amendment to use enhanced questionnaire

**Amendment request:**
```
Change to Survey 2: Post-task ratings

FROM (3 questions, 7-point Likert):
1. The summary accurately reflects the company's risk factors.
2. The summary contains no factual errors.
3. I trust this summary for investment decisions.

TO (6 questions, mixed scales):
1. How complete was this summary? (1-5 Likert)
2. How accurate was this summary based on the retrieved documents? (1-5 Likert)
3. Were the source citations helpful for verifying the summary? (Yes/Partly/No)
4. [HITL only] How much control did you have over the final summary? (1-5 Likert)
5. [HITL only] How helpful was the feedback tool for improving the summary? (1-5 Likert)
6. [Optional] Any concerns or observations about this task? (Open text, 200 char)

RATIONALE:
- Questions 1-2 separate completeness (retrieval quality) from accuracy (generation quality) for RQ3 analysis
- Question 3 measures citation helpfulness (trust mechanism)
- Question 4 measures perceived control (critical for RQ1)
- Question 5 measures feature usefulness quantitatively (critical for RQ2)
- Question 6 captures unexpected issues
- Timing: 2-3 min per task (same as approved 2 min)
- Total questionnaire time: ~9 min (vs approved 6 min) - still within 75-90 min session
```

**Keep:**
- Survey 3: SUS (standard instrument)
- Survey 4: NASA-TLX (standard instrument)
- Survey 5: 8-item trust questionnaire (post-session trust measure)

**Pros:**
- ✅ Addresses ALL research questions quantitatively
- ✅ Per-task measures for perceived control and feature usefulness
- ✅ Still within 75-90 min session time
- ✅ Keeps validated instruments (SUS, NASA-TLX, trust)

**Cons:**
- ⚠️ Requires ethics amendment (1-2 weeks delay)
- ⚠️ Reviewer may question change from 7-point to 5-point scale

**Amendment timeline:**
- Submit amendment: 1 day
- Ethics review: 1-2 weeks
- Approval: +1 week if revisions needed

---

### Option 3: Hybrid Approach (COMPROMISE)
**Action:** Use ethics-approved per-task questions + add feature questions to post-session survey

**Per-task questionnaire (ethics-approved):**
- Keep 3 questions (accuracy, errors, trust) with 7-point Likert
- Time: 2 min per task

**Post-session survey (enhanced):**
- SUS (10 items) - ~3 min
- NASA-TLX (6 dimensions) - ~3 min
- 8-item trust questionnaire - ~6 min
- **ADD: Per-mode feature usefulness retrospective** - ~3 min
  - "How helpful was the chunk selector in Phase 2?" (1-7 Likert)
  - "How much control did you have in Phase 2?" (1-7 Likert)
  - "How helpful was the summary editor in Phase 3?" (1-7 Likert)
  - "How much control did you have in Phase 3?" (1-7 Likert)

**Total post-session time:** ~18 min (vs approved 12 min)
**Total session time:** Still within 75-90 min ✅

**Pros:**
- ✅ No ethics amendment needed
- ✅ Captures perceived control and feature usefulness
- ✅ Uses validated instruments

**Cons:**
- ⚠️ Retrospective measures (less accurate than per-task)
- ⚠️ Longer post-session survey (18 min vs 12 min)
- ⚠️ Participant fatigue at end of session

---

## Implementation Decision Matrix

| Criterion | Option 1 (Ethics as-is) | Option 2 (Amend) | Option 3 (Hybrid) |
|-----------|------------------------|------------------|-------------------|
| **No ethics delay** | ✅ YES | ❌ NO (1-2 weeks) | ✅ YES |
| **RQ1 coverage** | ⚠️ Qualitative only | ✅ Full quantitative | ✅ Retrospective quant |
| **RQ2 coverage** | ⚠️ Qualitative only | ✅ Per-task quant | ✅ Retrospective quant |
| **RQ3 coverage** | ⚠️ Conflated measure | ✅ Separate measures | ⚠️ Conflated measure |
| **Data quality** | ⚠️ Weaker | ✅ Strongest | ⚠️ Good |
| **Participant burden** | ✅ Lowest (23 min) | ⚠️ Medium (26 min) | ⚠️ Highest (30 min) |
| **Implementation ease** | ✅ Easiest | ⚠️ Moderate | ✅ Easy |

---

## Final Recommendation

### ✅ **Recommended: Option 2 (Ethics Amendment)**

**Rationale:**
1. Your research questions **require quantitative measures** of perceived control and feature usefulness
2. Without these measures, you cannot definitively answer RQ1 and RQ2
3. The amendment is **minor** (expanding Survey 2 from 3 to 6 questions)
4. Time increase is **minimal** (+3 min questionnaires = 26 min total, well within 75-90 min)
5. Ethics committees generally approve expansions that strengthen methodology

**Amendment submission:**
- Draft amendment letter explaining rationale
- Attach revised Survey_Instruments_v4.docx with updated Survey 2
- Submit to ethics committee
- Expected approval: 1-2 weeks

**If timeline is critical:**
- Use **Option 3 (Hybrid)** as fallback
- Proceed immediately with ethics-approved instruments
- Add retrospective feature questions to post-session survey
- Accept slightly weaker data quality (retrospective vs per-task)

---

## Answer to Your Specific Questions

### Q1: "Is this new plan aligned with ethics submission?"
**Answer:** ❌ **NO** - Significant misalignment in per-task questionnaire

**Details:**
- Ethics-approved: 3 questions, 7-point Likert
- Proposed: 6 questions, 5-point Likert + radio + textarea
- Missing from ethics: perceived control, feature usefulness, completeness, citation helpfulness
- Missing from proposed: explicit trust question per-task

---

### Q2: "Do I need separate forms later for these? Or everything already part of system?"

**Answer:** ⚠️ **DEPENDS on which option you choose**

**Option 1 (Ethics as-is):**
- ✅ **YES, need separate forms** for:
  - SUS (10 items) - Not currently in system
  - NASA-TLX (6 dimensions) - Not currently in system
  - 8-item trust questionnaire - Not currently in system
- These would be **post-session surveys** (separate from per-task checkpoints)
- **Implementation:** Can use Google Forms, Qualtrics, or add to your system

**Option 2 (Amend ethics):**
- ⚠️ **PARTIAL** - Still need separate forms for:
  - SUS (10 items) - Post-session
  - NASA-TLX (6 dimensions) - Post-session
  - 8-item trust questionnaire - Post-session
- But per-task questionnaire fully integrated in system ✅

**Option 3 (Hybrid):**
- ✅ **YES, need separate forms** (same as Option 1)
- Plus additional retrospective feature questions in post-session survey

**Current system status:**
- ✅ Per-task checkpoints: Integrated in system (`seed-questionnaire`)
- ❌ Post-session surveys: **NOT in system** - need separate implementation
- ❌ Demographics survey: **NOT in system** - need separate implementation

**Recommendation:**
- Implement SUS, NASA-TLX, and trust questionnaire as **separate Qualtrics/Google Forms survey**
- Send link at end of study session
- Easier than building into system (validated instruments with standard formatting)

---

## Next Steps (Prioritized)

### Immediate (This Week)
1. **Decide:** Option 1 (ethics as-is) vs Option 2 (amend) vs Option 3 (hybrid)
2. **If Option 2:** Draft ethics amendment and submit
3. **If Option 1 or 3:** Update `checkpointDefinitions.ts` to match ethics-approved Survey 2

### Before Pilot (1-2 Weeks)
4. **Create post-session survey** (Google Forms/Qualtrics) with:
   - SUS (10 items)
   - NASA-TLX (6 dimensions)
   - 8-item trust questionnaire
   - [If Option 3] Retrospective feature usefulness questions
5. **Create demographics survey** (pre-task, 5 min)

### Before Main Study
6. **Test all surveys** in pilot study (N=2-4)
7. **Verify timing** aligns with 75-90 min session
8. **Check data export** from both system and external surveys

---

**Status:** ⚠️ **BLOCKED** - Decision needed on ethics alignment before proceeding with implementation
