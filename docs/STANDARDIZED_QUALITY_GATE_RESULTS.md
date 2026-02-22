# Standardized Quality Gate Results

**Date:** 2026-02-22
**Configuration:** Consistent across all tickers
- `--top-k`: 10
- `--pass-rate-threshold`: 0.80 (80%)
- `--max-page-index-gap`: 11
- `--max-missing-physical-ratio`: 0.15
- `--max-consecutive-missing-physical`: 5
- `--min-item1a-children`: 3

**Purpose:** Ensure consistent evaluation criteria across all tickers for fair comparison

---

## Executive Summary

**Overall Pass Rate:** 4/8 tickers (50.0%)

### ✅ PASSING (4 tickers)

| Ticker | Retrieval Pass Rate | Gap from 80% | Notes |
|--------|---------------------|--------------|-------|
| **WMT** | 100.0% (8/8) | +20.0% | Perfect score, all structural checks pass |
| **AMZN** | 93.3% (14/15) | +13.3% | Excellent, all checks pass |
| **AAPL** | 88.2% (15/17) | +8.2% | Strong, all checks pass |
| **MSFT** | 80.0% (8/10) | +0.0% | **Exactly at threshold**, all checks pass |

### ❌ FAILING (4 tickers)

| Ticker | Retrieval Pass Rate | Gap from 80% | Failure Reason |
|--------|---------------------|--------------|----------------|
| **BA** | 100.0% (8/8) | +20.0% | ⚠️ Physical index continuity (10 consecutive missing pages) |
| **XOM** | 77.8% (7/9) | -2.2% | Missing Item 1 heading + retrieval below threshold |
| **PFE** | 75.0% (6/8) | -5.0% | Retrieval below threshold |
| **TSLA** | 75.0% (6/8) | -5.0% | Retrieval below threshold |

---

## Key Findings

### 1. MSFT Now Passes (Exactly at Threshold)

With the **80% threshold**, MSFT passes with **exactly 80.0%** pass rate (8/10 cases).

**Impact:**
- Previous 85% threshold: ❌ FAILED
- New 80% threshold: ✅ PASSED
- **No margin for error** - any regression will cause failure

**Risk:** HIGH - MSFT is at the exact threshold
**Recommendation:** Monitor MSFT closely for any regressions

---

### 2. BA Has Perfect Retrieval But Fails Structural Check

**Paradox:** BA achieves **100%** retrieval pass rate but fails overall due to physical index continuity.

**Issue:** 10 consecutive missing pages (54-63)
- Exceeds `max_consecutive_missing_physical: 5`
- But retrieval works perfectly (8/8 cases)

**Interpretation:**
- Pages 54-63 likely figures/exhibits (not indexed separately)
- Content is extracted and searchable (hence 100% retrieval)
- Structural check is too strict

**Options:**
1. **Increase consecutive threshold to 10** → BA passes
2. **Make physical continuity advisory-only** → BA passes
3. **Accept BA with caveat** → Document known gap

**Recommendation:** Option 2 (advisory) or Option 3 (accept with caveat)
- Retrieval quality proves content is accessible
- 10-page gap doesn't affect functionality

---

### 3. PFE and TSLA at 75% (5% Below Threshold)

Both tickers achieve **exactly 75%** pass rate (6/8 cases).

**Gap analysis:**
- Need 1 more case to pass → 7/8 = 87.5% ✅
- Currently: 6/8 = 75.0% ❌
- **5% below threshold**

**Options:**
1. **Lower threshold to 75%** → Both pass
2. **Improve eval cases** → May improve pass rate
3. **Increase top-k to 15** → May help some cases
4. **Accept as failing** → Use only 4 passing tickers

**Trade-off:**
- Lower to 75%: Adds 2 tickers but reduces quality bar
- Keep at 80%: Maintains quality but limits ticker diversity (only 4 tickers)

---

### 4. XOM at 77.8% (2.2% Below Threshold)

XOM is **close to passing** with 77.8% (7/9 cases).

**Dual failure:**
- Missing Item 1 heading (structural)
- 77.8% < 80% threshold (retrieval)

