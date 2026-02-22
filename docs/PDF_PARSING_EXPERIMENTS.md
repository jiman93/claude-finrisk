# PDF Parsing Experiments: Issues & Limitations

**Date:** 2026-02-22
**Status:** Active Investigation
**Goal:** Find reliable method to extract hierarchical 10-K structure with Item 1A Risk Factors

---

## Executive Summary

Tested 3 approaches for parsing SEC 10-K filings into hierarchical structures:
- ✅ **PageIndex + Playwright PDFs**: 87.5% success rate (7/8 tickers)
- ❌ **LlamaParse (markdown)**: Severe duplication issues, not viable
- ⚠️ **LlamaExtract (JSON)**: Summarizes content, wrong structure, slow

**Recommendation:** Use PageIndex + Playwright for production pipeline

---

## Ticker-Specific Issues

### JPM (JPMorgan Chase) - FAILED

**Issue:** PageIndex created flat tree structure with 484 nodes, Item 1A not detected

**Root Cause:**
- PDF size: **3.3MB** (largest in batch, ~300+ pages)
- PageIndex flattened all risk factors as top-level nodes instead of children of Item 1A
- Result: 484 nodes at depth 1-2, no hierarchical structure

**Evidence:**
```
Top-level structure (JPM):
  - Regulatory (0 children)
  - Political (0 children)
  - Market (0 children)
  - Credit (0 children)
  - Liquidity (0 children)
  ... (50+ more flat nodes)

Expected structure:
  - PART I
    - Item 1A. Risk Factors (with risk categories as children)
```

**Decision:** Dropped JPM from ticker list due to size/complexity

---

### META (Meta Platforms) - FAILED

**Issue:** PageIndex extracted only 1 node ("FORM 10-K"), completely missing all sections including Item 1A

**Root Cause Analysis:**

1. **HTML Format Issue**
   - Downloaded HTML is **iXBRL format** (inline XBRL)
   - File contains primarily financial data markup, not human-readable content
   - Only 1 mention of "Item 1A" in entire 2.3MB file (in metadata only)

2. **PageIndex Response**
   ```json
   {
     "doc_id": "pi-cmlx5b0yp00sf0dqpmgyhcy62",
     "status": "completed",
     "retrieval_ready": false,
     "result": [
       {
         "title": "FORM 10-K",
         "children": []
       }
     ]
   }
   ```
   - Only 1 item extracted vs 26 items for working files like MSFT
   - No document structure detected at all

3. **Comparison with Working Ticker (MSFT)**
   ```
   MSFT Playwright:
     - HTML: Traditional readable format
     - PageIndex result: 26 items (all sections detected)
     - Item 1A: Present at position 5

   META Playwright:
     - HTML: iXBRL format (financial data markup)
     - PageIndex result: 1 item (only title)
     - Item 1A: Missing completely
   ```

**Why META Uses iXBRL:**
- Meta's primary 10-K document (`meta-20241231.htm`) is structured as iXBRL
- iXBRL embeds financial data tags in HTML for machine readability
- Not designed for human reading or hierarchical section extraction
- PageIndex/Playwright cannot parse structured sections from this format

**Decision:** Dropped META, testing Amazon as replacement

**Files for Reference:**
- HTML: `data/10k_html/META_10-K_2025-01-30_0001326801-25-000017.html` (2.3MB iXBRL)
- PDF: `data/playwright_10_pdfs/META_10-K_2025-01-30_0001326801-25-000017.pdf` (1.7MB)
- Raw PageIndex response: `data/debug/META_raw.json`

---

## LlamaParse Limitations

**Tested on:** MSFT EDGAR PDF (native SEC PDF, not Playwright)

### Issue 1: Severe Content Duplication

**Findings:**
- 509,187 total characters in markdown output
- 64 mentions of "Item 1A" (mostly duplicate TOC entries)
- Same sections appear 3+ times throughout document
- Mixed quality: some sections have content, others say "This section is not provided in the current text"

**Example:**
```markdown
## Table of Contents
- Item 1A. Risk Factors
...

### Item 1A. Risk Factors
*This section is not provided in the current text.*

... (later in document)

### Item 1A: Risk Factors
Our AI systems offer users powerful tools... (actual content)
```

### Issue 2: Chunking Produces Incomplete Sentences

**Test Results:**
- Used `MarkdownNodeParser` for semantic chunking
- Created **635 chunks** from 509k chars
- Median chunk size: **142 characters** (too small)
- **47% of chunks** (299/635) have possible mid-sentence cuts
- Many chunks are just headings (9-24 chars) with no content

