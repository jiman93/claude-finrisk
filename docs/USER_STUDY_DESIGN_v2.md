# User Study Design v2: Revised Qualitative Comparative Evaluation

**Project:** Enhancing Trust in AI-Generated Financial Risk Summaries through Human-in-the-Loop Feedback
**Duration:** 30-40 minutes per participant
**Modality:** Online via Microsoft Teams
**Date:** 2026-03-28
**Supersedes:** USER_STUDY_DESIGN.md (v1, 2026-02-22)
**Approved by:** Dr. Epaminondas Kapetanios (supervisor)

---

## Change Summary: v1 vs v2

| Dimension | v1 (Original) | v2 (Revised) | Rationale |
|---|---|---|---|
| **Design type** | Within-subjects, mixed-methods confirmatory | Small-scale qualitative comparative | Proportionate to achievable sample |
| **Participants** | 16-24 (min 12), finance professionals | 5-8, professionals + advanced learners | Recruitment constraints |
| **Groups** | 2 groups (A/B), 8 each | No fixed groups, alternated order | Counterbalancing simplified |
| **Modes tested** | 4 (Baseline, HITL-R, HITL-G, HITL-Full) | 2 (Baseline, HITL-Full) | Clearest contrast, reduces session length |
| **Phases per session** | 3 (progressive exposure) | 2 (direct comparison) | Shorter session, lower participant burden |
| **Session duration** | 75-90 minutes | 30-40 minutes | More achievable recruitment |
| **Counterbalancing** | Latin-square across tickers and modes | Alternated condition order | Simpler, sufficient for qualitative |
| **Quantitative analysis** | Repeated-measures ANOVA | Descriptive statistics only | Sample too small for inferential tests |
| **Qualitative analysis** | Supplementary thematic analysis | Primary thematic analysis | Becomes main interpretive method |
| **Compensation** | RM150 (GBP 25 equivalent) | TBD | Adjusted to recruitment strategy |
| **Tickers per participant** | 3 (one per phase) | 2 (one per mode) | Matches 2-phase design |
| **Tutorial ticker** | WMT (dedicated phase) | WMT (brief walkthrough) | Shortened |
| **Research questions** | RQ1-RQ4 (confirmatory) | Narrowed RQ1-RQ3 (exploratory) | Aligned with what 5-8 participants can answer |
| **Expert evaluation** | Not planned | Optional secondary complement (2-3 experts) | Strengthens discussion |
| **Retrieval evaluation** | Not explicit | Quantitative companion piece | Objective system-side evidence |

---

## 1. Study Overview

### Research Questions (Revised)

The revised study addresses a narrower, exploratory version of the original research questions:

1. **RQ1:** Does the presence of HITL controls change participants' perceived trust in AI-generated financial risk summaries?
2. **RQ2:** Does HITL oversight change participants' perceived control over the summarisation process?
3. **RQ3:** How do participants perceive the usefulness and quality of AI-generated summaries with and without HITL intervention?

**Removed from v1:**
- ~~RQ2 (v1): Does retrieval-level feedback vs generation-level feedback differ in perceived control and trust?~~ - Requires HITL-R vs HITL-G comparison, not included in 2-mode design
- ~~RQ4 (v1): What is the minimum acceptable retrieval quality for professional use?~~ - Requires larger sample and quality-tier manipulation

### Study Design

- **Within-subjects:** Each participant completes both Baseline and HITL-Full
- **2 conditions:** Baseline (no oversight) vs HITL-Full (maximum oversight)
- **Qualitative primary:** Thematic analysis of comments, interviews, and observations
- **Quantitative secondary:** Descriptive statistics from shortened Likert questionnaire

---

## 2. Participants

### Inclusion Criteria (Unchanged from Ethics Approval)

- Aged 18 or over
- **Professional analysts:** 2+ years relevant experience, OR
- **Advanced learners:** MSc/MBA students, CFA Level 2/3, or final-year finance undergraduates with relevant training

### Sample Size

- **Target:** 5-8 participants
- **Minimum viable:** 4 participants
- **No statistical power calculation** - qualitative design does not require it

