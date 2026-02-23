# Tree Index Pipeline: Raw → Old → New

How `build_tree_index.py` transforms PageIndex API data into the tree index,
and what the improvements changed. Using AAPL as the example.

---

## Stage 1: Raw PageIndex API Response

**Source:** `GET /doc/{doc_id}/?type=tree`
**What it is:** PageIndex's own structural parse of the PDF. Nested JSON.

```
{
  "doc_id": "pi-cmle2q6rs006h0lpfpbv1nu9p",
  "status": "completed",
  "result": [
    {
      "title": "FORM 10-K",
      "node_id": "0000",
      "page_index": 1,
      "nodes": [
        {
          "title": "Apple Inc.",
          "node_id": "0001",
          "page_index": 1,
          "nodes": [
            {
              "title": "Item 1A. Risk Factors",
              "node_id": "0005",
              "page_index": 8,
              "text": "<physical_index_8>\n### Item 1A. Risk Factors\n...",
              "nodes": [
                { "title": "Macroeconomic and Industry Risks", "node_id": "0006", "page_index": 8,
                  "text": "<physical_index_8>\n#### Macroeconomic and Industry Risks\n\nThe Company's operations..." },
                { "title": "Business Risks", "node_id": "0007", "page_index": 10,
                  "text": "<physical_index_10>\n#### Business Risks\n\nTo remain competitive..." },
                { "title": "Legal and Regulatory Compliance Risks", "node_id": "0008", "page_index": 16,
                  "text": "<physical_index_16>\n#### Legal and Regulatory Compliance Risks\n..." },
                ...
              ]
            },
            ...
          ]
        }
      ]
    }
  ]
}
```

**Key traits:**
- Nesting follows PDF heading structure (arbitrary depth)
- Each node has: `title`, `node_id`, `page_index`, `text` (raw markdown), optional `nodes` (children)
- Text contains `<physical_index_N>` page markers, `###`/`####` markdown headers
- No PART/ITEM hierarchy — just headings as PageIndex found them
- Leaf nodes have full text; parent nodes may or may not have text

---

## Stage 2: What `build_tree_index.py` Does

The script transforms the raw PageIndex response into a **canonical 10-K hierarchy**:

```
Step 1: FLATTEN
    PageIndex nested nodes → flat linear list (preserving document order)

Step 2: DISCOVER STRUCTURE
    Scan for explicit "Item N." headings + parse Table of Contents
    Map each heading to its PART (I–IV) using a canonical lookup table

Step 3: BUILD HIERARCHY
    Root
    ├── PART I          (created automatically)
    │   ├── Item 1.     (from explicit heading match)
    │   │   └── sub-sections (everything between Item 1 and Item 1A)
    │   ├── Item 1A.
    │   │   ├── Macroeconomic Risks (from PageIndex sub-node)
    │   │   ├── Business Risks
    │   │   └── ...
    │   └── ...
    ├── PART II
    └── ...

Step 4: FINALIZE
    - Propagate char_count up from leaves to parents
    - Generate content_summary for internal nodes ("Sub-sections: X | Y | Z")
    - Clear content_full on internal nodes (it lives in leaves)

Step 5: SPLIT LARGE LEAVES
    - Scan leaves > threshold for embedded markdown headings (### / ####)
    - Split at heading boundaries into synthetic child nodes

Step 6: PRUNE
    - Remove leaf nodes with content < MIN_CONTENT_CHARS

Step 7: DISAMBIGUATE (NEW)
    - Prepend parent heading to duplicate leaf headings
```

---

## Stage 3: Old Tree vs New Tree (AAPL)

### Overall stats

|                | Old       | New       |
|----------------|-----------|-----------|
| Total nodes    | 61        | 96        |
| Leaf nodes     | 45        | 70        |
| Max depth      | 4         | 4         |
| Total chars    | 185,131   | 184,998   |

Same content, more granular chunks.

### Item 1A. Risk Factors — the biggest change

