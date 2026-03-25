# FinRisk HITL Thesis → Cloud Payroll: Knowledge Transfer & Alignment Analysis

> Cross-referencing Zul's FinRisk HITL research prototype with the Access Cloud Payroll platform to identify transferable patterns, shared architecture, and AI use cases.

---

## Executive Summary

The FinRisk HITL thesis and Cloud Payroll share **deep structural alignment** across 8 key areas. The thesis work on RAG pipelines, human-in-the-loop oversight, LLM observability, and behavioural analytics provides directly transferable knowledge into Cloud Payroll's AI roadmap — particularly the **System of Action PROPOSE tier** and **Phase 5 AI enhancements**.

| Thesis Concept | Cloud Payroll Equivalent | Transfer Readiness |
|---|---|---|
| LLM-guided tree traversal (RAG) | No RAG yet — biggest gap | **High** — direct application |
| HITL modes (R/G/Full) | System of Action Tier 2: PROPOSE | **High** — same pattern |
| Token & latency tracking | Phase 5 cost management (planned) | **High** — already built in thesis |
| Edit distance metrics | Proposal modification tracking | **Medium** — needs adaptation |
| Citation traceability | Compliance audit trail | **High** — critical for payroll |
| Quality tiers & confidence | AI confidence scores in PROPOSE | **High** — same concept |
| Behavioural analytics | UX analytics (not yet planned) | **Medium** — new capability |
| Multi-mode retrieval | Single-mode AI chat (current) | **Medium** — architectural pattern |

---

## 1. RAG Architecture — The Biggest Opportunity

### What FinRisk Built

FinRisk uses **LLM-guided tree traversal** over structured SEC 10-K filings:

```
Query → o3-mini navigates tree (PART → Item → Section) → 3-8 leaf chunks → gpt-5.2 generates cited summary
```

Key design decisions:
- Hierarchical tree index (not flat vector search) for structured documents
- Hybrid re-ranking with token overlap scoring and intent-based boosts
- Three retrieval modes (tree, local ChromaDB, PageIndex API) behind a unified `RetrievalResult` interface
- Quality-audited indexes with automated quality gates

### How This Transfers to Cloud Payroll

**Payroll legislation is inherently hierarchical** — just like SEC filings:

```
Fair Work Act 2009
  └─ Part 2-2: National Employment Standards
       └─ Division 6: Annual Leave
            └─ Section 87: Entitlement to annual leave
                 └─ (1) For each year of service...
```

**Proposed RAG architecture for Cloud Payroll:**

```
Payroll Query
    │
    ▼
Tree Navigation (o3-mini / reasoning model)
    ├─ Level 1: Legislation source (Fair Work Act, Modern Award, ATO Ruling, STP spec)
    ├─ Level 2: Part/Division/Section
    ├─ Level 3: Specific clause or sub-section
    │
    ▼
Leaf chunks with full content + traversal path for auditability
    │
    ▼
GPT-4.1 / Claude generates cited answer
    │
    ▼
System of Action PROPOSE tier: user reviews AI response with source citations
```

**Document corpus for Cloud Payroll RAG:**

| Source | Structure | Update Frequency |
|---|---|---|
| Fair Work Act 2009 | Hierarchical (Parts → Divisions → Sections) | Annual amendments |
| Modern Awards (122 awards) | Hierarchical (Clauses → Sub-clauses) | Annual wage review |
| ATO Tax Rulings | Numbered sections | Quarterly |
| STP Phase 2 Specification | Structured XML schema docs | Bi-annual |
| Superannuation Guarantee Ruling | Sections with examples | Annual |
| Company-specific policies | Varies | Per-client |

**Direct reuse from thesis:**
- `build_tree_index.py` pattern → adapt for legislation document indexing
- `tree_service.py` → adapt navigation prompts for payroll domain
- `audit_chunk_quality.py` → reuse for legislation chunk quality gates
- `RetrievalResult` interface pattern → same abstraction in .NET

