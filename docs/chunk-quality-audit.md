# Chunk Quality Audit Report

**Date:** 2026-02-23
**Scope:** All 8 study tickers (AAPL, AMZN, BA, MSFT, PFE, TSLA, WMT, XOM)
**Source:** `data/tree_index/{TICKER}_tree.json` — leaf nodes with `content_full` or `content_summary`
**Script:** `scripts/audit_chunk_quality.py`

---

## Summary Table

| Ticker | Leaves | Min | Median | Avg | Max | Short (<100) | Long (>10K) | Truncated | Dup Headings | Tables |
|--------|--------|-----|--------|-----|------|-------------|-------------|-----------|-------------|--------|
| AAPL | 45 | 34 | 2,473 | 4,114 | 29,923 | 2 | 3 | 0 | 0 | 27 |
| AMZN | 166 | 46 | 1,169 | 1,709 | 11,596 | 8 | 1 | 0 | 9 | 29 |
| BA | 184 | 58 | 1,125 | 1,990 | 26,096 | 13 | 5 | 0 | 8 | 62 |
| MSFT | 213 | 48 | 941 | 1,537 | 19,282 | 19 | 2 | 2 | 18 | 43 |
| PFE | 195 | 56 | 1,733 | 3,506 | 27,744 | 12 | 16 | 0 | 4 | 54 |
| TSLA | 163 | 59 | 1,267 | 2,271 | 28,835 | 10 | 5 | 1 | 7 | 38 |
| WMT | 146 | 59 | 1,508 | 2,635 | 32,201 | 7 | 4 | 0 | 5 | 46 |
| XOM | 156 | 37 | 1,474 | 2,853 | 22,706 | 11 | 8 | 8 | 11 | 52 |
| **Total** | **1,268** | | | | | **82** | **44** | **11** | **62** | **351** |

---

## Issue Categories

### 1. Empty Heading Chunks (HIGH — Study Confound Risk)

**Count:** 82 chunks across all tickers (6.5% of total)

These are leaf nodes that contain only a section heading wrapped in `<physical_index_N>` markers, with no substantive content. After cosmetic cleaning, they render as a one-line heading with no text.

**Examples:**
| Ticker | Heading | Raw length |
|--------|---------|-----------|
| AMZN | `INDEX` | 46 chars |
| AMZN | `Business and Industry Risks` | 68 chars |
| BA | `THE BOEING COMPANY` | 59 chars |
| MSFT | `GENERAL` | 48 chars |
| XOM | `Europe` | 50 chars |

**Why this is a problem:**
- Participants see a chunk card with a title but essentially no content
- They must decide to select/reject based on zero information
- This measures nothing about HITL retrieval quality — it's just confusing
- Worst-case: participants learn to reject all short chunks, biasing the selection

**Recommendation:** Filter out leaf nodes with `content_full` < 150 chars during tree traversal retrieval. These heading-only nodes serve as structural waypoints in the tree but should not be returned as retrieval results.

---

### 2. Very Long Chunks (MEDIUM — UX Friction)

**Count:** 44 chunks across all tickers (3.5% of total)

Some leaf nodes contain 10,000–32,000 characters of text. These are typically:
- Risk factor sections (e.g., "Business Risks" in AAPL at 29,923 chars)
- Combined financial note sections (e.g., "Pension Benefits" in XOM at 19,237 chars)
- Regulatory/legal sections (e.g., "Legal, Tax, Regulatory" in WMT at 32,201 chars)

**Why this is a problem:**
- Overwhelming for participants to review in a selector card
- The "Show more" toggle reveals a wall of text
- Participants may skim or ignore, reducing HITL selection quality
- Scrolling through 10K+ chars in ChunkDetailView is tedious

**Recommendation:** The `build_tree_index.py` script already splits nodes >8,000 chars at sub-heading boundaries (lines 522-604). However, some sections lack sub-headings. Consider:
- Lowering the split threshold to 5,000 chars
- Adding paragraph-boundary splitting as a fallback when no sub-headings exist
- Or: accept these as-is and document that long chunks are a known limitation

---

### 3. Duplicate Headings (LOW — Participant Confusion)

**Count:** 62 duplicate heading groups across all tickers

Multiple leaf nodes share the same heading. Most common:
| Heading | Tickers | Max count |
|---------|---------|-----------|
| `Fiscal Year 2024 Compared with Fiscal Year 2023` | MSFT | 6x |
| `Backlog` | BA | 5x |
| `Energy Generation and Storage Segment` | TSLA | 4x |
| `More Personal Computing` | MSFT | 4x |
| `Business Environment and Trends` / `Revenues` | BA | 4x each |

**Why this is a problem:**
- In the selector card, participants see multiple chunks with the same title
- They can't distinguish them without reading the content
- Reduces efficiency of title-based scanning

**Recommendation:** Append parent context to duplicate headings. For example:
- `Revenues` → `Revenues (Commercial Airplanes)` vs `Revenues (Defense & Space)`
- `2023` → `2023 (United States)` vs `2023 (Europe)`