**OLD (3 monolithic leaves):**
```
Item 1A. Risk Factors  (58,024 chars)
├── Macroeconomic and Industry Risks  (11,981 chars, LEAF)  ← ONE chunk
├── Business Risks                    (29,923 chars, LEAF)  ← ONE chunk (huge!)
└── Legal and Regulatory Compliance   (16,120 chars, LEAF)  ← ONE chunk
```

**NEW (18 split leaves):**
```
Item 1A. Risk Factors  (57,994 chars)
├── Macroeconomic and Industry Risks  (11,975 chars, 4 children)
│   ├── Macroeconomic and Industry Risks (Part 1)  (4,890 chars, LEAF)
│   ├── Macroeconomic and Industry Risks (Part 2)  (3,157 chars, LEAF)
│   ├── Macroeconomic and Industry Risks (Part 3)  (3,185 chars, LEAF)
│   └── Macroeconomic and Industry Risks (Part 4)  (743 chars, LEAF)
├── Business Risks  (29,907 chars, 9 children)
│   ├── Business Risks (Part 1)  (3,272 chars, LEAF)
│   ├── Business Risks (Part 2)  (3,149 chars, LEAF)
│   ├── ...
│   └── Business Risks (Part 9)  (2,332 chars, LEAF)
└── Legal and Regulatory Compliance Risks  (16,112 chars, 5 children)
    ├── Legal and Regulatory Compliance Risks (Part 1)  (3,207 chars, LEAF)
    ├── ...
    └── Legal and Regulatory Compliance Risks (Part 5)  (2,225 chars, LEAF)
```

### Empty heading-only nodes — eliminated

**OLD:** `Item 1B. Unresolved Staff Comments` was a leaf with 85 chars:
```
<physical_index_20>
### Item 1B. Unresolved Staff Comments

None.
<physical_index_20>
```
**NEW:** Pruned (below 150-char threshold). Not a useful retrieval result.

### Note 4 Financial Instruments — heading-only stub eliminated

**OLD:** Had a 34-char leaf `Note 4 – Financial Instruments` containing only the heading text.
**NEW:** Pruned. The actual content lives in its children (Cash Equivalents, Derivatives, etc.).

---

## What Each Improvement Fixes

### 1. `MIN_CONTENT_CHARS: 30 → 150`

Flows into `_prune_empty()` which removes leaves with `char_count < MIN_CONTENT_CHARS`.

**Before:** 82 heading-only stubs survived (e.g., `"## Operating Risks"` = 68 chars > 30)
**After:** All pruned. Participants never see contentless chunks.

### 2. `LARGE_LEAF_THRESHOLD: 8000 → 5000`

More leaves become candidates for splitting. Example:

| Leaf | Old | New |
|------|-----|-----|
| Note 2 – Revenue (5,964 chars) | 1 monolithic leaf | Split into 2 parts |
| CONSOLIDATED STATEMENTS OF CASH FLOWS (5,235 chars) | 1 leaf | Split into 2 parts |
| Note 8 – Leases (6,957 chars) | 1 leaf | Split into 3 parts |

### 3. Paragraph-boundary fallback splitting

When a large leaf has NO embedded `###`/`####` headings, the old script gave up.
Now it splits at `\n\n` paragraph boundaries into ~3,000-char segments.

This is why "Business Risks" (29,923 chars) split into 9 parts — it had no sub-headings,
just paragraphs of risk disclosures. The fallback merged paragraphs into ~3K chunks.

### 4. Heading disambiguation

Duplicate headings get parent context prepended:

| Before | After |
|--------|-------|
| `Revenues` (appears 4x in BA) | `Commercial Airplanes — Revenues` |
| `Overview` (appears 2x in AMZN) | `Item 1. Business — Overview` |
| `Income Taxes` (appears 3x in AMZN) | `Item 7. MD&A — Income Taxes` |

### 5. Runtime filter in tree_service.py

Belt-and-suspenders: even if a stub node survives indexing, the retrieval
service skips nodes with < 150 chars of content (after stripping `<physical_index>`
tags and markdown headers). This ensures no contentless chunks reach the frontend.