---

## 2. HITL ↔ System of Action PROPOSE Tier

### The Core Alignment

This is the **strongest alignment** between the two systems. FinRisk's HITL research directly validates the UX patterns Cloud Payroll needs for its PROPOSE tier.

| FinRisk HITL Mode | Cloud Payroll Equivalent | User Action |
|---|---|---|
| **Baseline** (no intervention) | **AUTOMATE** (Tier 1) | Observe — system acts autonomously |
| **HITL-R** (curate retrieval input) | **PROPOSE with source review** | User reviews which data sources AI used |
| **HITL-G** (edit AI output) | **PROPOSE with edit** | User edits the AI recommendation before applying |
| **HITL-Full** (curate input + edit output) | **PROPOSE with full oversight** | User controls both input data and output action |

### Thesis Findings That Inform Cloud Payroll Design

The FinRisk study measures exactly what Cloud Payroll needs to know:

| Research Question | Payroll Application |
|---|---|
| **RQ1:** How does HITL oversight affect trust? | Do payroll admins trust AI-proposed pay rate changes more when they can see the source Award clause? |
| **RQ2:** Retrieval-level vs generation-level feedback? | Is it more effective to let admins review the data (employee records, award clauses) or the AI recommendation (proposed action)? |
| **RQ3:** Document quality moderates HITL effectiveness? | Does retrieval accuracy of legislation chunks affect admin confidence in AI proposals? |
| **RQ4:** Minimum retrieval quality for professional use? | What's the quality floor for payroll compliance RAG before admins reject AI assistance? |

### Concrete PROPOSE Tier Scenarios Enhanced by Thesis Knowledge

**Scenario: Award Rate Change Detection**
```
1. AUTOMATE: System detects Fair Work Annual Wage Review published
2. RAG RETRIEVAL: Tree traversal finds relevant Award clauses for affected employees
3. PROPOSE (HITL-R style): Admin reviews retrieved Award clauses
   → "AI found these 3 clauses from the Clerks Award. Are these the right sections?"
4. PROPOSE (HITL-G style): Admin reviews proposed rate changes
   → "Apply $23.23/hr → $24.10/hr for 47 employees. Edit or approve?"
5. Admin approves → System applies changes
```

**Scenario: STP Error Resolution**
```
1. STP submission returns ATO error code
2. RAG RETRIEVAL: Tree traversal finds relevant STP spec section explaining error
3. PROPOSE: AI explains the error with cited source + proposes fix
   → "Error PAYEVNT.0010: Invalid payment type. Based on STP Phase 2 spec Section 4.3.2,
      this employee's payment type should be 'SAW' not 'OAW'. [Section 4.3.2, Page 45]"
4. Admin reviews source citation, approves fix
```

---

## 3. LLM Observability & Cost Tracking

### What FinRisk Built

Lightweight, zero-dependency LLM observability:

```json
{
  "generation": {
    "prompt_tokens": 4821,
    "completion_tokens": 512,
    "duration_ms": 3200,
    "model": "gpt-5.2"
  },
  "navigation": [
    { "prompt_tokens": 380, "completion_tokens": 45, "duration_ms": 850, "model": "o3-mini", "depth": 0 },
    { "prompt_tokens": 620, "completion_tokens": 52, "duration_ms": 920, "model": "o3-mini", "depth": 1 }
  ]
}
```

### What Cloud Payroll Needs (Phase 5 Roadmap)

From `docs/roadmap/phase-5-ai.md`:
- Token usage tracking for every Azure OpenAI API call
- Cost calculation based on pricing model
- Budget enforcement to prevent runaway costs
- **Per-tenant, per-user** spending visibility

### Transfer Plan

The thesis `llm_metrics` pattern maps directly, with multi-tenancy extensions:

