#!/usr/bin/env python3
"""Test markdown chunking strategies with LlamaParse output."""

import sys
from pathlib import Path

try:
    from llama_index.core import Document
    from llama_index.core.node_parser import MarkdownNodeParser
except ImportError:
    print("ERROR: llama-index-core not installed")
    print("Install with: pip install llama-index-core")
    sys.exit(1)


def test_markdown_chunking(markdown_path: Path):
    """Test MarkdownNodeParser on LlamaParse output."""

    print(f"\n{'='*70}")
    print(f"TESTING CHUNKING: {markdown_path.name}")
    print(f"{'='*70}\n")

    # Load markdown
    markdown_text = markdown_path.read_text(encoding="utf-8")

    print(f"[INPUT]")
    print(f"  Total chars: {len(markdown_text):,}")
    print(f"  Total lines: {markdown_text.count(chr(10)) + 1:,}")

    # Create document
    doc = Document(text=markdown_text)

    # Parse with MarkdownNodeParser
    parser = MarkdownNodeParser(
        include_metadata=True,
        include_prev_next_rel=True
    )

    nodes = parser.get_nodes_from_documents([doc])

    print(f"\n[OUTPUT]")
    print(f"  Total nodes/chunks: {len(nodes)}")
    print(f"  Avg chars per node: {len(markdown_text) // max(1, len(nodes)):,}")

    # Show first 10 nodes
    print(f"\n[FIRST 10 NODES]\n")

    for i, node in enumerate(nodes[:10], 1):
        text = node.get_content()

        # Extract first line (usually the heading)
        first_line = text.split('\n')[0] if text else "(empty)"

        # Check if sentence is complete
        last_sentence = text.strip().split('.')[-1] if text else ""
        is_complete = text.strip().endswith(('.', '!', '?', '\n')) if text else False

        print(f"{i:2d}. {first_line[:60]}")
        print(f"    Chars: {len(text):,}")
        print(f"    Lines: {text.count(chr(10)) + 1}")
        print(f"    Complete sentence: {'✅' if is_complete else '⚠️'}")
        print(f"    Preview: {text[:150].replace(chr(10), ' ')[:150]}...")

        # Check for butchered sentences (mid-word cuts)
        if text and not is_complete:
            last_word = text.strip().split()[-1] if text.strip() else ""
            if len(last_word) > 3 and not any(c in last_word for c in '.,!?;:'):
                print(f"    ⚠️ WARNING: Possible mid-sentence cut: ...{last_word}")

        print()

    if len(nodes) > 10:
        print(f"... and {len(nodes) - 10} more nodes\n")

    # Find Item 1A if it exists
    print(f"\n[ITEM 1A ANALYSIS]\n")

    item1a_nodes = [n for n in nodes if 'Item 1A' in n.get_content()[:200]]

    if item1a_nodes:
        print(f"Found {len(item1a_nodes)} nodes containing 'Item 1A'")

        for i, node in enumerate(item1a_nodes[:3], 1):
            text = node.get_content()
            first_line = text.split('\n')[0]

            print(f"\nNode {i}: {first_line}")
            print(f"  Chars: {len(text):,}")
            print(f"  Starts: {text[:100].replace(chr(10), ' ')}")
            print(f"  Ends: ...{text[-100:].replace(chr(10), ' ')}")

            # Check completeness
            if text.strip().endswith(('.', '!', '?', '\n')):
                print(f"  ✅ Complete sentences")
            else:
                print(f"  ⚠️ May be incomplete")
    else:
        print("No nodes found containing 'Item 1A'")

    # Statistics
    print(f"\n[STATISTICS]\n")

    node_sizes = [len(n.get_content()) for n in nodes]
    print(f"  Min node size: {min(node_sizes):,} chars")
    print(f"  Max node size: {max(node_sizes):,} chars")
    print(f"  Median node size: {sorted(node_sizes)[len(node_sizes)//2]:,} chars")

    # Check for butchered sentences
    butchered_count = 0
    for node in nodes:
        text = node.get_content()
        if text and not text.strip().endswith(('.', '!', '?', '\n')):
            last_word = text.strip().split()[-1] if text.strip() else ""
            if len(last_word) > 3 and not any(c in last_word for c in '.,!?;:'):
                butchered_count += 1

    print(f"\n[QUALITY CHECK]")
    print(f"  Nodes with complete sentences: {len(nodes) - butchered_count}/{len(nodes)}")
    print(f"  Nodes with possible cuts: {butchered_count}/{len(nodes)}")

    if butchered_count == 0:
        print(f"  ✅ NO BUTCHERED SENTENCES!")
    else:
        print(f"  ⚠️ {butchered_count} nodes may have mid-sentence cuts")

    print(f"\n{'='*70}\n")

    return nodes


def main():
    if len(sys.argv) < 2:
        print("Usage: python test_chunking.py <markdown_file>")
        print("\nExample:")
        print("  python experiments/llamaparse/scripts/test_chunking.py \\")
        print("    experiments/llamaparse/data/MSFT_llamaparse_*.md")
        sys.exit(1)

    md_path = Path(sys.argv[1])

    if not md_path.exists():
        print(f"ERROR: File not found: {md_path}")
        sys.exit(1)

    nodes = test_markdown_chunking(md_path)

    print("CHUNKING TEST COMPLETE")


if __name__ == "__main__":
    main()