**Gap analysis:**
- Need 1 more case → 8/9 = 88.9% ✅
- Currently: 7/9 = 77.8% ❌

**Caveat:** Even if retrieval passes, structural check (missing Item 1) would still fail

**Recommendation:**
- Investigate Item 1 in source PDF
- If legitimately missing: waive heading check
- If extraction failure: fix extraction

---

## Detailed Results by Ticker

### AAPL - ✅ PASSED

| Metric | Value | Status |
|--------|-------|--------|
| Retrieval pass rate | 88.2% (15/17) | ✅ PASS (+8.2%) |
| Required headings | All present | ✅ PASS |
| Item 1A children | 3 | ✅ PASS |
| Physical continuity | 10% missing (6/60) | ✅ PASS |
| Page gaps | 0 | ✅ PASS |

**Failed cases:** 2/17
- 2 retrieval cases failed (must_include violations)

**Risk:** LOW - Strong performance with good margin

---

### AMZN - ✅ PASSED

| Metric | Value | Status |
|--------|-------|--------|
| Retrieval pass rate | 93.3% (14/15) | ✅ PASS (+13.3%) |
| Required headings | All present | ✅ PASS |
| Item 1A children | 27 (highest) | ✅ PASS |
| Physical continuity | 4.17% missing (5/120) | ✅ PASS |
| Page gaps | 0 | ✅ PASS |

**Failed cases:** 1/15
- AWS revenue query (cross-section case)

**Risk:** VERY LOW - Excellent performance across all metrics

---

### BA - ❌ FAILED (Structural Only)

| Metric | Value | Status |
|--------|-------|--------|
| Retrieval pass rate | 100.0% (8/8) | ✅ PASS (+20.0%) |
| Required headings | All present | ✅ PASS |
| Item 1A children | 10 | ✅ PASS |
| Physical continuity | **9.85% missing, 10 consecutive** | ❌ **FAIL** |
| Page gaps | 3 gaps (max 11) | ✅ PASS |

**Failed cases:** 0/8 (perfect retrieval!)

**Issue:** 10 consecutive missing pages exceeds threshold of 5

**Paradox:** Perfect retrieval despite structural gap

**Risk:** MEDIUM - Structural issue doesn't affect retrieval quality

---

### MSFT - ✅ PASSED (At Threshold)

| Metric | Value | Status |
|--------|-------|--------|
| Retrieval pass rate | 80.0% (8/10) | ✅ PASS (exactly 80%) |
| Required headings | All present | ✅ PASS |
| Item 1A children | 16 | ✅ PASS |
| Physical continuity | 4.04% missing (4/99) | ✅ PASS |
| Page gaps | 0 | ✅ PASS |

**Failed cases:** 2/10
- Segment information query
- General risks control query

**Risk:** HIGH - Zero margin, any regression causes failure

---

### PFE - ❌ FAILED

| Metric | Value | Status |
|--------|-------|--------|
| Retrieval pass rate | 75.0% (6/8) | ❌ FAIL (-5.0%) |
| Required headings | All present | ✅ PASS |
| Item 1A children | 6 | ✅ PASS |
| Physical continuity | 0% missing | ✅ PASS |
| Page gaps | 2 gaps (max 7) | ✅ PASS |

**Failed cases:** 2/8
- 2 must_include violations

**Risk:** MEDIUM - Close to threshold, 1 more case would pass

---

### TSLA - ❌ FAILED

| Metric | Value | Status |
|--------|-------|--------|
| Retrieval pass rate | 75.0% (6/8) | ❌ FAIL (-5.0%) |
| Required headings | All present | ✅ PASS |
| Item 1A children | 8 | ✅ PASS |
| Physical continuity | 1.06% missing (1/94) | ✅ PASS |
| Page gaps | 0 | ✅ PASS |

**Failed cases:** 2/8
- 2 must_include violations

**Risk:** MEDIUM - Close to threshold, 1 more case would pass

---

### WMT - ✅ PASSED (Perfect Score)