```json
{
  "tenant_id": "acme-corp",
  "user_id": "admin@acme.com",
  "operation": "award_rate_review",
  "retrieval": {
    "navigation": [
      { "prompt_tokens": 380, "completion_tokens": 45, "duration_ms": 850, "model": "gpt-4.1", "depth": 0 }
    ]
  },
  "generation": {
    "prompt_tokens": 2100,
    "completion_tokens": 350,
    "duration_ms": 2800,
    "model": "gpt-4.1"
  },
  "estimated_cost_usd": 0.0082,
  "timestamp": "2026-03-03T10:30:00Z"
}
```

**Reusable patterns from thesis:**
- `LLMResult` dataclass pattern (content + metrics) → adapt to C# record
- Per-depth navigation cost tracking → same pattern for legislation tree traversal
- Incremental metric population (navigation stored after retrieval, generation stored after generation)

---

## 4. Citation & Source Traceability

### Why This Matters for Payroll

Payroll compliance requires **provable reasoning**. When an AI proposes a pay rate change, the admin must be able to verify the source legislation. This is not optional — it's a legal requirement.

### What FinRisk Built

- `[Section Title, Page N]` citation chips in AI summaries
- Click citation → PDF opens at correct page → section heading highlighted in yellow
- Fuzzy matching for text layer spans (handles split headings)
- Traversal path breadcrumbs showing how the AI navigated to each source

### Cloud Payroll Application

```
AI Proposal: "Increase base rate to $24.10/hr effective 1 July 2026"

Source Citations:
  [Clerks Award, Clause 15.1]  →  click → opens Award PDF, highlights clause
  [FW Act, Section 206]       →  click → opens legislation, highlights section
  [ATO Tax Table 2026-27]     →  click → opens tax schedule, highlights rate
```

**Traversal path for auditability:**
```
Fair Work Commission > Annual Wage Review 2026 > Modern Awards > Clerks Award > Clause 15 > 15.1 Base Rates
```

This directly addresses the **audit trail requirement** in Cloud Payroll's architecture (Event Sourcing pattern) and provides human-verifiable AI reasoning chains.

---

## 5. Edit Distance & Proposal Modification Tracking

### What FinRisk Built

| Metric | Method | Purpose |
|---|---|---|
| `edit_distance` | Word-level Levenshtein | Quantify how much participants changed AI output |
| `edit_similarity` | `difflib.SequenceMatcher.ratio()` | 0.0–1.0 similarity score |
| `first_edit_at` | Timestamp of first keystroke | Measure deliberation time |

### Cloud Payroll Application

When an admin edits an AI proposal before approving, track the same metrics:

| Metric | Payroll Context |
|---|---|
| `edit_distance` | How many fields did the admin change in the proposed action? |
| `edit_similarity` | What percentage of the AI recommendation was accepted as-is? |
| `time_to_first_edit` | How long did the admin review before modifying? |
| `fields_modified` | Which specific fields were changed (rate, effective date, employees)? |

**Why this matters:**
- **AI model improvement:** If admins consistently edit a specific field, the model/prompt needs tuning
- **Trust measurement:** High edit distance = low trust in AI recommendations
- **Compliance evidence:** Demonstrates human review of AI-proposed changes
- **UX optimisation:** Long deliberation time + low edit distance = admin trusts AI but feels obligated to review

---

## 6. Quality Tiers & AI Confidence Scores

### FinRisk Quality Tiers

| Tier | Retrieval Accuracy | Tickers |
|---|---|---|
| Tier 1 (90%+) | Excellent | WMT (100%), AMZN (93%), AAPL (88%) |
| Tier 2 (80-89%) | Good | MSFT (80%) |
| Tier 3 (75-79%) | Acceptable | TSLA (75%), PFE (75%), XOM (78%) |

### Cloud Payroll Confidence Scores (System of Action)

| Score Range | Display | Action |
|---|---|---|
| 90-100 | High confidence (green) | One-click approve |
| 70-89 | Medium confidence (amber) | Review recommended |
| 50-69 | Low confidence (red) | Manual review required |
| <50 | Insufficient | AI declines to propose — escalates to INFORM tier |

