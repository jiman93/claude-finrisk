# AI Governance Strategy — Gulf to ASEAN

*March 2026*

---

## The Thesis

Saudi Arabia is building AI governance frameworks right now. Malaysia and ASEAN are 18-24 months behind on the same curve. Being a core contributor to governance-compliant AI systems in the Gulf — during the construction phase, not after — creates a track record that doesn't exist yet in ASEAN. The sequencing matters because the problems are identical, but the Gulf is solving them first and paying more to do it.

---

## The Regulatory Landscape

### Saudi Arabia — 2026 is the year

Saudi Arabia has designated 2026 the **Year of Artificial Intelligence**. This isn't a branding exercise — it's a policy umbrella creating procurement preferences, regulatory fast-tracks, and new compliance requirements across government and enterprise.

**What's already in place:**

- **SDAIA** (Saudi Data and AI Authority) — established 2019, owns the national AI governance mandate
- **Personal Data Protection Law (PDPL)** — enforceable, with data localisation requirements for sensitive/national data
- **AI Ethics Principles v2.0 (2023/2025)** — seven principles, four-tier risk classification, defined roles (Responsible AI Officer, AI System Assessor)
- **SDAIA achieved ISO/IEC 42001 certification in July 2024** — signalling this standard will become central to procurement
- **Regulation on Personal Data Transfer Outside the Kingdom (2025)** — cross-border transfer requires adequacy assessments or standard contractual clauses

**What's coming:**

- A **dedicated AI law is expected within 1-2 years** — currently being drafted
- Companies are building governance frameworks in anticipation, not in response
- **Entities demonstrating strong governance get preferential treatment** — faster approvals, regulatory recognition, reputation gain
- ISO 42001 alignment is becoming a de facto procurement gate for government and quasi-government contracts

**What this means for LGN's demo clients:**

Aramco, Khalifa University, and Academy of Learning aren't evaluating a chatbot. They're evaluating whether what you've built can survive the governance requirements they know are coming. A system that generates answers **and** produces a compliance-grade audit trail is solving two problems simultaneously.

### Malaysia — Cabinet submission June 2026

Malaysia is tracking a parallel path, ~18-24 months behind Saudi:

- **National AI Office (NAIO)** launched December 2024, coordinating the AI Action Plan 2026-2030
- **National AI Governance & Ethics Guidelines (AIGE, 2024)** — among the first in ASEAN, structured across Users, Regulators, and Developers. Non-binding now.
- **Complete AI legislative framework expected to be submitted to Cabinet in June 2026** — the same month as the thesis submission and LGN demo window
- **AI SAFE Network** led by Malaysia — regional initiative for responsible AI adoption across Southeast Asia
- **RM600 million** allocated in 2025 budget for AI R&D; target of RM60 billion AI GDP contribution by 2030
- Target: **top 20 in global AI readiness by 2030**

### ASEAN — soft law hardening into regulation

The regional shift is explicit: from guidelines to enforcement.

- **ASEAN Responsible AI Roadmap (2025-2030)** adopted March 2025
- **ASEAN Guide on AI Governance & Ethics** expanded edition (January 2025) adds GenAI-specific focus areas: content provenance, incident reporting, prompt injection security, transparency
- **Singapore's AI Verify** — world's first AI governance testing framework and toolkit (IMDA/PDPC)
- Movement from "soft law to hard rules" across the region — binding governance is the trajectory, not the question

---

## ISO/IEC 42001 — The Standard That Matters

### Why this standard specifically

ISO/IEC 42001:2023 is the **world's first certifiable standard for AI management systems**. It's not a set of guidelines — it's auditable. Organizations can be certified against it, which means:

- Procurement teams can **require** it in tenders
- Compliance officers can **verify** it through audits
- Regulators can **reference** it in binding legislation

SDAIA achieving ISO 42001 certification in July 2024 is the strongest signal: this is the governance bar Saudi enterprises will be measured against. LGN already offers ISO 42001 consultancy — the architecture needs to embody it, not just reference it.

### Structure overview

The standard follows a 10-clause structure (Clauses 4-10 are auditable) plus two normative annexes:

**Core Clauses:**

| Clause | Focus | Key Requirement |
|---|---|---|
| 4. Context | Scope and boundaries | Understand internal/external factors affecting AI governance |
| 5. Leadership | Governance and accountability | Establish clear ownership, policy commitment |
| 6. Planning | Risk management | Identify, assess, and treat AI-specific risks (6.1); set measurable AI objectives (6.2) |
| 7. Support | Resources and competence | Ensure skilled people, reliable data, secure tooling, accessible records |
| 8. Operation | Execution | Apply governance controls to AI development, deployment, maintenance |
| 9. Performance Evaluation | Monitoring | Measure, analyse, evaluate AIMS performance; conduct internal audits (9.2) |
| 10. Improvement | Continuous improvement | Address nonconformities, drive corrective actions |

