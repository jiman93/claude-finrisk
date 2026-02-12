# 03 - Measurement and Analysis Plan

## Primary outcomes
1. Summary quality score (blinded rubric).
2. User trust/confidence score.
3. Time-on-task.

## Suggested metric definitions
- Quality score: composite rubric (factual support, relevance, structure, citation grounding).
- Trust score: questionnaire field `confidence` (and optional trust item).
- Time-on-task: `task.completed_at - task.started_at` from backend.

## Secondary metrics
- Citation helpfulness (`yes/partly/no`).
- Characters edited.
- Number of selected/rejected chunks.
- Checkpoint skip rate.
- Fallback rate (live vs fallback run segments).

## Data exclusions (predefine)
- Incomplete phase runs.
- Missing mandatory questionnaire.
- Technical failure sessions with unrecoverable state loss.

## Hypothesis structure
- H1: HITL modes have higher quality than baseline.
- H2: HITL modes have higher trust/confidence than baseline.
- H3: HITL modes require more time than baseline, but with favorable quality gain per minute.

## Analysis approach (practical)
- Within-subject comparisons for baseline vs HITL phases.
- Group comparison for mode-order effects (A vs B).
- Report effect sizes and confidence intervals, not only p-values.

## Reporting outputs
- Table: per-mode mean/median quality, trust, time.
- Plot: quality vs time tradeoff by mode.
- Plot: intervention behavior (selection/edit intensity) by mode.
