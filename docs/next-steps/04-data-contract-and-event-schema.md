# 04 - Data Contract and Event Schema

## Minimum backend persistence contract per phase task
- `task_id`, `session_id`, `participant_id`, `phase`, `mode`
- `query_text`
- `retrieved_nodes`
- `selected_node_ids`, `rejected_node_ids`, `selection_order`
- `generated_summary`, `edited_summary`, `characters_edited`
- `questionnaire_response`
- timestamps: `started_at`, `retrieval_completed_at`, `generation_completed_at`, `edit_completed_at`, `completed_at`
- `time_on_task_seconds`
- `provider_path` (live/fallback) and optional provider error flags

## Checkpoint event model (recommended)
Each checkpoint action should be append-only with stable `checkpoint_instance_id`:
- `offered`
- `submitted`
- `skipped`
- `retry`
- `timed_out`
- `failed`

## Event fields
- `event_id`
- `event_type`
- `timestamp`
- `participant_id`
- `session_id`
- `task_id`
- `phase`
- `mode`
- `checkpoint_definition_id`
- `checkpoint_instance_id`
- `actor` (`user` or `system`)
- `payload` (JSON)

## Classification flags
- `lane = primary|exploratory`
- `is_protocol_event = true|false`

## Data quality checks
1. Every completed phase has questionnaire payload.
2. Every required checkpoint has terminal event (`submitted` or protocol-approved exception).
3. Every task has a valid completion timestamp.
4. Missing/duplicate instance IDs are zero.