**Annex A — 9 control areas, 38 controls:**

| Area | Controls | Focus |
|---|---|---|
| A.2 | 3 | AI policies — foundational governance direction, alignment, review |
| A.3 | 2 | Internal organization — roles, responsibilities, concern reporting |
| A.4 | 5 | Resources — data, tooling, compute, human resources documentation |
| A.5 | 4 | Impact assessment — structured evaluation of effects on individuals, groups, society |
| A.6 | 9 | AI system lifecycle — requirements, design, verification, deployment, operation, monitoring, event logs |
| A.7 | 5 | Data governance — acquisition, quality, provenance, preparation |
| A.8 | 4 | Information for stakeholders — user documentation, external reporting, incident communication |
| A.9 | 3 | Use of AI systems — responsible use processes, intended use boundaries |
| A.10 | 3 | Third-party relationships — supplier compliance, customer obligations |

**Annex B** provides implementation guidance for Annex A controls — the practical "how."

---

## The Mapping — What We Already Solve

This is the concrete pitch: the FinRisk architecture already implements observable, auditable patterns that map directly to ISO 42001 requirements. This isn't retrofitting governance onto a demo — the governance layer was built into the system from the start.

### Clause 6.1 — AI Risk Assessment

**What 42001 requires:** Identify what could go wrong with the AI system, how serious it could be, how likely it is, and which risks need action. Document the results.

**What we already have:**

| Risk | How The Architecture Addresses It |
|---|---|
| Retrieval misses relevant content | Two-stage retrieval — re-ranker scores ALL nodes, catches what the LLM missed. Provenance flags (`from_traversal: true/false`) make it visible which safety net caught which content |
| LLM navigation makes wrong turn | Traversal path records every decision at every depth level — failure is diagnosable ("LLM missed PART II at D0") rather than opaque ("bad results") |
| Generated output contains hallucination | HITL-Generation checkpoint: human reviews output, flags specific spans with reasons. Both AI and human versions preserved |
| User over-trusts AI output | Graduated control levels (Automatic → Retrieval → Generation → Full) let the system match oversight to risk level |
| Retrieval quality varies across documents | Automated quality gate scores each document index. Quality tiers (75-100% accuracy) flag which documents need tighter human oversight |

**Gap to close for production:** Formalise the risk register as an ISO 42001-compliant document. The mitigations exist; the documentation wrapper doesn't yet.

### Clause 9.1 — Monitoring and Measurement

**What 42001 requires:** Regularly measure and analyse how well the AI management system performs using reliable methods. Keep records of results.

**What we already have:**

| Metric | Where It's Captured |
|---|---|
| Retrieval accuracy per document | Quality gate scores during index build; per-query retrieval metrics at runtime |
| LLM navigation performance | `nav_metrics` — model, tokens, latency per traversal call |
| Generation cost and quality | `llm_metrics` — model, tokens, duration per generation call |
| Human intervention rate | Selected vs rejected chunk counts per task; edit distance and similarity scores |
| Time-on-task per pipeline stage | Per-stage timestamps: `query_submitted_at`, `retrieval_completed_at`, `selection_completed_at`, `generation_completed_at`, `task_completed_at` |
| Source verification behaviour | `source_view_duration_ms` — how long users spend checking citations against source documents |

**Gap to close for production:** Aggregate dashboards. The per-task data exists; the system-level views showing trends over time (retrieval accuracy drift, edit rate increases, latency degradation) need to be built for ongoing monitoring.

### A.3 — Roles and Responsibilities

**What 42001 requires:** Clearly assigned roles and escalation processes for AI governance.

**What we already have:**

| Role | System Support |
|---|---|
| End user | Four control levels define exactly what each user can and cannot do at each pipeline stage |
| Domain expert | Chunk selector + summary editor give granular intervention without requiring technical knowledge |
| Admin/Monitor | Study Monitor dashboard — live session monitoring, participant progress, session drill-down |
| Auditor | Three-level drill-down: system overview → session detail → task detail with full audit record |

**Gap to close for production:** Role-based access control. The role *patterns* exist in the UX; the authentication and permission system doesn't.

### A.5 — Impact Assessment

**What 42001 requires:** Structured process to evaluate AI system impact on individuals, groups, and society. Document the results.

**What we already have:**

The entire user study is an impact assessment instrument:
- 4 HITL modes measuring how different levels of human oversight affect trust, perceived accuracy, and sense of control
- Likert scales capturing self-reported trust, accuracy, completeness, and feature usefulness
- Behavioural data (selection patterns, edit behaviour, flagging) as objective complement to self-report
- Qualitative interviews for understanding *why*, not just *what*

