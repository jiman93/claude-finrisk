# FinRisk Next Steps Strategy Pack

This folder contains strategy artifacts to align the thesis user study before resuming coding.

## Artifacts
- `01-thesis-scope-and-rqs.md`
- `02-protocol-lock-and-rules.md`
- `03-measurement-and-analysis-plan.md`
- `04-data-contract-and-event-schema.md`
- `05-implementation-backlog.md`
- `06-pilot-runbook.md`
- `07-study-ready-checklist.md`
- `08-decision-log-template.md`
- `09-code-cleanup-plan.md`

## Recommended review order
1. Scope + RQs
2. Protocol lock
3. Measurement plan
4. Data contract
5. Implementation backlog
6. Pilot runbook
7. Readiness checklist

## Goal of this pack
Create a defensible, thesis-first study design with clear protocol, auditable data capture, and a minimal coding plan that prioritizes measurement integrity over feature expansion.


so how do i categorise entities, is this correct

1. user (query)
2. checkpoints
3. AI output

Close, but it’s too broad.

Use this instead:

Actors: user, assistant/system
Artifacts: query, retrieved chunks, chunk interpretations, summary draft, final summary
Checkpoints: selector, interpretation assist, edit/review, questionnaire/approval
Events: submitted, skipped, retried, timed out, advanced phase
State: task/phase/session status
So your 3 are valid at a high level, but for implementation and enterprise audit you should split into these 5 categories.


what success criteria gonna look like for finrisk thesis and for enterprise what SLA's system with similar architecture could offer

Thesis Success Criteria (FinRisk)
Use measurable targets tied to your RQs:

Quality uplift: HITL modes improve blinded summary quality score vs baseline (for example +15% mean score).
Error reduction: unsupported/hallucinated claims drop (for example -30% vs baseline).
Trust uplift: user confidence/trust rating improves (for example +0.7 on 1–5 scale).
Effort tradeoff: time-on-task increase stays bounded (for example <=20% longer than baseline).
Protocol integrity: required checkpoints completed/logged correctly (for example >=98% adherence).
Audit completeness: every key action has timestamp + actor + artifact link (target 100% for required events).
Statistical validity: predefine hypothesis tests/effect sizes (not just descriptive charts).
Enterprise SLAs a Similar Architecture Can Offer (realistic examples)
(These are typical targets, not guarantees)

Availability: 99.9% monthly API uptime.
Latency: p95
retrieval response: <=5s
generation response: <=12s
checkpoint submit/ack: <=1s
Workflow completion: >=99.5% successful run completion (excluding user cancellations).
Durability: audit events persisted with 99.99% write success, no silent drops.
State recovery: session resume after failure with RTO <=30 min, RPO <=5 min.
Data integrity: immutable audit trail for required checkpoints and approvals.
Incident response: Sev-1 acknowledgment <=15 min, status updates every 30 min.
If you want, I can turn this into a one-page KPI/SLA appendix format for your thesis and pitch deck.


is group A vs group B protocol still relevant? or there's better angle i could focus on

It’s still relevant, but only for a pilot thesis question.

Current Group A vs B is good for:

Showing HITL improves over baseline.
Comparing one intervention path at a time with limited participants.
It’s weaker for:

Choosing the best enterprise configuration.
Isolating HITL-R vs HITL-G cleanly (each participant only sees one in your current flow).
Better angle for enterprise-focused thesis:

Shift from “which group wins” to “which checkpoint policy gives best quality-per-time with strongest auditability.”
Measure: quality, time-on-task, intervention rate, override/escalation rate, audit completeness.
Practical recommendation:

Keep A/B as your Phase 1 validation.
Add a Phase 2 policy experiment (none vs retrieval-assist vs generation-review vs full/adaptive) for enterprise relevance.

i just wanna focus on the thesis user study for now

Good call. For thesis-only focus, keep it simple:

Keep Group A vs Group B as-is for now.
Use it to answer one core question:
Does HITL improve quality/trust vs baseline, and does R-first vs G-first change outcomes?
Lock the primary task flow: fixed query, retrieval, required checkpoint(s), summary, required questionnaire.
Disable free conversational follow-ups during measured runs (or log them separately as exploratory).
Define 3 primary outcomes only:
summary quality score
trust/confidence score
time-on-task
Predefine your hypothesis/tests before collecting data.
That gives you a clean, defensible thesis study without overcomplicating enterprise concerns yet.


list down the next steps before i resume coding again

Freeze thesis scope in one sentence: A/B protocol + 3 outcomes (quality, trust, time) and no new feature expansion.
Sync docs so they don’t conflict: update SCOPE.md and PRODUCT.md to match the new v2 section in SYSTEM_DESIGN_FRAMEWORK.md.
Finalize hypotheses and analysis plan now (before new code): primary metrics, scoring rubric, statistical test plan, exclusion rules.
Lock protocol rules: fixed query per phase, required checkpoints, required post-task questionnaire, no free conversational turns in measured runs (or separate logging lane).
Define the minimum event schema you must persist per task: retrieval set, selections, edits, checkpoint submissions, timestamps, questionnaire.
Turn gaps into coding tickets (small and concrete): backend-authoritative checkpoint progression, mandatory questionnaire persistence, call task/session complete endpoints from frontend.
Write a pilot runbook: facilitator script, participant instructions, stop criteria, and what to record if failures happen.
Prepare a 2–3 participant pilot first, then review whether logs/metrics are complete before full data collection.
Create a “study-ready” checklist you must pass before running participants (protocol integrity, logging completeness, UI stability).
Only then resume coding in priority order: data integrity first, workflow gating second, UI polish last.

create new folder in root called next-steps

generate strategy artifacts for my review

I’ll create a new next-steps folder at the project root and draft a full set of strategy artifacts for thesis execution (scope, protocol, metrics, backlog, pilot runbook, readiness checklist). I’ll generate them as Markdown files so you can review and iterate quickly.

Explored 1 list
I’m creating the folder and writing a set of focused strategy docs: scope/RQs, protocol rules, measurement plan, data contract, implementation backlog, pilot runbook, and a readiness checklist. After that I’ll share the file list for quick review.