| Metric | Value | Status |
|--------|-------|--------|
| Retrieval pass rate | 100.0% (8/8) | ✅ PASS (+20.0%) |
| Required headings | All present | ✅ PASS |
| Item 1A children | 19 | ✅ PASS |
| Physical continuity | 0% missing | ✅ PASS |
| Page gaps | 0 | ✅ PASS |

**Failed cases:** 0/8 (perfect!)

**Risk:** VERY LOW - Perfect performance

---

### XOM - ❌ FAILED

| Metric | Value | Status |
|--------|-------|--------|
| Retrieval pass rate | 77.8% (7/9) | ❌ FAIL (-2.2%) |
| Required headings | **Missing Item 1, Item 8** | ❌ **FAIL** |
| Item 1A children | 4 | ✅ PASS |
| Physical continuity | 0% missing | ✅ PASS |
| Page gaps | 0 | ✅ PASS |

**Failed cases:** 2/9
- 2 must_include violations

**Dual failure:** Structural (missing headings) + retrieval (below threshold)

**Risk:** MEDIUM-HIGH - Requires verification of missing Item 1

---

## Comparison: Variable vs Standardized Thresholds

### Previous Results (Variable Configuration)

| Ticker | Config | Result | Pass Rate |
|--------|--------|--------|-----------|
| AAPL | top-k=5, 85% | ✅ PASS | 94.1% |
| AMZN | top-k=10, 75% | ✅ PASS | 93.3% |
| WMT | top-k=5, 75% | ✅ PASS | 87.5% |
| BA | top-k=5, 75% | ⚠️ Advisory | 87.5% |
| TSLA | top-k=10, 75% | ✅ PASS | 75.0% |
| PFE | top-k=5, 75% | ⚠️ Advisory | 75.0% |
| MSFT | top-k=10, 85% | ❌ FAIL | 80.0% |
| XOM | top-k=10, 75% | ⚠️ Structural | 77.8% |

**Issues with variable config:**
- Inconsistent standards across tickers
- Hard to compare performance
- Some tickers "pass" only because of lower threshold

---

### Standardized Results (top-k=10, 80%)

| Ticker | Result | Pass Rate | Change |
|--------|--------|-----------|--------|
| AAPL | ✅ PASS | 88.2% | -5.9% (different test run) |
| AMZN | ✅ PASS | 93.3% | Same |
| WMT | ✅ PASS | 100.0% | +12.5% |
| BA | ❌ FAIL | 100.0% | Structural only |
| TSLA | ❌ FAIL | 75.0% | Same |
| PFE | ❌ FAIL | 75.0% | Same |
| MSFT | ✅ PASS | 80.0% | Same |
| XOM | ❌ FAIL | 77.8% | Same |

**Benefits of standardized config:**
- ✅ Fair comparison across all tickers
- ✅ Consistent quality bar (80%)
- ✅ MSFT now passes (at 80% threshold)
- ✅ Clear pass/fail criteria

**Trade-offs:**
- ❌ Only 4/8 tickers pass (vs 5-7 with variable config)
- ❌ PFE and TSLA fail at 80% (passed at 75%)
- ❌ BA fails on structural despite perfect retrieval

---

## Recommendations

### Option 1: Keep 80% Threshold (Quality-Focused)

**Passing tickers:** 4 (AAPL, AMZN, MSFT, WMT)

**Pros:**
- High quality bar ensures reliability
- Consistent standard across all tickers
- MSFT included (80% exactly)

**Cons:**
- Limited ticker diversity (only 4)
- MSFT has zero margin for error
- Excludes PFE/TSLA which are close (75%)

**Risk:** MEDIUM
- MSFT regression would drop to 3 tickers
- BA excluded despite perfect retrieval

**Recommended for:** Production systems, critical applications

---

### Option 2: Lower to 75% Threshold (Diversity-Focused)

**Passing tickers:** 6 (AAPL, AMZN, MSFT, WMT, PFE, TSLA)

**Pros:**
- Adds 2 more tickers (better diversity)
- All 6 have decent quality (75-100%)
- More options for user study

**Cons:**
- 75% = 1 in 4 queries fail
- Lower quality bar
- TSLA/PFE exactly at threshold (no margin)