### Recruitment Strategy (Revised)

| Channel | Priority | Notes |
|---|---|---|
| Direct outreach (personal network) | High | Most reliable conversion |
| UoB finance/MBA student groups | High | Accessible, meets advanced learner criteria |
| LinkedIn posts + DMs | Medium | Broader reach, lower conversion |
| Alumni networks | Medium | Professional contacts |
| Lecturer referrals | Low | Ask finance faculty to share with students |

### Participant Background Recording

Since the pool may include both professionals and students, background will be recorded and reported as contextual information:
- Current role/study programme
- Years of finance/risk experience
- Familiarity with SEC filings
- Prior AI tool experience

---

## 3. Ticker Assignment (Revised)

### Simplified Assignment

With 2 tasks per participant (Baseline + HITL-Full), each participant gets 2 tickers:

**Assignment principles (unchanged):**
1. Anchor with quality - use Tier 1/2 tickers for both tasks
2. Different ticker per task - no repetition within session
3. Sector diversity where possible

**Recommended assignments:**

| Participant | Task 1 (Condition A) | Task 2 (Condition B) | Order |
|---|---|---|---|
| P01 | AMZN (Baseline) | AAPL (HITL-Full) | Baseline first |
| P02 | AAPL (HITL-Full) | MSFT (Baseline) | HITL-Full first |
| P03 | MSFT (Baseline) | AMZN (HITL-Full) | Baseline first |
| P04 | AMZN (HITL-Full) | AAPL (Baseline) | HITL-Full first |
| P05 | AAPL (Baseline) | MSFT (HITL-Full) | Baseline first |
| P06 | MSFT (HITL-Full) | AMZN (Baseline) | HITL-Full first |
| P07 | AMZN (Baseline) | MSFT (HITL-Full) | Baseline first |
| P08 | AAPL (HITL-Full) | AMZN (Baseline) | HITL-Full first |

**Notes:**
- Condition order alternated across participants to reduce simple ordering effects
- WMT reserved for tutorial (not used in measured tasks)
- Tier 3 tickers (TSLA, PFE, XOM) excluded from main tasks to avoid quality confounds

### Standardized Queries (Unchanged)

| Ticker | Query |
|---|---|
| AAPL | Identify and summarize the supply chain and geopolitical risks facing Apple's hardware operations. |
| AMZN | What are Amazon's key operational and competitive risks in e-commerce and cloud services? |
| MSFT | What are the key technology and cybersecurity risks that could impact Microsoft's cloud business? |
| WMT | Identify the competitive and supply chain risks facing Walmart's retail and e-commerce business. |

---

## 4. Study Structure & Timing

### Total Session Duration: 30-40 minutes

```
+---------------------------------------------------------+
| STUDY TIMELINE (v2)                                      |
+---------------------------------------------------------+
| 1. Introduction & Consent       |  3 minutes             |
| 2. Tutorial (WMT)              |  5 minutes             |
| 3. Task 1: Condition A         | 10 minutes             |
| 4. Task 2: Condition B         | 10 minutes             |
| 5. Post-Study Reflection       |  5 minutes             |
| 6. Brief Closing Interview     |  5-10 minutes          |
| 7. Debrief                     |  2 minutes             |
+---------------------------------------------------------+
| TOTAL                          | 30-40 minutes          |
+---------------------------------------------------------+
```

### Comparison with v1

```
v1: Intro(5) + Tutorial(10) + Phase1(15) + Phase2(20) + Phase3(20) + PostStudy(8) + Interview(10) = 75-90 min
v2: Intro(3) + Tutorial(5)  + Task1(10)  + Task2(10)  + Reflection(5) + Interview(10) = 30-40 min
```

### Detailed Timing Breakdown

#### 1. Introduction & Consent (3 min)
- Welcome and study overview (1 min)
- Consent form review and signing (1 min)
- Recording permission and start (1 min)

#### 2. Tutorial (5 min)
- **Ticker:** WMT (Tier 1, 100% quality)
- **Mode:** HITL-Full (show all features)
- **Query:** "Identify the competitive and supply chain risks facing Walmart's retail and e-commerce business."
- **Activities:**
  - Brief interface walkthrough (2 min)
  - Demo query + retrieval + chunk selector (1.5 min)
  - Demo generation + summary editor (1.5 min)