**Gap to close for production:** Reframe the study methodology as a repeatable impact assessment framework that can be run when deploying to new domains or user populations.

### A.6.2.6 — Operation and Monitoring

**What 42001 requires:** Ensure ongoing oversight of AI systems in operation.

**What we already have:**

| Capability | Implementation |
|---|---|
| Live monitoring | Admin dashboard: active sessions, current phase, real-time progress |
| Session replay | Full message stream captured — feed into same renderer for read-only replay |
| Task-level inspection | Every query produces a complete audit record: timing, chunks, selections, edits, flags, traversal path, LLM metrics |
| Anomaly detection signal | Edit distance and similarity scores flag tasks where humans made large changes (potential quality issue) |

### A.6.2.8 — Recording of Event Logs

**What 42001 requires:** Capture operational history of AI system events.

**What we already have — this is the strongest mapping:**

The per-task audit record captures the full AI decision chain:

```
Query → Traversal Path (per-depth: options presented, selected, model, tokens)
      → Retrieved Nodes (content, page ref, provenance flag per chunk)
      → Selection Record (selected IDs, rejected IDs, click sequence)
      → Generated Output (original AI text, never overwritten)
      → Edited Output (human version, edit distance, flagged spans)
      → Timing (per-stage timestamps with millisecond precision)
      → LLM Metrics (model, tokens, latency per call)
```

This is more granular than what most production AI systems capture. The traversal path alone — showing exactly which branches the LLM explored at each depth level and why — is an explainability artifact that most RAG systems cannot produce.

### A.7.5 — Data Provenance

**What 42001 requires:** Track data origins and lineage. Document creation, updates, transformations.

**What we already have:**

| Provenance Layer | What's Tracked |
|---|---|
| Document source | SEC EDGAR filing, ticker, filing date, document URL |
| Parse provenance | PageIndex API output → flattened nodes → domain tree (each transformation documented) |
| Tree version | `{TICKER}_tree.json` — versioned, deterministic rebuild from same source |
| Chunk provenance | `from_traversal` flag per chunk — distinguishes AI reasoning from keyword matching |
| Output provenance | Which chunks went into generation, which model produced the output, what the human changed |

### A.8 — Information for Interested Parties

**What 42001 requires:** Transparency about how the AI system works, its limitations, and how to interact with it.

**What we already have:**

| Stakeholder | What They See |
|---|---|
| End user | Traversal path (why these chunks were retrieved), inline citations with page references, provenance flags on each chunk |
| Reviewer/Editor | Original AI output alongside edited version, diff metrics, flagged spans with reasons |
| Admin | Three-level drill-down from system overview to individual task audit records |
| Auditor | Complete immutable record: every decision, every override, every timestamp |

The traversal path is the key differentiator. Standard RAG returns "here are 5 similar chunks" (opaque). This system returns "I navigated PART I → Item 1A → Supply Chain Risks, and the re-ranker also surfaced a node from Item 7 that the navigation missed" (auditable).

---

## SDAIA AI Ethics Principles — Direct Mapping

The seven SDAIA principles map onto specific architectural features:

| SDAIA Principle | What It Requires | What We Have |
|---|---|---|
| **1. Fairness** | Avoid bias and discrimination through data and model governance | Quality-tiered document indices expose retrieval quality variance. Per-document accuracy scores prevent deploying on documents the system handles poorly. Human override at retrieval stage prevents biased chunk selection from propagating |
| **2. Privacy & Security** | Comply with PDPL, minimise data collection, strong security controls | Architecture separates document parsing (outsourced, vendor SLA) from domain logic (owned). No embedding storage reduces data surface. Tree indices are structural metadata, not raw content replication |
| **3. Humanity** | Human dignity, oversight, prevent harmful uses | Four-level HITL framework is literally a human oversight architecture. Graduated from observer to overseer based on stakes and context |
| **4. Social & Environmental Benefit** | AI uses that create net social value | Teaching/learning assistant for enterprise knowledge — directly enabling workforce capability. Low per-query cost (~$0.03-0.06) vs alternatives |
| **5. Reliability & Safety** | Testing, validation, resilience across conditions | Two-stage retrieval is a reliability architecture — each stage catches the other's failures. Automated quality gate validates index quality before deployment. Hybrid re-ranker stabilises results across non-deterministic LLM runs |
| **6. Transparency & Explainability** | Document datasets, model design, decision logic | Traversal path = decision logic made visible. Provenance flags = source attribution. Inline citations = output grounding. Edit preservation = human modification trail |
| **7. Accountability & Responsibility** | Clear ownership, incident reporting, remediation | Per-task audit records with complete chain of custody. Admin dashboard for monitoring. Flagging system for incident capture. Both AI and human versions preserved for accountability |

