# LlamaParse Quick Start

## 1. Install LlamaParse

```bash
pip install llama-parse
```

## 2. Get Free API Key

1. Go to https://cloud.llamaindex.ai/
2. Sign up (free)
3. Create API key
4. Copy key

## 3. Set API Key

```bash
export LLAMA_CLOUD_API_KEY="llx-..."
```

Or add to your `.env`:
```bash
echo 'LLAMA_CLOUD_API_KEY="llx-..."' >> .env
```

## 4. Parse a 10-K

Test with Walmart (our best Playwright performer):

```bash
python experiments/llamaparse/scripts/parse_with_llamaparse.py \
  data/10k_pdfs/wmt-20240131.pdf \
  --result-type markdown
```

This will:
- Parse the PDF with LlamaParse
- Save to `experiments/llamaparse/data/WMT_llamaparse_*.md`
- Generate metadata JSON

## 5. Inspect the Output

```bash
# Find the output file
ls -lh experiments/llamaparse/data/WMT_*.md

# Inspect it
python experiments/llamaparse/scripts/inspect_output.py \
  experiments/llamaparse/data/WMT_llamaparse_*.md
```

This will show:
- Document stats (chars, lines, words)
- Extracted table of contents
- Page markers (if present)
- Item 1A check
- Sample text

## 6. Compare with Playwright Results

**Playwright WMT (current best):**
- 162 nodes
- 19 Item 1A children
- 87.5% retrieval pass rate

**Questions to answer from LlamaParse output:**
1. ✅ Is Item 1A detected?
2. 🔍 How many risk sub-sections are visible?
3. 📄 Are page numbers preserved?
4. 📊 Is the TOC clean and structured?

## 7. Next Steps

**If LlamaParse looks good:**
1. Parse all 8 tickers
2. Adapt `build_tree_index.py` for LlamaParse format
3. Run quality gates
4. Compare with Playwright results

**If LlamaParse has issues:**
1. Try EDGAR spot check (3 tickers)
2. Stick with Playwright for MVP

## Expected Output

```
PARSE COMPLETE
==============================================================
Ticker: WMT
Duration: 45.2s
Total chars: 1,245,678
Output: experiments/llamaparse/data/WMT_llamaparse_20260221T160000Z.md
==============================================================

INSPECTION
==============================================================
[STATS]
  Characters: 1,245,678
  Lines: 34,567
  Words: 189,234

[TABLE OF CONTENTS] Found 87 entries:
   1. [PART] PART I
   2. [ITEM] Item 1. Business
   3. [ITEM] Item 1A. Risk Factors
   ...

[PAGE MARKERS] Found 162 page markers
  Range: 1 - 162

[ITEM 1A CHECK]
  ✅ Found 1 occurrence of 'Item 1A. Risk Factors'
==============================================================
```

## Cost Tracking

Free tier: 1,000 pages/day

- WMT: ~162 pages
- All 8 tickers: ~640 pages
- **Still free!** ✅