- **No data collection** - practice only

#### 3. Task 1: Condition A (10 min)
- **Mode:** Baseline or HITL-Full (per assignment)
- **Ticker:** Assigned from Tier 1-2
- **Activities:**
  - Query submission + AI processing (2 min)
  - [If HITL-Full] Chunk selector (3 min)
  - [If HITL-Full] Summary editor (3 min)
  - Review final summary (2 min)
  - Post-task questionnaire (2 min)

#### 4. Task 2: Condition B (10 min)
- **Mode:** The other mode (Baseline or HITL-Full)
- **Ticker:** Different ticker from Tier 1-2
- **Activities:** Same structure as Task 1

#### 5. Post-Study Reflection (5 min)
- Mode preference (Baseline vs HITL-Full)
- Overall trust comparison
- Open-ended written feedback

#### 6. Brief Closing Interview (5-10 min)
- **Format:** Semi-structured, conversational
- **Topics:**
  - Which mode felt more trustworthy and why?
  - How did the chunk selector affect confidence?
  - How did the summary editor affect confidence?
  - Would you use this system in a real work context?
  - What would you change?

#### 7. Debrief (2 min)
- Thank participant
- Compensation process
- Contact for follow-up questions
- Recording stops

---

## 5. HITL Checkpoints (Unchanged from v1)

The 3 checkpoint types remain identical to v1. Only 2 are active per session:

| Checkpoint | v1 Usage | v2 Usage |
|---|---|---|
| **Chunk Selector** (`seed-chunk-selector`) | HITL-R, HITL-Full phases | HITL-Full task only |
| **Summary Editor** (`seed-summary-editor`) | HITL-G, HITL-Full phases | HITL-Full task only |
| **Post-Generation Questionnaire** (`seed-questionnaire`) | All phases (3 times) | Both tasks (2 times) |

### Questionnaire Schema

The 6-field questionnaire from v1 is retained in shortened form:

| Field | Type | Modes | RQ Link |
|---|---|---|---|
| **Completeness** | 5-point Likert | All | RQ3 |
| **Accuracy** | 5-point Likert | All | RQ3 |
| **Citation Helpfulness** | Yes/Partly/No | All | RQ1 |
| **Perceived Control** | 5-point Likert | All (expect low for Baseline) | RQ2 |
| **Feature Usefulness** | 5-point Likert | HITL-Full only | RQ1 |
| **Open Feedback** | Textarea (optional) | All | Qualitative |

**Change from v1:** Perceived control is now shown in all modes (including Baseline) to enable direct within-subjects comparison. Baseline responses are expected to cluster at 1-2.

---

## 6. Data Collection

### Per Task (Automatic - from system)

| Category | Fields | Notes |
|---|---|---|
| **Timing** | started_at, completed_at, time_on_task_seconds | Same as v1 |
| **Retrieval** | retrieved_nodes, traversal_path, retrieval_mode | Same as v1 |
| **Selection** (HITL-Full) | selected_node_ids, rejected_node_ids | Same as v1 |
| **Generation** | generated_summary | Same as v1 |
| **Editing** (HITL-Full) | edited_summary, characters_edited, flagged_spans | Same as v1 |
| **Self-report** | Questionnaire responses (6 fields) | Shortened from v1 |

### Post-Study (New in v2)

| Data | Method | Purpose |
|---|---|---|
| Mode preference | Direct comparison question | Which mode preferred and why |
| Trust comparison | Open-ended | Qualitative trust perceptions |
| Interview transcript | Semi-structured (recorded) | Primary qualitative data source |
| Think-aloud notes | Researcher observation | Supplementary behavioural data |

### What v2 Does NOT Collect (Compared to v1)

- ~~Per-ticker quality perceptions across 3+ tickers~~ - only 2 tickers per participant
- ~~Deployment readiness rating~~ - removed to shorten session
- ~~Demographics questionnaire~~ - replaced by brief background recording at start
- ~~HITL-R vs HITL-G comparison data~~ - only testing Baseline vs HITL-Full

