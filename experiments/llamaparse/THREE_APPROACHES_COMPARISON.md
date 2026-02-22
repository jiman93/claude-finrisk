# EDGAR PDF Parsing: Three Approaches Compared

**Date:** 2026-02-22
**Test Subject:** MSFT 10-K EDGAR PDF
**Goal:** Extract Item 1A Risk Factors with clean hierarchical structure

---

## Executive Summary

| Approach | Success Rate | Structure Quality | Content Completeness | Speed | Verdict |
|----------|--------------|-------------------|---------------------|-------|---------|
| **PageIndex + Playwright** | ✅ 87.5% (7/8) | ⭐⭐⭐⭐⭐ Excellent | ⭐⭐⭐⭐⭐ Full | ⭐⭐⭐⭐⭐ 5s | **WINNER** |
| **LlamaParse (markdown)** | ⚠️ Unknown | ⭐⭐ Poor | ⭐⭐⭐ Duplicated | ⭐⭐⭐⭐ 5s | ❌ Not viable |
| **LlamaExtract (JSON)** | ⚠️ Unknown | ⭐⭐⭐ Fair | ⭐⭐ Summarized | ⭐⭐ 144s | ⚠️ Needs work |

**Recommendation:** **Stick with Playwright PDFs + PageIndex** for production pipeline

---

## Approach 1: PageIndex + Playwright PDFs

### How It Works
1. Render EDGAR filing as Playwright PDF (with semantic HTML tags)
2. Upload to PageIndex API
3. Get back hierarchical tree structure (JSON)
4. Tree already contains proper PART → Item → subsection hierarchy

### MSFT Results (Playwright PDF)

**Status:** ✅ **SUCCESS**

**Structure:**
```
MSFT 10-K Annual Filing (root)
├── PART I
│   ├── Item 1: Business
│   ├── Item 1A: RISK FACTORS (16 children) ✅
│   │   ├── STRATEGIC AND COMPETITIVE RISKS
│   │   ├── Competition in the technology sector
│   │   ├── CYBERSECURITY, DATA PRIVACY, AND PLATFORM ABUSE RISKS
│   │   ├── Security of our information technology
│   │   ├── Security of our products, services, devices, and customers' data
│   │   ├── OPERATIONAL RISKS
│   │   ├── LEGAL, REGULATORY, AND LITIGATION RISKS
│   │   ├── INTELLECTUAL PROPERTY RISKS
│   │   └── ... (8 more risk subsections)
│   └── Item 1B, 1C, 2, 3, 4...
├── PART II
│   └── Item 5, 6, 7, 7A, 8, 9, 9A, 9B...
├── PART III
└── PART IV
```

**Metrics:**
- Total nodes: 220
- Tree depth: 4
- Item 1A children: **16 subsections** ✅
- Item 1A content: **74,759 characters**
- Processing time: ~5 seconds
- Cost: Free (PageIndex demo tier)

**Quality:**
- ✅ Perfect hierarchy
- ✅ All 16 risk subsections detected
- ✅ Full content (not summarized)
- ✅ Physical page index markers for citations
- ✅ No duplicates
- ✅ Clean, ready-to-use

**Downsides:**
- ❌ Requires Playwright PDF rendering (extra step)
- ❌ Failed on JPM (1/8 tickers) - tree too flat

---

## Approach 2: LlamaParse (Markdown Output)

### How It Works
1. Upload EDGAR PDF directly to LlamaParse
2. Get back markdown text with headings
3. Must chunk markdown → build tree manually

### MSFT Results (EDGAR PDF)

**Status:** ⚠️ **PARTIAL SUCCESS** (Item 1A found, but messy)

**Output Sample:**
```markdown
# SEC 10-K Annual Filing

## Table of Contents
- Item 1A. Risk Factors
...
---

## PART I

### Item 1A. Risk Factors

*This section is not provided in the current text.*

---

# SEC 10-K Annual Filing

## Table of Contents
- Item 1A: Risk Factors
...
```

**Issues Found:**
1. **Massive duplication**
   - 634 markdown headings total
   - Multiple TOC entries (Item 1A mentioned 64 times!)
   - Actual Item 1A content appears ~3 times in different formats

2. **Mixed content quality**
   - Line 890: "Item 1A. Risk Factors" → *"This section is not provided"*
   - Line 1417: "Item 1A: Risk Factors" → Actual content ✅
   - Multiple versions scattered throughout 509k chars

3. **Chunking disaster**
   - MarkdownNodeParser creates 635 chunks
   - Median chunk size: 142 chars (too small!)
   - 47% of chunks have incomplete sentences
   - Many chunks are just headings (9-24 chars)

4. **Noise**
   - LlamaIndex error messages mixed in
   - Separator lines (`---`) everywhere
   - Code blocks with raw PDF text
   - "I'm sorry, but I can't access external websites..."

