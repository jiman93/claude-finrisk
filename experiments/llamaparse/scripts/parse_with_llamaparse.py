#!/usr/bin/env python3
"""Parse 10-K PDFs using LlamaParse and save structured output."""

import argparse
import json
import os
from pathlib import Path
from datetime import datetime, timezone

try:
    from llama_parse import LlamaParse
except ImportError:
    print("ERROR: llama-parse not installed")
    print("Install with: pip install llama-parse")
    exit(1)


def parse_10k(pdf_path: Path, output_dir: Path, api_key: str, result_type: str = "markdown") -> dict:
    """Parse a 10-K PDF with LlamaParse.

    Args:
        pdf_path: Path to the PDF file
        output_dir: Directory to save parsed output
        api_key: LlamaParse API key
        result_type: "markdown" or "json"

    Returns:
        dict with metadata about the parse
    """
    parser = LlamaParse(
        api_key=api_key,
        result_type=result_type,
        verbose=True,
        language="en",
        parsing_instruction=(
            "This is a SEC 10-K annual filing. "
            "Preserve the document structure including all section headings (Item 1, Item 1A, etc.), "
            "table of contents, and page numbers. "
            "Extract tables and financial data accurately."
        ),
    )

    print(f"\n[INFO] Parsing {pdf_path.name} with LlamaParse...")
    print(f"[INFO] Result type: {result_type}")

    start_time = datetime.now(timezone.utc)

    try:
        # Parse the document
        documents = parser.load_data(str(pdf_path))

        end_time = datetime.now(timezone.utc)
        duration = (end_time - start_time).total_seconds()

        print(f"[SUCCESS] Parsed in {duration:.1f}s")
        print(f"[INFO] Documents returned: {len(documents)}")

        # Save the parsed output
        output_dir.mkdir(parents=True, exist_ok=True)

        ticker = pdf_path.stem.split('-')[0].upper()
        timestamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")

        if result_type == "markdown":
            output_file = output_dir / f"{ticker}_llamaparse_{timestamp}.md"
            # Combine all documents into one markdown file
            combined_text = "\n\n---\n\n".join([doc.text for doc in documents])
            output_file.write_text(combined_text, encoding="utf-8")
            print(f"[SAVED] Markdown: {output_file}")
        else:
            output_file = output_dir / f"{ticker}_llamaparse_{timestamp}.json"
            # Save as JSON with metadata
            json_output = {
                "ticker": ticker,
                "pdf_path": str(pdf_path),
                "parsed_at": end_time.isoformat(),
                "duration_seconds": duration,
                "document_count": len(documents),
                "documents": [
                    {
                        "id": doc.id_ if hasattr(doc, 'id_') else f"doc_{i}",
                        "text": doc.text,
                        "metadata": doc.metadata if hasattr(doc, 'metadata') else {}
                    }
                    for i, doc in enumerate(documents)
                ]
            }
            output_file.write_text(json.dumps(json_output, indent=2), encoding="utf-8")
            print(f"[SAVED] JSON: {output_file}")

        # Create metadata file
        metadata = {
            "ticker": ticker,
            "pdf_path": str(pdf_path),
            "pdf_size_mb": round(pdf_path.stat().st_size / 1024 / 1024, 2),
            "parsed_at": end_time.isoformat(),
            "duration_seconds": round(duration, 2),
            "result_type": result_type,
            "output_file": str(output_file),
            "document_count": len(documents),
            "total_chars": sum(len(doc.text) for doc in documents),
            "status": "success"
        }

        metadata_file = output_dir / f"{ticker}_llamaparse_metadata_{timestamp}.json"
        metadata_file.write_text(json.dumps(metadata, indent=2), encoding="utf-8")
        print(f"[SAVED] Metadata: {metadata_file}")

        return metadata

    except Exception as e:
        print(f"[ERROR] Parse failed: {e}")

        end_time = datetime.now(timezone.utc)
        duration = (end_time - start_time).total_seconds()

        metadata = {
            "ticker": ticker,
            "pdf_path": str(pdf_path),
            "parsed_at": end_time.isoformat(),
            "duration_seconds": round(duration, 2),
            "result_type": result_type,
            "status": "error",
            "error": str(e)
        }

        metadata_file = output_dir / f"{ticker}_llamaparse_metadata_error_{timestamp}.json"
        metadata_file.write_text(json.dumps(metadata, indent=2), encoding="utf-8")

        raise


def main():
    parser = argparse.ArgumentParser(description="Parse 10-K PDFs with LlamaParse")
    parser.add_argument("pdf_path", type=Path, help="Path to 10-K PDF file")
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=Path("experiments/llamaparse/data"),
        help="Output directory for parsed files"
    )
    parser.add_argument(
        "--result-type",
        choices=["markdown", "json"],
        default="markdown",
        help="Output format (markdown or json)"
    )
    parser.add_argument(
        "--api-key",
        default=None,
        help="LlamaParse API key (or set LLAMA_CLOUD_API_KEY env var)"
    )

    args = parser.parse_args()

    # Get API key
    api_key = args.api_key or os.getenv("LLAMA_CLOUD_API_KEY")
    if not api_key:
        print("ERROR: No API key provided")
        print("Set LLAMA_CLOUD_API_KEY env var or pass --api-key")
        print("\nGet a free API key at: https://cloud.llamaindex.ai/")
        exit(1)

    if not args.pdf_path.exists():
        print(f"ERROR: PDF not found: {args.pdf_path}")
        exit(1)

    # Parse the PDF
    metadata = parse_10k(
        pdf_path=args.pdf_path,
        output_dir=args.output_dir,
        api_key=api_key,
        result_type=args.result_type
    )

    print("\n" + "="*60)
    print("PARSE COMPLETE")
    print("="*60)
    print(f"Ticker: {metadata['ticker']}")
    print(f"Duration: {metadata['duration_seconds']}s")
    print(f"Total chars: {metadata.get('total_chars', 'N/A'):,}")
    print(f"Output: {metadata.get('output_file', 'N/A')}")
    print("="*60)


if __name__ == "__main__":
    main()
