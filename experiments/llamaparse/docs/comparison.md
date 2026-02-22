# LlamaParse vs PageIndex Comparison

**Test Date:** 2026-02-21
**Tickers Tested:** MSFT (EDGAR + Playwright), AAPL (EDGAR)

---

## Executive Summary

🎉 **LlamaParse is a CLEAR WINNER**

**Key Finding:** LlamaParse successfully extracts Item 1A from MSFT EDGAR PDF where PageIndex completely failed.

---

## Detailed Comparison

### 1. MSFT EDGAR (msft-20240630.pdf)

| Metric | PageIndex | LlamaParse | Winner |
|--------|-----------|------------|---------|
| **Item 1A Detection** | ❌ **NOT FOUND** | ✅ **Found (64 occurrences)** | 🏆 **LlamaParse** |
| **TOC Entries** | 0 | 43 | 🏆 LlamaParse |
| **Page Markers** | Unknown | 105 (range 3-137) | 🏆 LlamaParse |
| **Parse Time** | ~45s (failed) | 77s (success) | - |
| **Total Chars** | N/A | 509,187 | - |

**Verdict:** LlamaParse **fixes the critical EDGAR failure** that PageIndex has.

---

### 2. MSFT Playwright (MSFT_10-K_2024-07-30.pdf)

| Metric | PageIndex | LlamaParse | Winner |
|--------|-----------|------------|---------|
| **Item 1A Detection** | ✅ Found (16 children) | ✅ Found (35 occurrences) | ≈ Tie |
| **TOC Entries** | Good structure | 79 entries | 🏆 LlamaParse (more detail) |
| **Page Markers** | Yes (physical_index) | 80 (range 3-110) | ≈ Tie |
| **Parse Time** | ~60s | 61s | ≈ Tie |
| **Total Chars** | ~468k | 469,214 | ≈ Tie |

**Verdict:** Both work well, LlamaParse has **slightly better TOC extraction**.

---

### 3. AAPL EDGAR (aapl-20240928.pdf)

| Metric | PageIndex | LlamaParse | Winner |
|--------|-----------|------------|---------|
| **Item 1A Detection** | ✅ Found (3 children) | ✅ Found (73 occurrences) | ≈ Both work |
| **TOC Entries** | Partial (gaps noted) | 27 entries | 🏆 LlamaParse |
| **Page Markers** | Gaps (missing 9 pages) | 13 markers (range 1-64) | ≈ Both have gaps |
| **Parse Time** | ~60s | 91.5s | - |
| **Total Chars** | ~185k | 320,640 | 🏆 LlamaParse (more content) |

**Verdict:** Both work, but LlamaParse extracts **74% more content** (320k vs 185k chars).

---

## Comparison Matrix

|                | PageIndex (EDGAR) | PageIndex (Playwright) | LlamaParse (EDGAR) | LlamaParse (Playwright) |
|----------------|-------------------|------------------------|-------------------|------------------------|
| **MSFT Item 1A** | ❌ **FAIL** | ✅ 16 children | ✅ **64 occurrences** | ✅ 35 occurrences |
| **AAPL Item 1A** | ✅ 3 children | ✅ 3 children (Playwright) | ✅ 73 occurrences | Not tested |
| **TOC Quality** | Partial/Missing | Good | **Excellent** | **Excellent** |
| **Page Citations** | physical_index markers | physical_index markers | **Page markers preserved** | **Page markers preserved** |
| **PDF Source** | Requires Playwright | Native HTML | **Native EDGAR** | Native HTML |

---

## Key Advantages of LlamaParse

### 1. ✅ Handles EDGAR PDFs
- **PageIndex fails completely** on MSFT EDGAR (Item 1A not found)
- **LlamaParse succeeds** on same file (64 occurrences found)
- No need for Playwright PDF generation

### 2. ✅ Better Content Extraction
- AAPL EDGAR: 320k chars (LlamaParse) vs 185k chars (PageIndex)
- 74% more content extracted
- Likely capturing sections PageIndex misses

### 3. ✅ Superior TOC Extraction
- MSFT: 43 entries (EDGAR) + 79 entries (Playwright)
- AAPL: 27 entries
- Clean, structured heading extraction

### 4. ✅ Better Page Citations
- Explicit page markers: `[Page 3]`, `[Page 20]`, etc.
- Range coverage: MSFT (3-137), AAPL (1-64)
- Better for user study citation display

### 5. ✅ No Playwright Dependency
- Direct EDGAR PDF ingestion
- Simpler pipeline
- No HTML rendering artifacts

---

## Disadvantages / Limitations

### 1. ⚠️ Slightly Slower
- PageIndex: ~45-60s per document
- LlamaParse: ~60-90s per document
- Not significant for batch processing

### 2. ⚠️ API Deprecation Warning
```
DeprecationWarning: The 'llama-parse' package is deprecated and will no longer receive updates.
Please migrate to the new unified SDK.
```
- Need to migrate to `llama-cloud-py` package
- Migration straightforward per their docs

### 3. ⚠️ Free Tier Limit
- 1,000 pages/day, 7,000 pages/week
- Our 8 tickers (~640 pages) fit comfortably
- Sufficient for user study + iteration

---

## Recommendations

### ✅ **PRIMARY RECOMMENDATION: Use LlamaParse with EDGAR PDFs**

**Reasons:**
1. **Fixes critical PageIndex failure** (MSFT EDGAR)
2. **Better content extraction** (74% more for AAPL)
3. **Superior page citations** for user study
4. **No Playwright needed** - simpler pipeline
5. **Still free** for our use case (640 pages < 1,000/day)

**Action Plan:**
1. ✅ Migrate to `llama-cloud-py` (new unified SDK)
2. Parse all 8 EDGAR PDFs with LlamaParse
3. Adapt `build_tree_index.py` for LlamaParse markdown format
4. Run quality gates and compare with Playwright results

---

### Alternative: Hybrid Approach (Not Recommended)

**Use LlamaParse for EDGAR failures only:**
- MSFT, any ticker where PageIndex fails
- Keep PageIndex + Playwright for tickers that work

**Why NOT recommended:**
- Adds complexity (2 pipelines)
- Inconsistent citation format across tickers
- LlamaParse works universally, no need for hybrid

---

## Next Steps

1. **Migrate to llama-cloud-py**
   ```bash
   pip install llama-cloud-py
   ```

2. **Update parse script** to use new SDK

3. **Parse all 8 tickers**
   ```bash
   for pdf in data/10k_pdfs/*.pdf; do
     python experiments/llamaparse/scripts/parse_with_llamaparse.py "$pdf"
   done
   ```

4. **Build tree adapter**
   - Write `scripts/build_tree_from_llamaparse.py`
   - Parse markdown → extract TOC → build tree structure
   - Map to same TreeNode format as PageIndex

5. **Run quality gates**
   - Compare LlamaParse results with Playwright baseline
   - Expect similar or better pass rates

---

## Conclusion

**LlamaParse is the superior choice for this use case.**

It solves the EDGAR PDF extraction problem that PageIndex has, provides better content coverage, and maintains good page citation quality for the user study—all while staying within the free tier.

**Status:** ✅ **READY TO PROCEED with LlamaParse migration**
