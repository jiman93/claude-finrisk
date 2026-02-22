# LlamaParse Exploration

Testing LlamaParse as an alternative to PageIndex + Playwright for 10-K document parsing.

## Objective

Compare LlamaParse extraction quality against current Playwright PDF + PageIndex pipeline.

## Test Plan

1. **Parse WMT 10-K** (our best Playwright performer) with LlamaParse
2. **Inspect structure** - TOC extraction, section hierarchy, page citations
3. **Build tree** - Adapt `build_tree_index.py` for LlamaParse output
4. **Compare quality** - Run same eval as WMT Playwright version

## Cost

- **Free tier:** 1,000 pages/day, 7,000 pages/week
- **WMT 10-K:** ~162 pages (well under limit)
- **All 8 tickers:** ~640 pages total (still free)

## Folder Structure

```
experiments/llamaparse/
├── data/           # Parsed outputs from LlamaParse
├── scripts/        # Parse scripts and tree builder adapter
├── results/        # Comparison results vs PageIndex
├── docs/           # Notes and findings
└── README.md       # This file
```

## Files

- `scripts/parse_with_llamaparse.py` - Main parsing script
- `scripts/inspect_output.py` - Inspect parsed structure
- `scripts/build_tree_from_llamaparse.py` - Tree builder adapter
- `docs/comparison.md` - PageIndex vs LlamaParse findings

## Next Steps

1. Get LlamaParse API key (free): https://cloud.llamaindex.ai/
2. Parse WMT 10-K
3. Compare with WMT Playwright results
4. Decide: LlamaParse vs Playwright vs EDGAR