---

## 7. Data Analysis

### v1 Approach (Original)
- Primary: Repeated-measures ANOVA across 4 modes
- Secondary: Thematic analysis of interviews
- Statistical: Inferential hypothesis testing with 48+ observations

### v2 Approach (Revised)

#### Quantitative (Descriptive Only)
- Medians, means, and response distributions for Likert items
- Per-mode comparison tables (Baseline vs HITL-Full)
- No inferential tests (sample too small)
- Presented as supporting context, not primary evidence

#### Qualitative (Primary)
- **Thematic analysis** of:
  - Interview transcripts
  - Open-ended questionnaire responses
  - Think-aloud observations
  - Session recordings (with permission)
- **Themes to identify:**
  - Trust in generated summaries
  - Feelings of control and accountability
  - Confidence in retrieved evidence
  - Perceived usefulness of intervention features
  - Usability or cognitive burden
  - Preferences between modes

#### Complementary System Evaluation
- Quantitative retrieval evaluation independent of participant sessions
- Uses existing quality-audited ticker indexes and eval scripts
- Contextualises user perceptions against objective retrieval performance
- Distinguishes interface-level trust effects from underlying retrieval quality

---

## 8. Limitations (v2-Specific)

| Limitation | Impact | Mitigation |
|---|---|---|
| Small sample (5-8) | No inferential claims, limited generalisability | Depth over breadth; thematic analysis appropriate for this scale |
| Only 2 modes tested | Cannot compare HITL-R vs HITL-G independently | Baseline vs HITL-Full gives strongest contrast; other modes remain implemented for future work |
| Mixed participant pool | Professionals and students may differ | Background recorded and reported; findings contextualised accordingly |
| No Latin-square counterbalancing | Possible ordering effects | Condition order alternated across participants |
| Shorter sessions | Less time for deep engagement | Sufficient for 2 tasks + reflection; reduces fatigue |
| No RQ4 (minimum quality threshold) | Cannot determine quality floor | Addressed partly by complementary retrieval evaluation |

---

## 9. Ethical Considerations

Ethical approval has already been obtained for the original study design. The revised evaluation remains within the same scope:
- Participants interact with the same FinRisk prototype
- Same consent procedures and recording permissions
- Same data handling and anonymisation approach
- Reduced participant burden (shorter sessions)
- No additional risk beyond the original approval

---

## 10. Implementation Changes Required

### System Changes

The FinRisk system already supports all 4 HITL modes. For v2:

| Component | Change Needed | Effort |
|---|---|---|
| Backend | None - all endpoints already support 2-mode sessions | None |
| Frontend | None - StudyChatGate already handles any mode combination | None |
| Study assignments | Generate new assignments for P01-P08 with 2 phases instead of 3 | Low |
| Questionnaire | Already updated to 6-field schema (v1 recommendation) | Done |
| Admin panel | No changes - StudyMonitor and StudyControlPanel work as-is | None |

### Assignment Service Update

The `assignment_service.py` currently generates 3-phase assignments for P01-P16. For v2:
- Generate 2-phase assignments for P01-P08
- Phase 1: Baseline or HITL-Full (alternated)
- Phase 2: The other mode
- Tickers: AAPL, AMZN, MSFT (Tier 1-2 only)
- WMT reserved for tutorial

---

## Appendix: Pivot Justification (For Dissertation)

> Owing to recruitment constraints and the time-bounded nature of the project, the evaluation was refocused from a fully counterbalanced within-subjects study to a smaller-scale qualitative comparative study. This revised design preserved the core aim of examining how human-in-the-loop controls influence trust, perceived control, and perceived usefulness, while adopting a methodology proportionate to the achievable sample size.

> Rather than testing all four implemented modes under a fully counterbalanced design, the revised study focuses on a smaller number of conditions and prioritises depth of observation over statistical generalisation. This allows the study to retain a direct user-based evaluation of the FinRisk system while producing findings that are realistic, credible, and methodologically defensible within the constraints of the project.