**Statistics:**
```
Min chunk: 9 chars
Max chunk: 8,973 chars
Median: 142 chars
Chunks with complete sentences: 336/635 (53%)
Chunks with possible cuts: 299/635 (47%)
```

### Issue 3: Mixed Noise in Output

- LlamaIndex error messages: "I'm sorry, but I can't access external websites..."
- Separator lines (`---`) creating artificial boundaries
- Code blocks with raw PDF text
- Duplicate TOC sections

**Verdict:** ❌ **NOT VIABLE** for production without extensive preprocessing pipeline

**Files for Reference:**
- Markdown output: `experiments/llamaparse/data/MSFT_llamaparse_20260221T160523Z.md` (509KB)
- Chunking test results: Output from `test_chunking.py`
- Comparison doc: `experiments/llamaparse/docs/comparison.md`

---

## LlamaExtract Limitations

**Tested on:** MSFT EDGAR PDF with structured JSON schema

### Issue 1: Content Summarization (Not Verbatim)

**Schema Requested:**
```json
{
  "parts": [{
    "part_name": "string",
    "items": [{
      "item_number": "string",
      "item_title": "string",
      "content": "string",  // Expected: Full verbatim text
      "subsections": [...]
    }]
  }]
}
```

**What We Got:**
- Item content: **200-600 characters** per section (heavily summarized)
- Expected: **74,000+ characters** for full Item 1A
- LLM extracted summaries instead of verbatim content
- Not suitable for full-text retrieval use case

**Example:**
```json
{
  "item_number": "Item 1A",
  "item_title": "Risk Factors",
  "content": "Microsoft's operations face risks including intense competition across markets and technology sectors, rapid industry evolution with frequent product introductions..." (575 chars)
}
```

vs PageIndex verbatim:
```
Item 1A char count: 74,759 characters (full text)
```

### Issue 2: Incorrect Structure (Flat Instead of Hierarchical)

**Schema Interpretation Issue:**
- Requested: 4 PART nodes, each containing multiple Items
- Got: **30 separate "parts"** in flat array
- Item 1A split into **3 separate entries** instead of 1 with 16 children

**Actual Output:**
```json
{
  "parts": [
    {"part_name": "PART I", "items": [{"item_number": "1", "item_title": "Business"}]},
    {"part_name": "PART I", "items": [{"item_number": "Item 1", "item_title": "Gaming"}]},
    {"part_name": "PART I", "items": [{"item_number": "Item 1A", "item_title": "Risk Factors"}]},
    {"part_name": "PART I", "items": [{"item_number": "Item 1A", "item_title": "Risks Relating to Evolution"}]},
    // ... 26 more parts
  ]
}
```

### Issue 3: Ignored Schema Fields

**Schema provided:**
```json
{
  "item_1a_risk_factors": {
    "risk_categories": [...]
  }
}
```

**Result:** `null` - LLM completely ignored this field

### Issue 4: Slow Processing

- **144 seconds** (2.4 minutes) per document
- vs **5 seconds** for PageIndex
- vs **5 seconds** for LlamaParse markdown

**Extraction Config Used:**
```python
ExtractConfig(
    extraction_mode=ExtractMode.BALANCED,  # FAST, BALANCED, PREMIUM
    cite_sources=True,
    model="openai-gpt-4-1"
)
```

**Verdict:** ⚠️ **SUITABLE FOR METADATA ONLY**, not for full-text hierarchical extraction

**Use Cases Where It Works:**
- Extracting simple fields (company name, dates, form type) ✅
- Summarizing content (if summaries are acceptable) ✅
- Metadata extraction ✅

**NOT Suitable For:**
- Full verbatim text extraction ❌
- Complex hierarchical structures ❌
- Time-sensitive workflows ❌
- Cases where structure matters more than content ❌

**Files for Reference:**
- Extraction results: `experiments/llamaparse/data/MSFT_extract_results.json`
- Schema definition: `experiments/llamaparse/scripts/extract_with_llamacloud.py`
- Comparison: `experiments/llamaparse/THREE_APPROACHES_COMPARISON.md`

---

## Known PageIndex Behaviors

### `retrieval_ready: False` is Normal

**Finding:** All PageIndex responses show `retrieval_ready: false`, even for working tickers

**Evidence:**
```json
// MSFT (works perfectly)
{
  "retrieval_ready": false,
  "status": "completed",
  "result": [26 items with full structure]
}

// META (failed)
{
  "retrieval_ready": false,
  "status": "completed",
  "result": [1 item, no structure]
}
```

**Interpretation:**
- `retrieval_ready` relates to PageIndex's retrieval API feature
- Does NOT indicate whether tree extraction is complete
- Safe to ignore for tree building purposes

### Flat Result Array Structure