**Metrics:**
- Total chars: 509,187
- TOC occurrences of "Item 1A": 64
- Actual Item 1A sections: ~3 (duplicated)
- Chunks created: 635
- Processing time: ~5 seconds
- Cost: Free (1,000 pages/day tier)

**Quality:**
- ❌ Severe duplication
- ⚠️ Item 1A exists but mixed with noise
- ❌ Chunking produces incomplete sentences
- ❌ Requires heavy preprocessing
- ⚠️ Some versions have content, others say "not provided"

**Verdict:** ❌ **NOT VIABLE** without extensive cleanup pipeline

---

## Approach 3: LlamaExtract (Structured JSON)

### How It Works
1. Upload EDGAR PDF to LlamaCloud
2. Define JSON schema for desired structure (PART → Item → subsections)
3. LLM extracts data matching schema
4. Get back structured JSON with extracted fields

### MSFT Results (EDGAR PDF)

**Status:** ⚠️ **PARTIAL SUCCESS** (extracted but wrong structure)

**Schema Provided:**
```json
{
  "document_metadata": {
    "company_name": "string",
    "fiscal_year_end": "string",
    "form_type": "string"
  },
  "parts": [{
    "part_name": "string",
    "items": [{
      "item_number": "string",
      "item_title": "string",
      "content": "string",
      "subsections": [{"heading": "string", "content": "string"}]
    }]
  }],
  "item_1a_risk_factors": {
    "risk_categories": [{
      "category_name": "string",
      "risks": [{"risk_heading": "string", "risk_description": "string"}]
    }]
  }
}
```

**What We Got:**
```json
{
  "document_metadata": {
    "company_name": "MICROSOFT CORPORATION",  // ✅ Correct
    "fiscal_year_end": "June 30, 2024",       // ✅ Correct
    "form_type": "10-K"                       // ✅ Correct
  },
  "parts": [
    // ❌ PROBLEM: 30 separate "parts" instead of 4 (PART I, II, III, IV)
    {
      "part_name": "PART I",
      "items": [{
        "item_number": "1",
        "item_title": "Business",
        "content": "943 chars",               // ⚠️ Summarized, not full
        "subsections": [/* 15 subsections */]
      }]
    },
    {
      "part_name": "PART I",  // ❌ Duplicate PART I
      "items": [{
        "item_number": "Item 1",
        "item_title": "Gaming",
        "content": "427 chars",
        "subsections": [/* 1 */]
      }]
    },
    {
      "part_name": "PART I",  // ❌ Another PART I
      "items": [{
        "item_number": "Item 1A",
        "item_title": "Risk Factors",
        "content": "575 chars",               // ⚠️ Summarized
        "subsections": [/* Only 1! */]
      }]
    },
    {
      "part_name": "PART I",
      "items": [{
        "item_number": "Item 1A",  // ❌ Separate Item 1A entry #2
        "item_title": "Risks Relating to the Evolution of Our Business",
        "content": "545 chars",
        "subsections": []
      }]
    },
    {
      "part_name": "PART I",
      "items": [{
        "item_number": "Item 1A",  // ❌ Separate Item 1A entry #3
        "item_title": "Cybersecurity, Data Privacy, and Platform Abuse Risks",
        "content": "538 chars",
        "subsections": [/* 1 */]
      }]
    }
    // ... 25 more "parts"
  ],
  "item_1a_risk_factors": null  // ❌ LLM ignored this schema field entirely
}
```

**Problems:**
1. **Flat structure** - Created 30 separate "parts" instead of nesting items within 4 parts
2. **Item 1A fragmented** - Split into 3+ separate entries instead of 1 with children
3. **Content summarized** - Only 200-600 chars per item (should be 74k+ for full Item 1A)
4. **Schema ignored** - `item_1a_risk_factors` returned as null
5. **Limited subsections** - Only 1 subsection per item (PageIndex found 16!)

**Metrics:**
- Extraction time: **144 seconds** (2.4 minutes) ⚠️
- Cost: Free tier (1,000 pages/day)
- Model used: `openai-gpt-4-1` (BALANCED mode)
- Total "parts" extracted: 30 (should be 4)
- Item 1A entries: 3 separate items (should be 1 with 16 children)
- Content per item: 200-900 chars (summarized, not verbatim)

**Quality:**
- ✅ Document metadata correct
- ⚠️ Structure partially correct (found items) but flat
- ❌ Item 1A split into multiple entries
- ❌ Content heavily summarized (not usable for full text retrieval)
- ❌ Slow (144s vs 5s for other methods)
- ⚠️ Schema interpretation unexpected

**Why It Failed:**
- Schema too complex/ambiguous - LLM couldn't figure out proper nesting
- BALANCED mode may prioritize summaries over verbatim extraction
- LLM chose to interpret each major section as a separate "part"
- Async processing adds latency (144s wait time)