This would require a post-processing step in `build_tree_index.py` to detect and disambiguate.

---

### 4. Truncated Sentences (LOW — Rare)

**Count:** 11 across all tickers (0.9% of total)

Only XOM (8), MSFT (2), and TSLA (1) have chunks that end mid-sentence. Most of XOM's truncations end with a line like `MANAGEMENT'S DISCUSSION AND ANALYSIS OF FINANCIAL CONDITION AND RESULTS OF OPERATIONS` — likely a section header that got appended as a footer.

**Recommendation:** Acceptable for study. Cosmetically unpleasant but rare enough to not confound results.

---

### 5. Mid-Sentence Starts (NONE)

Zero chunks across all tickers start mid-sentence. The tree index chunking correctly begins each node at a heading boundary.

---

### 6. Formatting Artifacts (HANDLED)

| Artifact | Prevalence | Status |
|----------|-----------|--------|
| `<physical_index_N>` markers | ~95% of chunks | Stripped by `cleanChunkPreview` / `cleanChunkMarkdown` |
| `##` / `###` markdown headers | ~96% of chunks | Stripped by `cleanChunkPreview`, kept by `cleanChunkMarkdown` |
| `\|` pipe tables (GFM) | ~28% of chunks | Rendered by `remark-gfm` plugin in `FormattedMarkdown` |
| Embedded footer lines | Only AAPL (27) + PFE (10) | Stripped by `stripFooterLines` |

All formatting artifacts are handled at display time. No changes needed to the tree index.

---

## Risk Assessment for Study

| Issue | Severity | Impact on Study | Fix Effort |
|-------|----------|----------------|------------|
| Empty heading chunks | **HIGH** | Confounds HITL-R selection task | Low — filter in `tree_service.py` |
| Very long chunks | **MEDIUM** | UX friction, reduced review quality | Medium — adjust split threshold |
| Duplicate headings | **LOW** | Minor confusion | Medium — post-processing step |
| Truncated sentences | **LOW** | Cosmetic, very rare | N/A |
| Formatting artifacts | **RESOLVED** | Was cosmetic, now cleaned | Done |

---

## Recommended Actions Before Study Launch

### Must-fix (blocks study)
1. **Filter empty heading chunks** from retrieval results. Add a minimum content length check (~150 chars after cleaning) in `tree_service.py` before returning nodes to the frontend.

### Should-fix (improves data quality)
2. **Lower the large-node split threshold** in `build_tree_index.py` from 8,000 to 5,000 chars, with paragraph-boundary fallback splitting.
3. **Disambiguate duplicate headings** by prepending parent section context.

### Nice-to-have
4. **Rebuild tree indexes** for all 8 tickers after applying fixes #2 and #3.

---

## Appendix: Per-Ticker Breakdown

### AAPL (45 leaves)
- Cleanest index overall. Only 2 short chunks, 0 truncations.
- 3 very long risk-factor sections (12K–30K chars).
- Only ticker with significant footer line artifacts (27 chunks), handled by display cleaning.

### AMZN (166 leaves)
- 8 empty heading chunks (INDEX, Business and Industry Risks, Operating Risks, etc.)
- 9 duplicate heading groups (Overview x2, Income Taxes x3, etc.)
- Well-split overall — only 1 chunk >10K.

### BA (184 leaves)
- 13 empty heading chunks — most of any ticker.
- 5 very long chunks (10K–26K), including Note 4 and Plan Assets.
- 8 duplicate heading groups, with "Backlog" appearing 5 times across segments.

### MSFT (213 leaves)
- Most leaves and most issues. 19 empty heading chunks.
- 18 duplicate heading groups — worst of all tickers. "Fiscal Year 2024 Compared with Fiscal Year 2023" appears 6 times.
- 2 truncated sentences in PART III/IV (table of contents entries).

### PFE (195 leaves)
- 16 very long chunks — worst of all tickers. Several 10K–28K.
- 12 empty heading chunks. Risk category headers are heading-only nodes.
- Only ticker besides AAPL with footer line artifacts (10 chunks).

### TSLA (163 leaves)
- 10 empty heading chunks. 1 truncated sentence (table row cutoff).
- 5 very long chunks, including a 28K risk section.
- 7 duplicate heading groups.

### WMT (146 leaves)
- Relatively clean. 7 short chunks, 4 long chunks.
- Contains the single longest chunk across all tickers: "Legal, Tax, Regulatory, Compliance, Reputational and Other Risks" at 32,201 chars.

### XOM (156 leaves)
- 8 truncated sentences — worst of all tickers. Most are footer-style artifacts from the MD&A section.
- 11 duplicate heading groups including geographic names (United States x2, Canada x2, etc.) and year headers (2023 x3, 2022 x3).
- 8 very long chunks including Oil and Gas Reserves at 22,706 chars.
