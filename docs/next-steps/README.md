# FinRisk — Thesis Study Strategy Pack

Strategy artifacts to lock the study design before full participant recruitment. Review in order.

## Artifacts

| File | Purpose |
|------|---------|
| `01-thesis-scope-and-rqs.md` | Scope freeze, primary RQs, anchoring values |
| `02-protocol-lock-and-rules.md` | Mandatory protocol rules, failure handling, deviation logging |
| `03-measurement-and-analysis-plan.md` | Primary outcomes, metrics, hypothesis structure, analysis approach |
| `04-data-contract-and-event-schema.md` | Minimum backend persistence contract, checkpoint event model |
| `05-implementation-backlog.md` | P0/P1/P2 coding tasks, definition of done |
| `06-pilot-runbook.md` | 2–3 participant pilot script, acceptance criteria |
| `07-study-ready-checklist.md` | Gate checklist before recruiting full participants |
| `08-decision-log-template.md` | Template for recording protocol and implementation decisions |

## Current status

The system is built and code-complete for AAPL. Before running participants:

1. **Complete the UI end-to-end test** (see `PROJECT_STATE.md` §10 Step 1)
2. **Ingest remaining 7 tickers** (MSFT, TSLA, JPM, PFE, WMT, XOM, BA)
3. **Pass the study-ready checklist** (`07-study-ready-checklist.md`)
4. **Run a 2–3 person pilot** (`06-pilot-runbook.md`)

See `docs/PROJECT_STATE.md` for full system context.