**Observation:** PageIndex returns flat array of items (all showing 0 children)

**Example (MSFT - working):**
```json
{
  "result": [
    {"title": "Preface", "children": []},
    {"title": "PART I", "children": []},
    {"title": "ITEM 1. BUSINESS", "children": []},
    {"title": "ITEM 1A. RISK FACTORS", "children": []},
    // ... 22 more items
  ]
}
```

**How build_tree_index.py Handles This:**
- Script reconstructs hierarchy from flat list
- Uses level/position to determine parent-child relationships
- Post-processes to create nested structure

**This is normal behavior** - hierarchy is built client-side, not in API response

---

## Comparison Matrix

| Approach | Success Rate | Item 1A Detection | Content Quality | Speed | Production Ready? |
|----------|--------------|-------------------|-----------------|-------|-------------------|
| **PageIndex + Playwright** | 87.5% (7/8) | ✅ 16 subsections | ✅ Full verbatim | ⚡ 5s | ✅ YES |
| **LlamaParse (markdown)** | Unknown | ⚠️ Found but duplicated | ⚠️ Verbatim + noise | ⚡ 5s | ❌ NO |
| **LlamaExtract (JSON)** | Unknown | ⚠️ Split into 3 entries | ❌ Summarized only | 🐌 144s | ❌ NO |

---

## Working Tickers (7/8)

| Ticker | Company | Item 1A Children | Item 1A Size | Tree Depth | Status |
|--------|---------|------------------|--------------|------------|--------|
| AAPL | Apple | 3 | 58,024 chars | 5 | ✅ |
| BA | Boeing | 10 | 49,364 chars | 4 | ✅ |
| MSFT | Microsoft | 16 | 74,759 chars | 4 | ✅ |
| PFE | Pfizer | 6 | 69,509 chars | 5 | ✅ |
| TSLA | Tesla | 8 | 80,730 chars | 5 | ✅ |
| WMT | Walmart | 19 | 92,376 chars | 4 | ✅ |
| XOM | Exxon Mobil | 4 | 29,630 chars | 5 | ✅ |

**Average:** 9.3 children, 64,913 characters

---

## Failed Tickers (2/10)

| Ticker | Issue | Root Cause | Decision |
|--------|-------|------------|----------|
| JPM | Item 1A missing | 300+ pages, PageIndex flattened structure | Dropped |
| META | Only 1 node extracted | iXBRL HTML format incompatible | Dropped, testing AMZN |

---

## Recommendations

### For Production Pipeline

✅ **Use PageIndex + Playwright PDFs**
- 87.5% success rate proven across diverse companies
- Full verbatim content with proper hierarchy
- Fast processing (5 seconds)
- Clean structure ready for LLM traversal

### For Edge Cases

⚠️ **When PageIndex Fails:**
1. Check if PDF > 2.5MB (may be too large)
2. Check if HTML is iXBRL format (not compatible)
3. Try alternative document formats from SEC filing
4. Consider manual tree construction for critical tickers

❌ **Avoid:**
- LlamaParse for production (requires heavy preprocessing)
- LlamaExtract for full-text extraction (summarizes content)

### For Future Work

**Potential Improvements:**
1. Investigate META's filing for alternative readable HTML format
2. Test LlamaExtract in PREMIUM mode (may reduce summarization)
3. Build custom iXBRL parser if needed for specific tickers
4. Create fallback pipeline for large PDFs (>2.5MB)

---

## Next Steps

1. **Test Amazon (AMZN) as JPM/META replacement** ← Current
2. Finalize 8-ticker roster with all Item 1A verified
3. Run quality gates on all tickers
4. Proceed with user study preparation

---

## Files & Artifacts

### Reports
- PageIndex batch results: `experiments/llamaparse/PLAYWRIGHT_BATCH_RESULTS.md`
- Three-way comparison: `experiments/llamaparse/THREE_APPROACHES_COMPARISON.md`

### Debug Data
- META raw PageIndex: `data/debug/META_raw.json`
- MSFT EDGAR raw: `data/debug/MSFT_edgar_raw.json`
- MSFT Playwright raw: `data/debug/MSFT_playwright_raw.json`

### LlamaParse Outputs
- MSFT markdown: `experiments/llamaparse/data/MSFT_llamaparse_*.md`
- Comparison analysis: `experiments/llamaparse/docs/comparison.md`

### LlamaExtract Outputs
- MSFT extraction: `experiments/llamaparse/data/MSFT_extract_results.json`
- Schema script: `experiments/llamaparse/scripts/extract_with_llamacloud.py`

---

**Document Status:** Living document, updated as new findings emerge
**Last Updated:** 2026-02-22
**Next Review:** After Amazon testing
