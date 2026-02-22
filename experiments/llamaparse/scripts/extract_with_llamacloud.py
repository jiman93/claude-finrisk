#!/usr/bin/env python3
"""Extract structured 10-K data using LlamaCloud Extract API."""

import argparse
import json
import os
from pathlib import Path
from datetime import datetime, timezone

# Import the llama_cloud client
from llama_cloud.client import LlamaCloud
from llama_cloud import ExtractConfig, ExtractMode

def create_10k_schema():
    """Create JSON schema for 10-K structure.

    This schema defines the hierarchical structure we want to extract:
    - Document metadata
    - Parts (PART I, II, III, IV)
    - Items (Item 1, Item 1A, etc.)
    - Risk factor categories (for Item 1A)
    """
    schema = {
        "type": "object",
        "properties": {
            "document_metadata": {
                "type": "object",
                "properties": {
                    "company_name": {"type": "string"},
                    "fiscal_year_end": {"type": "string"},
                    "form_type": {"type": "string"}
                }
            },
            "parts": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "part_name": {"type": "string", "description": "e.g., PART I, PART II"},
                        "items": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "item_number": {"type": "string", "description": "e.g., Item 1, Item 1A"},
                                    "item_title": {"type": "string", "description": "e.g., Business, Risk Factors"},
                                    "content": {"type": "string"},
                                    "subsections": {
                                        "type": "array",
                                        "items": {
                                            "type": "object",
                                            "properties": {
                                                "heading": {"type": "string"},
                                                "content": {"type": "string"}
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            "item_1a_risk_factors": {
                "type": "object",
                "properties": {
                    "risk_categories": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "category_name": {"type": "string"},
                                "risks": {
                                    "type": "array",
                                    "items": {
                                        "type": "object",
                                        "properties": {
                                            "risk_heading": {"type": "string"},
                                            "risk_description": {"type": "string"}
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    return schema


def extract_10k(pdf_path: Path, output_dir: Path, api_key: str) -> dict:
    """Extract structured data from 10-K PDF using LlamaCloud.

    Args:
        pdf_path: Path to the PDF file
        output_dir: Directory to save extracted output
        api_key: LlamaCloud API key

    Returns:
        dict with metadata about the extraction
    """
    # Create client
    client = LlamaCloud(
        token=api_key
    )

    print(f"\n[INFO] Extracting structured data from {pdf_path.name}...")

    # Create schema
    schema = create_10k_schema()

    print(f"[INFO] Schema created with {len(schema['properties'])} top-level fields")

    start_time = datetime.now(timezone.utc)

    try:
        # Upload file first
        print("[INFO] Uploading file...")
        with open(pdf_path, 'rb') as f:
            file_upload = client.files.upload_file(
                upload_file=f
            )

        print(f"[INFO] File uploaded: {file_upload.id}")

        # Create extraction config
        extract_config = ExtractConfig(
            extraction_mode=ExtractMode.BALANCED,  # FAST, BALANCED, PREMIUM, or MULTIMODAL
            cite_sources=True,  # Get source citations
            confidence_scores=False,  # Don't need confidence scores
        )

        # Run extraction using stateless API
        print("[INFO] Running extraction with BALANCED mode...")
        result = client.llama_extract.extract_stateless(
            file_id=file_upload.id,
            data_schema=schema,
            config=extract_config
        )

        end_time = datetime.now(timezone.utc)
        duration = (end_time - start_time).total_seconds()

        print(f"[SUCCESS] Extracted in {duration:.1f}s")

        # Save the result
        output_dir.mkdir(parents=True, exist_ok=True)

        ticker = pdf_path.stem.split('-')[0].upper()
        timestamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")

        output_file = output_dir / f"{ticker}_llamaextract_{timestamp}.json"

        # Convert result to dict and save
        # First, convert the result to a JSON-serializable format
        if hasattr(result, 'dict'):
            extracted_data = result.dict()
        elif hasattr(result, '__dict__'):
            extracted_data = result.__dict__
        else:
            extracted_data = str(result)

        result_data = {
            "ticker": ticker,
            "pdf_path": str(pdf_path),
            "extracted_at": end_time.isoformat(),
            "duration_seconds": duration,
            "schema": schema,
            "extracted_data": extracted_data
        }

        # Use default handler for any remaining non-serializable objects
        def json_serial(obj):
            """JSON serializer for objects not serializable by default json code"""
            if isinstance(obj, datetime):
                return obj.isoformat()
            raise TypeError(f"Type {type(obj)} not serializable")

        output_file.write_text(json.dumps(result_data, indent=2, default=json_serial), encoding="utf-8")
        print(f"[SAVED] JSON: {output_file}")

        return {
            "status": "success",
            "ticker": ticker,
            "duration_seconds": round(duration, 2),
            "output_file": str(output_file),
            "file_id": file_upload.id
        }

    except Exception as e:
        print(f"[ERROR] Extraction failed: {e}")
        import traceback
        traceback.print_exc()

        end_time = datetime.now(timezone.utc)
        duration = (end_time - start_time).total_seconds()

        return {
            "status": "error",
            "error": str(e),
            "duration_seconds": round(duration, 2)
        }


def main():
    parser = argparse.ArgumentParser(description="Extract structured 10-K data with LlamaCloud")
    parser.add_argument("pdf_path", type=Path, help="Path to 10-K PDF file")
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=Path("experiments/llamaparse/data"),
        help="Output directory for extracted files"
    )
    parser.add_argument(
        "--api-key",
        default=None,
        help="LlamaCloud API key (or set LLAMA_CLOUD_API_KEY env var)"
    )

    args = parser.parse_args()

    # Get API key
    api_key = args.api_key or os.getenv("LLAMA_CLOUD_API_KEY")
    if not api_key:
        print("ERROR: No API key provided")
        print("Set LLAMA_CLOUD_API_KEY env var or pass --api-key")
        exit(1)

    if not args.pdf_path.exists():
        print(f"ERROR: PDF not found: {args.pdf_path}")
        exit(1)

    # Extract the PDF
    result = extract_10k(
        pdf_path=args.pdf_path,
        output_dir=args.output_dir,
        api_key=api_key
    )

    print("\n" + "="*60)
    print("EXTRACTION RESULT")
    print("="*60)
    print(json.dumps(result, indent=2))
    print("="*60)


if __name__ == "__main__":
    main()