### Knowledge Transfer

The thesis provides **empirical methodology** for:
1. **Calibrating confidence thresholds** — at what confidence level do users actually trust AI proposals?
2. **Quality gating** — automated quality checks on retrieved legislation chunks before generating proposals
3. **Tier-based UX** — adapting the interface based on retrieval quality (show more/fewer source citations)

---

## 7. Behavioural Analytics (New Capability for Cloud Payroll)

### What FinRisk Tracks

| Metric | Measurement | Analysis |
|---|---|---|
| Time-on-task | Per-phase duration | Effort required per HITL mode |
| Deliberation time | Time before first edit | Review depth before action |
| PDF dwell time | Accumulated source view time | Source verification behaviour |
| View count | PDF open/close cycles | Number of citations checked |
| Selection patterns | Which chunks kept/rejected | Data curation preferences |

### Proposed Cloud Payroll Behavioural Analytics

| Metric | Measurement | Business Value |
|---|---|---|
| Proposal review time | Time from proposal display to approve/edit/cancel | Measures trust and cognitive load |
| Source verification rate | % of proposals where admin clicks citation links | Compliance behaviour |
| Edit-before-approve rate | % of proposals modified before approval | AI accuracy indicator |
| Bulk vs individual approve | Ratio of batch approvals to individual reviews | Risk tolerance |
| Cancel rate by category | % of cancelled proposals per AI recommendation type | Model tuning signal |
| Time-to-first-action | Latency from proposal display to first interaction | UX responsiveness |

These metrics could feed into the **AI Proxy Service** (Phase 5-01) for continuous model improvement.

---

## 8. Multi-Mode Retrieval Architecture

### FinRisk Pattern

```python
# All modes return the same RetrievalResult interface
class RetrievalResult:
    nodes: List[RetrievedNode]
    traversal_path: Optional[List[TraversalStep]]
    nav_metrics: Optional[Dict]
```

Three interchangeable backends: `tree` (production), `local` (offline dev), `pageindex` (prototyping).

### Cloud Payroll Application

Apply the same abstraction for payroll knowledge retrieval:

| Mode | Backend | Use Case |
|---|---|---|
| `legislation` | Tree traversal over indexed legislation | Production queries about awards, FW Act |
| `internal-docs` | Vector search over company wiki/policies | Internal knowledge base queries |
| `hybrid` | Legislation + internal docs merged | Complex queries spanning multiple sources |
| `cached` | Pre-computed answers for common queries | High-volume identical questions (e.g., "What's the current SGC rate?") |

All behind a unified `IRetrievalService` interface in .NET — downstream code is mode-agnostic.

---

## Implementation Roadmap: Recommended Sequence

Based on the alignment analysis, here's a recommended order for transferring thesis knowledge into Cloud Payroll:

### Phase A: Quick Wins (1-2 weeks each)

| # | Item | Thesis Source | Cloud Payroll Target | Effort |
|---|---|---|---|---|
| A1 | LLM observability (token/cost tracking) | `llm_metrics` pattern | Phase 5 cost management | 1 week |
| A2 | Proposal modification tracking | Edit distance + first-edit-at | PROPOSE tier analytics | 1 week |
| A3 | AI confidence score calibration | Quality tier methodology | PROPOSE tier UX | 1 week |

### Phase B: Core RAG (3-5 weeks)

| # | Item | Thesis Source | Cloud Payroll Target | Effort |
|---|---|---|---|---|
| B1 | Legislation tree index builder | `build_tree_index.py` | Index Fair Work Act + Modern Awards | 2 weeks |
| B2 | Tree traversal service | `tree_service.py` | .NET `LegislationTreeService` | 2 weeks |
| B3 | Citation traceability UI | Citation chips + PDF highlighting | Proposal source citations | 1 week |

