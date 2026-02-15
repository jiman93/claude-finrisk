# 09 - Code Cleanup Plan (Thesis-First)

## Objective
Clean up the codebase to support a reliable thesis user study with minimal protocol risk:
- keep the measured flow simple
- enforce required study data capture
- reduce frontend-only workflow authority
- avoid feature expansion that introduces confounds

## Scope
In scope:
- protocol integrity and data integrity cleanup
- backend and frontend flow alignment
- removal of ambiguous or unused paths in measured runs

Out of scope:
- enterprise production hardening (auth, multi-tenant, infra SLA)
- new interaction features (for example chunk simplify) in primary study lane

## Working assumptions
1. Primary measured lane stays: retrieve -> select -> generate -> edit -> questionnaire.
2. Group A/B study protocol remains active.
3. Conversational follow-up is exploratory-only and not part of primary outcome analysis.

## Cleanup tracks

### Track A - Protocol authority and gating (P0)
Goal: backend is authoritative for completion/progression-critical state.

Tasks:
1. Add backend endpoints/models for checkpoint instance lifecycle if missing.
2. Move required checkpoint gating decision to backend.
3. Require questionnaire completion before phase-complete transition.
4. Ensure phase advance checks backend-complete conditions.

Target files:
- `src/backend/app/routers/tasks.py`
- `src/backend/app/routers/sessions.py`
- `src/backend/app/models/task.py`
- `src/backend/app/schemas/task.py`
- `src/frontend/src/stores/studyStore.ts`

Exit criteria:
- user cannot progress phase without required study artifacts persisted server-side
- no protocol-critical completion path depends only on frontend state

### Track B - Data contract and persistence completeness (P0)
Goal: all primary study metrics are persisted and analyzable from backend records.

Tasks:
1. Persist questionnaire payload in backend task record.
2. Ensure task/session completion endpoints are called by frontend.
3. Persist checkpoint submissions with stable IDs and timestamps.
4. Tag runs with provider path (`live` or `fallback`) for analysis segmentation.

Target files:
- `src/backend/app/models/task.py`
- `src/backend/app/routers/tasks.py`
- `src/frontend/src/api/client.ts`
- `src/frontend/src/stores/studyStore.ts`

Exit criteria:
- per-phase export can compute quality/trust/time without relying on frontend snapshots

### Track C - Study-lane UX simplification (P1)
Goal: improve chunk selection usability without adding new treatment variables.

Tasks:
1. Keep selection UI clear (preview, citation chip, selected count).
2. Keep strict requirement: at least one selected chunk before generation.
3. Avoid adding chunk simplify in primary measured lane.
4. Keep concise study logs in stream for retrieval/selection/generation/edit/questionnaire.

Target files:
- `src/frontend/src/components/study/StudyChatGate.tsx`
- `src/frontend/src/index.css`

Exit criteria:
- participants can complete selection confidently without auxiliary LLM tools

### Track D - Remove confusion and stale paths (P1)
Goal: reduce mismatch between docs and behavior.

Tasks:
1. Align README references with current repo path and current API flow.
2. Mark synthetic paths as dev-only if kept.
3. Keep one canonical thesis protocol reference in docs.

Target files:
- `README.md`
- `SCOPE.md`
- `PRODUCT.md`
- `docs/SYSTEM_DESIGN_FRAMEWORK.md`

Exit criteria:
- no contradictory protocol guidance across top-level docs

### Track E - Validation and dry runs (P0)
Goal: verify integrity before real participant runs.

Tasks:
1. Create manual script for all four modes.
2. Validate required data fields after each run.
3. Run 2-3 pilot participants before full study collection.

Target artifacts:
- `next-steps/06-pilot-runbook.md`
- `next-steps/07-study-ready-checklist.md`

Exit criteria:
- pilot passes checklist with no missing required fields

## Execution order
1. Track A (P0)
2. Track B (P0)
3. Track E (P0)
4. Track C (P1)
5. Track D (P1)

## Risk register (short)
1. Risk: mixed frontend/backend authority causes invalid phase completion.
   Mitigation: backend-required completion checks.
2. Risk: missing questionnaire or timestamps weakens thesis analysis.
   Mitigation: mandatory server-side validation before completion.
3. Risk: adding new assist features confounds measured outcomes.
   Mitigation: freeze feature scope for primary lane.

## Definition of done for cleanup phase
1. Protocol-critical transitions validated server-side.
2. Required per-phase study data is persisted and queryable.
3. Primary measured lane is stable and free from exploratory feature leakage.
4. Pilot runbook and study-ready checklist pass.