Ran mkdir -p next-steps cat > next-steps/README.md <<'EOF' # FinRisk Next Steps Strategy Pack This folder contains strategy artifacts to align the thesis user study before resuming coding. ## Artifacts - `01-thesis-scope-and-rqs.md` - `02-protocol-lock-and-rules.md` - `03-measurement-and-analysis-plan.md` - `04-data-contract-and-event-schema.md` - `05-implementation-backlog.md` - `06-pilot-runbook.md` - `07-study-ready-checklist.md` - `08-decision-log-template.md` ## Recommended review order 1. Scope + RQs 2. Protocol lock 3. Measurement plan 4. Data contract 5. Implementation backlog 6. Pilot runbook 7. Readiness checklist ## Goal of this pack Create a defensible, thesis-first study design with clear protocol, auditable data capture, and a minimal coding plan that prioritizes measurement integrity over feature expansion. EOF cat > next-steps/01-thesis-scope-and-rqs.md <<'EOF' # 01 - Thesis Scope and Research Questions ## Scope freeze (single sentence) Evaluate whether HITL checkpoints in a financial-risk chat workflow improve output quality and user trust versus baseline automation, with acceptable time cost. ## In-scope - Controlled within-subjects protocol using assigned mode order. - Primary task runs with fixed ticker and fixed query per phase. - Four modes as currently modeled: `baseline`, `hitl_r`, `hitl_g`, `hitl_full`. - Post-task questionnaire per phase. - Audit and timing capture for core study actions. ## Out-of-scope - New enterprise product features beyond study needs. - Open-ended conversational exploration as part of primary outcomes. - Full production hardening (auth, RBAC, infra SLAs). ## Primary research questions (RQ) 1. RQ1 (Quality): Does HITL intervention improve factual quality/relevance vs baseline? 2. RQ2 (Trust): Do HITL modes improve user confidence/trust vs baseline? 3. RQ3 (Effort): What time/effort increase accompanies quality/trust gains? 4. RQ4 (Mode effects): How do retrieval-first vs generation-first intervention paths differ? ## Secondary questions (exploratory) - Which intervention point catches more unsupported claims? - Does explicit chunk curation change perceived citation usefulness? - Do users prefer one intervention pattern over another? ## Anchoring values to preserve - Trust - Human accountability - Auditability - Governance fit - Quality control - Measured impact EOF cat > next-steps/02-protocol-lock-and-rules.md <<'EOF' # 02 - Protocol Lock and Study Rules ## Protocol summary Each participant completes three phases in assigned mode order with preconfigured ticker/query and mandatory post-task instrument. ## Mandatory rules for measured runs 1. No ad-hoc changes to phase ticker/query. 2. Required checkpoints must be completed before phase progression. 3. Optional checkpoints can be skipped, but skip events must be logged. 4. Post-task questionnaire is mandatory for every measured phase. 5. Phase/task completion must be backend-marked. ## Conversational follow-up rule - Primary study lane: no free conversational follow-up before summary + questionnaire completion. - If follow-up is enabled, classify as exploratory lane and exclude from primary hypothesis tests. ## Participant flow (measured) 1. Orientation and consent. 2. Short practice task (not analyzed). 3. Phase 1 task. 4. Phase 2 task. 5. Phase 3 task. 6. End-of-session comparative reflection. ## Failure handling policy - Provider outage: continue only if fallback flag is enabled and fallback state is logged. - UI/flow break: pause session, record incident, rerun phase only if protocol allows. - Missing required instrument: phase is incomplete until instrument captured. ## Deviations log requirement Any deviation from locked protocol must be recorded with: - participant_id - phase - timestamp - reason - affected metrics EOF cat > next-steps/03-measurement-and-analysis-plan.md <<'EOF' # 03 - Measurement and Analysis Plan ## Primary outcomes 1. Summary quality score (blinded rubric). 2. User trust/confidence score. 3. Time-on-task. ## Suggested metric definitions - Quality score: composite rubric (factual support, relevance, structure, citation grounding). - Trust score: questionnaire field `confidence` (and optional trust item). - Time-on-task: `task.completed_at - task.started_at` from backend. ## Secondary metrics - Citation helpfulness (`yes/partly/no`). - Characters edited. - Number of selected/rejected chunks. - Checkpoint skip rate. - Fallback rate (live vs fallback run segments). ## Data exclusions (predefine) - Incomplete phase runs. - Missing mandatory questionnaire. - Technical failure sessions with unrecoverable state loss. ## Hypothesis structure - H1: HITL modes have higher quality than baseline. - H2: HITL modes have higher trust/confidence than baseline. - H3: HITL modes require more time than baseline, but with favorable quality gain per minute. ## Analysis approach (practical) - Within-subject comparisons for baseline vs HITL phases. - Group comparison for mode-order effects (A vs B). - Report effect sizes and confidence intervals, not only p-values. ## Reporting outputs - Table: per-mode mean/median quality, trust, time. - Plot: quality vs time tradeoff by mode. - Plot: intervention behavior (selection/edit intensity) by mode. EOF cat > next-steps/04-data-contract-and-event-schema.md <<'EOF' # 04 - Data Contract and Event Schema ## Minimum backend persistence contract per phase task - `task_id`, `session_id`, `participant_id`, `phase`, `mode` - `query_text` - `retrieved_nodes` - `selected_node_ids`, `rejected_node_ids`, `selection_order` - `generated_summary`, `edited_summary`, `characters_edited` - `questionnaire_response` - timestamps: `started_at`, `retrieval_completed_at`, `generation_completed_at`, `edit_completed_at`, `completed_at` - `time_on_task_seconds` - `provider_path` (live/fallback) and optional provider error flags ## Checkpoint event model (recommended) Each checkpoint action should be append-only with stable `checkpoint_instance_id`: - `offered` - `submitted` - `skipped` - `retry` - `timed_out` - `failed` ## Event fields - `event_id` - `event_type` - `timestamp` - `participant_id` - `session_id` - `task_id` - `phase` - `mode` - `checkpoint_definition_id` - `checkpoint_instance_id` - `actor` (`user` or `system`) - `payload` (JSON) ## Classification flags - `lane = primary|exploratory` - `is_protocol_event = true|false` ## Data quality checks 1. Every completed phase has questionnaire payload. 2. Every required checkpoint has terminal event (`submitted` or protocol-approved exception). 3. Every task has a valid completion timestamp. 4. Missing/duplicate instance IDs are zero. EOF cat > next-steps/05-implementation-backlog.md <<'EOF' # 05 - Implementation Backlog (Thesis First) ## Priority order 1. Data integrity 2. Workflow integrity 3. Study UX clarity 4. Nice-to-have polish ## P0 - Must complete before real study runs 1. Backend-authoritative checkpoint progression. 2. Persist questionnaire response in backend. 3. Use `checkpoint_instance_id` for submit/skip/retry APIs. 4. Ensure frontend calls task/session completion endpoints. 5. Persist provider path (live/fallback) for each task. ## P1 - Strongly recommended 1. Lock measured-run lane to fixed query/ticker and gated progression. 2. Separate exploratory conversational lane from primary lane in logs. 3. Add protocol deviation logging endpoint/table. ## P2 - Optional for thesis timeline 1. Context-assist per chunk (source-bound) as controlled experimental variable. 2. Right-pane artifact parity for all submitted checkpoints. 3. Expanded post-session instrument panel. ## Definition of done for P0 - Manual test script passes for all four modes. - No phase can advance without required study data. - Complete task records are analyzable without joining frontend-only state. EOF cat > next-steps/06-pilot-runbook.md <<'EOF' # 06 - Pilot Runbook (2-3 Participants) ## Pilot purpose Validate protocol clarity, system stability, and data completeness before full study collection. ## Pre-pilot prep 1. Confirm locked protocol config is active. 2. Verify required checkpoints/instruments are enabled. 3. Run one internal dry run per mode. 4. Prepare facilitator script and incident sheet. ## Facilitator script (compact) 1. Explain task goal and interaction constraints. 2. Emphasize that evidence-based review is required. 3. Start session and observe silently unless blocked. 4. Record confusion points and technical issues. 5. Capture participant feedback after each phase. ## Pilot acceptance criteria 1. Participants complete all phases without protocol ambiguity. 2. No missing mandatory fields in phase records. 3. Timing and checkpoint events are complete and consistent. 4. At least one full session completes without manual DB correction. ## Pilot output artifact After pilot, produce a short memo with: - observed friction points - protocol changes needed - blocking bugs - go/no-go for full study EOF cat > next-steps/07-study-ready-checklist.md <<'EOF' # 07 - Study-Ready Checklist Use this checklist before recruiting full participants. ## Protocol - [ ] Scope and RQs frozen. - [ ] Inclusion/exclusion rules documented. - [ ] Deviations policy documented. ## System behavior - [ ] Required checkpoints enforce progression. - [ ] Post-task questionnaire is mandatory. - [ ] Task/session completion is backend-marked. - [ ] Mode order and phase assignments verified. ## Data integrity - [ ] All required fields persist in backend. - [ ] Checkpoint events use stable instance IDs. - [ ] No critical data exists only in frontend state. - [ ] Data export is analyzable without manual patching. ## Reliability - [ ] Fallback behavior tested and logged. - [ ] Failure handling tested (timeout, API error). - [ ] Recovery path documented. ## Pilot readiness - [ ] 2-3 participant pilot completed. - [ ] Pilot findings resolved or accepted with rationale. - [ ] Go decision signed off. EOF cat > next-steps/08-decision-log-template.md <<'EOF' # 08 - Decision Log Template Use this for protocol and implementation decisions that affect study validity. ## Entry - Date: - Decision ID: - Owner: - Related artifact/file: ## Decision summary - What was decided? - Why now? ## Alternatives considered 1. 2. 3. ## Impact - Protocol impact: - Data impact: - Engineering impact: - Analysis impact: ## Risk and mitigation - Risk: - Mitigation: ## Status - Proposed / Approved / Implemented / Superseded EOF


The strategy pack is created. I’m doing a quick verification pass now to confirm all artifacts exist and are readable with the expected structure.
