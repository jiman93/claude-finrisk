"""
Audit tree index chunk quality for user study readiness.

Scans all 8 ticker tree indexes and reports:
- Chunk size distribution
- Formatting artifacts (physical_index, markdown headers, footers, tables)
- Content boundary issues (truncated sentences, mid-sentence starts)
- Duplicate headings
- Very short / very long chunks
"""

import json
import os
import re
from collections import defaultdict

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "tree_index")
TICKERS = ["AAPL", "AMZN", "BA", "MSFT", "PFE", "TSLA", "WMT", "XOM"]


def get_all_leaves(node, depth=0):
    """Recursively collect all leaf-level content nodes."""
    leaves = []
    children = node.get("children", [])
    content = node.get("content_full", "") or node.get("content_summary", "")
    heading = node.get("heading", "Untitled")

    if content and (
        not children
        or all(not c.get("content_full") and not c.get("children") for c in children)
    ):
        leaves.append(
            {
                "heading": heading,
                "content": content,
                "depth": depth,
                "node_id": node.get("node_id", ""),
                "page_index": node.get("page_index", 0),
            }
        )

    for child in children:
        leaves.extend(get_all_leaves(child, depth + 1))

    return leaves


def audit_ticker(ticker):
    fpath = os.path.join(DATA_DIR, f"{ticker}_tree.json")
    if not os.path.exists(fpath):
        return None

    with open(fpath, "r", encoding="utf-8") as f:
        data = json.load(f)

    tree = data.get("tree", {})
    leaves = get_all_leaves(tree)

    issues = {
        "total_leaves": len(leaves),
        "truncated_sentences": [],
        "very_short": [],
        "very_long": [],
        "starts_mid_sentence": [],
        "has_physical_index": 0,
        "has_raw_markdown_headers": 0,
        "has_table_pipes": 0,
        "has_footer_lines": 0,
        "duplicate_headings": [],
        "char_lengths": [],
    }

    heading_counts = defaultdict(int)

    for leaf in leaves:
        content = leaf["content"]
        heading = leaf["heading"]
        clen = len(content)
        issues["char_lengths"].append(clen)
        heading_counts[heading] += 1

        # Formatting artifacts
        if re.search(r"<physical_index_\d+>", content):
            issues["has_physical_index"] += 1
        if re.search(r"^#{1,6}\s+", content, re.MULTILINE):
            issues["has_raw_markdown_headers"] += 1
        if re.search(r"\|.*\|.*\|", content):
            issues["has_table_pipes"] += 1
        if re.search(r".+\|\s*\d{4}\s+Form\s+10-K\s*\|\s*\d+", content):
            issues["has_footer_lines"] += 1

        # Very short
        if clen < 100:
            issues["very_short"].append(
                {"heading": heading, "length": clen, "preview": content[:80]}
            )

        # Very long
        if clen > 10000:
            issues["very_long"].append({"heading": heading, "length": clen})

        # Truncated sentence (ends without proper punctuation)
        stripped = content.rstrip()
        if stripped and stripped[-1] not in '.!?:;)"\x270123456789%':
            last_line = stripped.split("\n")[-1].strip()
            if (
                len(last_line) > 20
                and not last_line.startswith("#")
                and not last_line.startswith("-")
            ):
                issues["truncated_sentences"].append(
                    {"heading": heading, "last_50": stripped[-50:]}
                )

        # Starts mid-sentence
        clean_start = re.sub(r"^(<physical_index_\d+>|#{1,6}\s+|\s)+", "", content)
        if clean_start and clean_start[0].islower():
            first_line = clean_start.split("\n")[0][:80]
            issues["starts_mid_sentence"].append(
                {"heading": heading, "first_80": first_line}
            )

    # Duplicate headings
    for h, count in heading_counts.items():
        if count > 1:
            issues["duplicate_headings"].append({"heading": h, "count": count})

    # Summary stats
    lengths = issues["char_lengths"]
    issues["avg_length"] = sum(lengths) / len(lengths) if lengths else 0
    issues["min_length"] = min(lengths) if lengths else 0
    issues["max_length"] = max(lengths) if lengths else 0
    issues["median_length"] = sorted(lengths)[len(lengths) // 2] if lengths else 0

    return issues


def main():
    results = {}
    for ticker in TICKERS:
        r = audit_ticker(ticker)
        if r:
            results[ticker] = r

    # Print summary table
    print("\n=== CHUNK QUALITY AUDIT SUMMARY ===\n")
    print(
        f"{'Ticker':<8} {'Leaves':>6} {'Min':>5} {'Med':>5} {'Avg':>6} {'Max':>6} "
        f"{'PhysIdx':>7} {'MdHdr':>5} {'Table':>5} {'Footer':>6} "
        f"{'Short':>5} {'Long':>4} {'Trunc':>5} {'MidSt':>5} {'DupHd':>5}"
    )
    print("-" * 110)

    for ticker in TICKERS:
        r = results.get(ticker)
        if not r:
            continue
        print(
            f"{ticker:<8} {r['total_leaves']:>6} "
            f"{r['min_length']:>5} {r['median_length']:>5} {r['avg_length']:>6.0f} {r['max_length']:>6} "
            f"{r['has_physical_index']:>7} {r['has_raw_markdown_headers']:>5} "
            f"{r['has_table_pipes']:>5} {r['has_footer_lines']:>6} "
            f"{len(r['very_short']):>5} {len(r['very_long']):>4} "
            f"{len(r['truncated_sentences']):>5} {len(r['starts_mid_sentence']):>5} "
            f"{len(r['duplicate_headings']):>5}"
        )

    # Detailed issues per ticker
    print("\n\n=== DETAILED ISSUES ===")
    for ticker in TICKERS:
        r = results.get(ticker)
        if not r:
            continue

        print(f"\n--- {ticker} ---")

        if r["very_short"]:
            print(f"  VERY SHORT CHUNKS ({len(r['very_short'])}):")
            for item in r["very_short"][:5]:
                print(f'    [{item["length"]} chars] {item["heading"]}: "{item["preview"]}"')
            if len(r["very_short"]) > 5:
                print(f"    ... and {len(r['very_short']) - 5} more")

        if r["truncated_sentences"]:
            print(f"  TRUNCATED SENTENCES ({len(r['truncated_sentences'])}):")
            for item in r["truncated_sentences"][:5]:
                print(f'    {item["heading"]}: ...{item["last_50"]}')
            if len(r["truncated_sentences"]) > 5:
                print(f"    ... and {len(r['truncated_sentences']) - 5} more")

        if r["starts_mid_sentence"]:
            print(f"  STARTS MID-SENTENCE ({len(r['starts_mid_sentence'])}):")
            for item in r["starts_mid_sentence"][:5]:
                print(f'    {item["heading"]}: {item["first_80"]}')
            if len(r["starts_mid_sentence"]) > 5:
                print(f"    ... and {len(r['starts_mid_sentence']) - 5} more")

        if r["duplicate_headings"]:
            print(f"  DUPLICATE HEADINGS ({len(r['duplicate_headings'])}):")
            for item in r["duplicate_headings"]:
                print(f'    "{item["heading"]}" x{item["count"]}')

        if r["very_long"]:
            print(f"  VERY LONG CHUNKS ({len(r['very_long'])}):")
            for item in r["very_long"]:
                print(f'    {item["heading"]}: {item["length"]} chars')

        if (
            not r["very_short"]
            and not r["truncated_sentences"]
            and not r["starts_mid_sentence"]
            and not r["duplicate_headings"]
            and not r["very_long"]
        ):
            print("  No major issues found.")

    return results


if __name__ == "__main__":
    main()