### Phase C: Full HITL Integration (4-6 weeks)

| # | Item | Thesis Source | Cloud Payroll Target | Effort |
|---|---|---|---|---|
| C1 | Source review mode (HITL-R) | Chunk Selector checkpoint | Admin reviews retrieved legislation before AI generates proposal | 2 weeks |
| C2 | Proposal edit mode (HITL-G) | Summary Editor checkpoint | Admin edits AI proposal before applying | 2 weeks |
| C3 | Behavioural analytics pipeline | All thesis metrics | Continuous AI improvement feedback loop | 2 weeks |

### Phase D: Advanced (6-8 weeks)

| # | Item | Thesis Source | Cloud Payroll Target | Effort |
|---|---|---|---|---|
| D1 | Multi-mode retrieval | 3-mode `RetrievalResult` pattern | Legislation + internal docs + cached | 3 weeks |
| D2 | Automated quality gates | `tree_quality_gate.py` | Legislation index quality assurance | 2 weeks |
| D3 | Study-informed UX tuning | Thesis experimental results | Optimize PROPOSE tier based on empirical data | 3 weeks |

---

## Technology Mapping

| FinRisk (Thesis) | Cloud Payroll (Production) | Notes |
|---|---|---|
| Python / FastAPI | .NET 10 / ASP.NET Core | Different language, same patterns |
| React 18 + Zustand | React 19 + (state TBD) | Direct frontend transfer |
| SQLite | Azure SQL | Same schema concepts, different scale |
| OpenAI API (gpt-5.2, o3-mini) | Azure OpenAI (gpt-4.1) | Same SDK patterns, Azure-hosted |
| ChromaDB (local vector store) | Azure AI Search (production vector store) | Cloud-native equivalent |
| `tree_service.py` | `LegislationTreeService.cs` | Port to C# with same algorithm |
| `llm_service.py` | `AiAssistantService.cs` | Extend existing service |
| `RetrievalResult` dataclass | `IRetrievalResult` interface | Same abstraction in .NET |
| react-pdf + highlighting | Same or equivalent component | Direct reuse possible |

---

## Key Thesis Insights for Cloud Payroll

1. **Tree traversal > flat vector search for structured documents.** Legislation, awards, and ATO rulings are hierarchically structured — tree navigation with a reasoning model outperforms naive embedding similarity.

2. **HITL at the retrieval stage builds more trust than HITL at the generation stage.** If the thesis confirms this (RQ2), Cloud Payroll should prioritise showing admins *which legislation the AI consulted* over letting them edit *what the AI proposed*.

3. **Quality gating is essential.** The thesis found that automated quality checks on retrieved chunks prevent hallucinations downstream. Apply the same principle: never generate a payroll proposal from low-quality legislation retrieval.

4. **Cost tracking from day one.** The thesis added observability retrospectively based on feedback. Cloud Payroll should build it in from the start — especially with multi-tenant billing implications.

5. **Behavioural metrics reveal trust patterns.** Deliberation time, edit distance, and source verification rates are leading indicators of whether users actually trust AI recommendations — more reliable than self-reported surveys.

---

## Conclusion

The FinRisk HITL thesis is not just academically adjacent to Cloud Payroll — it's a **direct prototype** for the AI experience Cloud Payroll needs. The thesis provides:

- **Proven RAG architecture** adaptable from financial filings to payroll legislation
- **Empirical evidence** for HITL design decisions in the PROPOSE tier
- **Production-ready patterns** for observability, citation, and quality gating
- **Behavioural measurement framework** for continuous AI improvement

The System of Action's PROPOSE tier is essentially a productionised version of the thesis HITL modes, applied to payroll instead of financial risk analysis. Every pattern built for FinRisk has a direct counterpart in Cloud Payroll's AI roadmap.

---

*Generated: 2026-03-03 | Cross-reference: FinRisk HITL System Overview + Cloud Payroll Phase 5 AI Roadmap + System of Action Framework*