---

## The Strategic Arc

```
PHASE 1: Build in the Gulf (now → mid-2026)
├── Ship auditable AI retrieval to Aramco / Khalifa / Academy of Learning
├── See ISO 42001 and SDAIA requirements from the inside — what procurement
│   teams actually ask for, what auditors actually check
├── Build the track record: "delivered governance-compliant AI to Saudi Aramco"
├── Learn what governance problems look like at enterprise scale:
│   role-based access, data localisation, cross-border transfer, audit retention
│
PHASE 2: Extract the pattern (mid-2026 → 2027)
├── Saudi's dedicated AI law lands — you were inside while it formed
├── Malaysia's AI legislative framework goes to Cabinet (June 2026)
├── Generalise: the architecture reference docs already written become
│   the bridge between Gulf implementation experience and ASEAN needs
├── The FinRisk thesis provides academic credibility
├── The LGN work provides enterprise credibility
├── Together: "built the system, ran the study, deployed to Aramco,
│   here's how it maps to your governance requirements"
│
PHASE 3: Enter ASEAN with credibility (2027+)
├── Malaysia and ASEAN are building what Saudi is finishing
├── NAIO needs people who've built governance-compliant AI systems,
│   not just written guidelines about them
├── The problems are identical:
│   - Enterprise AI adoption stalling because no one can answer "how do we audit this?"
│   - Regulators writing frameworks without implementation references
│   - No bridge between technical AI capability and governance requirements
├── "Delivered to Saudi Aramco during Year of AI" opens doors in
│   Putrajaya, Singapore, and Jakarta
├── Position: the person who's done it, not the person theorising about it
```

### Why this sequencing specifically

The governance problems are the same across regions. The regulatory timelines are staggered:

| Milestone | Saudi Arabia | Malaysia | ASEAN |
|---|---|---|---|
| National AI authority | SDAIA (2019) | NAIO (Dec 2024) | No regional equivalent |
| Ethics/governance guidelines | Published 2023, updated 2025 | AIGE published 2024 | Guide expanded Jan 2025 |
| ISO 42001 adoption signal | SDAIA certified Jul 2024 | Not yet | Singapore leading via AI Verify |
| Dedicated AI law | Expected within 1-2 years | Cabinet submission Jun 2026 | Roadmap 2025-2030, binding rules TBD |
| Enterprise procurement gates | Forming now (Year of AI 2026) | Emerging | Early stage |

Being inside the Gulf while they're 18-24 months ahead means arriving in ASEAN with answers to questions they haven't finished asking yet.

### What makes this position hard to replicate

Most people in ASEAN AI governance come from one of two backgrounds:

1. **Policy/legal** — can read the frameworks, haven't built a system that implements them
2. **Technical/ML** — can build RAG pipelines, don't think about audit trails and provenance as governance instruments

The rare position: someone who built a system where the observability layer **is** the governance layer — traversal paths, provenance flags, edit preservation, per-stage timestamps — and deployed it to a client operating under active governance requirements. That profile doesn't exist yet in ASEAN.

---

## Gaps to Close

What the architecture has vs what production governance requires:

| Have | Need | Effort |
|---|---|---|
| Per-task audit records | Immutable event-sourced log with compliance-grade retention | Medium — architectural change, not conceptual |
| Admin dashboard (single study) | Multi-tenant monitoring with alerting on quality degradation | Medium — extend existing patterns |
| Quality gate per document | Continuous quality monitoring across document corpus | Low — extend existing scoring |
| HITL at retrieval and generation | Role-based HITL — who gets which controls based on permission level | Medium — auth + RBAC layer |
| SQLite storage | Versioned document store, audit log retention policies | Medium — infrastructure, not logic |
| No authentication | SSO, RBAC, document-level access control | High — but standard enterprise work |
| Static document snapshots | Scheduled re-indexing, version-aware tree diffs | Medium — operational concern |
| Research instrumentation framing | ISO 42001 documentation wrapper (SoA, risk register, control mapping) | Low — the substance exists, the formal documents don't |

The last row is the key insight: **the hardest part is already done.** The system captures more granular governance data than most production AI systems. What's missing is the formal documentation layer that maps this to ISO 42001's specific clause structure — and that's documentation work, not engineering work.

---

## The Risk to Name

The Gulf pays well. If LGN lands Aramco and scales, the pull to stay in that ecosystem will be rational and strong. The ASEAN governance work is higher-impact but lower-pay, at least initially.

The sequencing only works if Phase 1 remains a means, not an end. The credential is "delivered AI governance tooling to Saudi Aramco." The mission is "shaped how ASEAN builds its AI governance infrastructure." The first enables the second. Letting the first replace the second is the failure mode to watch for.

---

*Compiled March 2026*