**Potential Improvements:**
- ⚠️ Try PREMIUM mode (higher quality, slower, more expensive)
- ⚠️ Simplify schema (fewer nested levels)
- ⚠️ Add explicit `system_prompt` instructions
- ⚠️ Use `PER_PAGE` extraction target instead of `PER_DOC`
- ❓ Still unclear if it can produce verbatim text or only summaries

---

## Side-by-Side Comparison: Item 1A Detection

| Metric | PageIndex (Playwright) | LlamaParse (Markdown) | LlamaExtract (JSON) |
|--------|------------------------|----------------------|---------------------|
| **Item 1A Found?** | ✅ Yes | ⚠️ Yes (buried in duplicates) | ⚠️ Yes (fragmented) |
| **Structure** | Perfect hierarchy (1 parent, 16 children) | Flat markdown (multiple duplicates) | Flat array (3 separate entries) |
| **Subsections** | 16 detected | 64 TOC mentions, unclear how many real | 3 entries, 0-1 subsections each |
| **Content Size** | 74,759 chars (full) | 509k chars (w/ duplicates + noise) | ~1,700 chars total (summarized) |
| **Content Quality** | ✅ Verbatim text | ⚠️ Verbatim but duplicated | ❌ Summarized (200-600 chars/entry) |
| **Page Citations** | ✅ `physical_index` markers | ⚠️ Page markers exist (duplicated) | ❌ None |
| **Duplicates** | ✅ None | ❌ Severe (entire sections repeated 3x) | ✅ None |
| **Noise** | ✅ Clean | ❌ Error messages, separators, code blocks | ✅ Clean |
| **Processing Time** | 5 seconds | 5 seconds | **144 seconds** |
| **Ready to Use?** | ✅ Yes | ❌ No (needs cleanup pipeline) | ❌ No (content too short, structure wrong) |

---

## Decision Matrix

### Use **PageIndex + Playwright** if:
- ✅ You can render Playwright PDFs (extra step but worth it)
- ✅ You need hierarchical tree structure ready to use
- ✅ You want full verbatim content (not summaries)
- ✅ You need it fast (5 seconds)
- ✅ 87.5% success rate is acceptable (7/8 tickers worked)

### Use **LlamaParse** if:
- ❌ Don't use this - too messy for production
- ⚠️ Maybe for one-off debugging if PageIndex fails completely
- ⚠️ Only if you're willing to build heavy preprocessing pipeline

### Use **LlamaExtract** if:
- ⚠️ You're extracting simple metadata only (company name, dates, etc.)
- ⚠️ You don't need verbatim text (summaries are OK)
- ⚠️ You have time to wait (2-3 minutes per document)
- ⚠️ You can iterate on schema design and prompts
- ❌ NOT for full-text retrieval use cases

---

## Recommendation

**✅ PROCEED WITH PAGEINDEX + PLAYWRIGHT FOR 7 TICKERS**

**Rationale:**
1. **Proven quality** - 7/8 tickers have perfect tree structure
2. **Fast** - 5 second processing (vs 144s for LlamaExtract)
3. **Complete** - Full verbatim text, not summaries
4. **Clean** - No duplicates, no noise, ready to use
5. **Cost** - Free tier sufficient
6. **Citations** - Physical page index preserved

**For the 1 failing ticker (JPM):**

**Option A:** Fix JPM manually
- Investigate why PageIndex flattened JPM's structure
- Try EDGAR vs Playwright for JPM
- Build custom parser for JPM if needed
- Timeline: 2-4 hours

**Option B:** Exclude JPM
- Proceed with 7 tickers only
- Still covers diverse industries
- Saves time, avoids edge case
- Timeline: 0 hours

**Option C:** Try LlamaExtract for JPM only
- Last resort if PageIndex can't handle JPM at all
- Expect to spend time on schema iteration
- May still get summarized content
- Timeline: 4-8 hours

---

## Next Steps

1. **Decision needed:** How to handle JPM?
2. **If proceeding with 7 tickers:**
   - Finalize tree structures ✅ (already done)
   - Run quality gates on all 7
   - Create eval sets
   - Test retrieval pipeline end-to-end
3. **If exploring LlamaExtract further:**
   - Simplify schema (single level, no nesting)
   - Try PREMIUM mode
   - Test on JPM specifically
   - Compare with PageIndex quality

---

**Files Referenced:**
- PageIndex results: `experiments/llamaparse/PLAYWRIGHT_BATCH_RESULTS.md`
- LlamaParse markdown: `experiments/llamaparse/data/MSFT_llamaparse_20260221T160523Z.md`
- LlamaExtract results: `experiments/llamaparse/data/MSFT_extract_results.json`
- Chunking test: Output from `test_chunking.py` showing 635 chunks with 47% incomplete

**Bottom Line:** PageIndex + Playwright is **significantly better** for this use case. LlamaExtract is interesting but not suitable for full-text hierarchical extraction.
