# 02 - Protocol Lock and Study Rules

## Protocol summary
Each participant completes three phases in assigned mode order with preconfigured ticker/query and mandatory post-task instrument.

## Mandatory rules for measured runs
1. No ad-hoc changes to phase ticker/query.
2. Required checkpoints must be completed before phase progression.
3. Optional checkpoints can be skipped, but skip events must be logged.
4. Post-task questionnaire is mandatory for every measured phase.
5. Phase/task completion must be backend-marked.

## Conversational follow-up rule
- Primary study lane: no free conversational follow-up before summary + questionnaire completion.
- If follow-up is enabled, classify as exploratory lane and exclude from primary hypothesis tests.

## Participant flow (measured)
1. Orientation and consent.
2. Short practice task (not analyzed).
3. Phase 1 task.
4. Phase 2 task.
5. Phase 3 task.
6. End-of-session comparative reflection.

## Failure handling policy
- Provider outage: continue only if fallback flag is enabled and fallback state is logged.
- UI/flow break: pause session, record incident, rerun phase only if protocol allows.
- Missing required instrument: phase is incomplete until instrument captured.

## Deviations log requirement
Any deviation from locked protocol must be recorded with:
- participant_id
- phase
- timestamp
- reason
- affected metrics
