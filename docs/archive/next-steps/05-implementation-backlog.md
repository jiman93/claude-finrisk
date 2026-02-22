# 05 - Implementation Backlog (Thesis First)

## Priority order
1. Data integrity
2. Workflow integrity
3. Study UX clarity
4. Nice-to-have polish

## P0 - Must complete before real study runs
1. Backend-authoritative checkpoint progression.
2. Persist questionnaire response in backend.
3. Use `checkpoint_instance_id` for submit/skip/retry APIs.
4. Ensure frontend calls task/session completion endpoints.
5. Persist provider path (live/fallback) for each task.

## P1 - Strongly recommended
1. Lock measured-run lane to fixed query/ticker and gated progression.
2. Separate exploratory conversational lane from primary lane in logs.
3. Add protocol deviation logging endpoint/table.

## P2 - Optional for thesis timeline
1. Context-assist per chunk (source-bound) as controlled experimental variable.
2. Right-pane artifact parity for all submitted checkpoints.
3. Expanded post-session instrument panel.

## Definition of done for P0
- Manual test script passes for all four modes.
- No phase can advance without required study data.
- Complete task records are analyzable without joining frontend-only state.