**Risk:** MEDIUM-HIGH
- 25% failure rate may not be acceptable
- 3 tickers at exact threshold (fragile)

**Recommended for:** Research, user studies, exploration

---

### Option 3: Tiered System (Balanced)

**Tier 1 (80%+):** AAPL, AMZN, MSFT, WMT (4 tickers)
- Use for primary analysis, highest confidence

**Tier 2 (75-79%):** PFE, TSLA, XOM (3 tickers)
- Use for diversity, document quality caveats

**Tier 3 (Structural only):** BA (1 ticker)
- Use after verification of pages 54-63

**Pros:**
- Flexible based on use case
- Maintains quality tiers
- Maximum ticker availability (7-8)

**Cons:**
- More complex to explain
- Different quality expectations per tier

**Risk:** LOW
- Users understand quality differences
- Can choose tier based on needs

**Recommended for:** Flexible research environments

---

### Option 4: Accept BA with Caveat (Quality + One Exception)

**Passing tickers:** 5 (AAPL, AMZN, MSFT, WMT, **BA**)

**Rationale:**
- BA has 100% retrieval despite structural gap
- 10 consecutive missing pages likely figures/exhibits
- Functional quality proven

**Condition:** Verify pages 54-63 are non-critical content

**Pros:**
- Adds 1 more high-quality ticker
- Balances structural vs functional quality
- BA has perfect retrieval

**Cons:**
- Inconsistent application of structural rules
- Precedent for waiving checks

**Risk:** MEDIUM
- If pages 54-63 are critical content, this is wrong
- May miss real extraction issues

**Recommended for:** After verification of BA's missing pages

---

## Final Recommendation

### For Production / User Study

**Use 4-5 tickers with 80% threshold:**

**Core (Tier 1):**
1. **WMT** - 100% retrieval, perfect structural (highest confidence)
2. **AMZN** - 93% retrieval, 27 Item 1A children (best structure)
3. **AAPL** - 88% retrieval, solid all-around

**Conditional:**
4. **MSFT** - 80% retrieval (exactly at threshold, monitor closely)
5. **BA** - 100% retrieval IF pages 54-63 verified as non-critical

**Rationale:**
- Maintains 80% quality bar
- Provides 4-5 ticker diversity
- All tickers functional and reliable
- MSFT adds tech sector diversity

**Alternative (Conservative):**
- Use only WMT, AMZN, AAPL (3 tickers)
- Highest confidence, no edge cases

**Alternative (Inclusive):**
- Lower threshold to 75%, add PFE and TSLA (6 tickers)
- Document 75% quality level
- Accept 1-in-4 failure rate

---

## Configuration to Use

```python
# Recommended defaults for quality gate
QUALITY_GATE_CONFIG = {
    "top_k": 10,
    "pass_rate_threshold": 0.80,  # Standard threshold
    "min_item1a_children": 3,
    "max_missing_physical_ratio": 0.15,
    "max_consecutive_missing_physical": 5,  # Or 10 if accepting BA
    "max_page_index_gap": 11,
}

# Tickers for production (standard 80% threshold)
PRODUCTION_TICKERS = ["AAPL", "AMZN", "MSFT", "WMT"]  # 4 tickers

# Optional additions
CONDITIONAL_TICKERS = {
    "BA": "requires_verification_pages_54_63",
    "PFE": "75%_threshold_alternative",
    "TSLA": "75%_threshold_alternative",
}
```

---

## Next Actions

1. ✅ **Standardized testing complete** - All 8 tickers tested with same config

2. ⏳ **Decide on threshold:** 75% or 80%?
   - 80%: 4 tickers (quality-focused)
   - 75%: 6 tickers (diversity-focused)

3. ⏳ **Verify BA pages 54-63** - Check if figures or content

4. ⏳ **Verify XOM Item 1** - Check source PDF

5. ⏳ **Select final ticker set** for user study

6. ⏳ **Update quality gate defaults** in code

---

**Status:** Standardized testing complete, decision pending
**Last updated:** 2026-02-22
