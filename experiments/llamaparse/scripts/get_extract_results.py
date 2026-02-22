#!/usr/bin/env python3
"""Get results from a LlamaExtract job."""

import argparse
import json
import os
import time
from pathlib import Path

from llama_cloud.client import LlamaCloud


def wait_for_job(client: LlamaCloud, job_id: str, max_wait: int = 300) -> dict:
    """Wait for extraction job to complete and return results.

    Args:
        client: LlamaCloud client
        job_id: Extract job ID
        max_wait: Maximum seconds to wait

    Returns:
        dict with extracted data
    """
    print(f"[INFO] Waiting for job {job_id} to complete...")

    start_time = time.time()
    while True:
        # Check job status
        job = client.llama_extract.get_job(job_id=job_id)
        status = job.status

        elapsed = time.time() - start_time
        print(f"[{elapsed:.1f}s] Status: {status}")

        if status == "SUCCESS":
            print(f"[SUCCESS] Job completed in {elapsed:.1f}s")

            # Get the results
            result = client.llama_extract.get_job_result(job_id=job_id)
            return result

        elif status == "FAILED":
            print(f"[ERROR] Job failed after {elapsed:.1f}s")
            return {"error": "Job failed", "job": job.dict() if hasattr(job, 'dict') else str(job)}

        elif status in ["PENDING", "PROCESSING"]:
            # Still processing
            if elapsed > max_wait:
                print(f"[TIMEOUT] Job exceeded {max_wait}s timeout")
                return {"error": "Timeout", "status": status, "elapsed": elapsed}

            # Wait before checking again
            time.sleep(5)

        else:
            print(f"[WARNING] Unknown status: {status}")
            time.sleep(5)


def main():
    parser = argparse.ArgumentParser(description="Get LlamaExtract job results")
    parser.add_argument("job_id", help="Extract job ID")
    parser.add_argument(
        "--output",
        type=Path,
        help="Output file path (optional)"
    )
    parser.add_argument(
        "--max-wait",
        type=int,
        default=300,
        help="Maximum seconds to wait (default: 300)"
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
        exit(1)

    # Create client
    client = LlamaCloud(token=api_key)

    # Wait for and get results
    result = wait_for_job(client, args.job_id, max_wait=args.max_wait)

    # Convert to JSON-serializable format
    if hasattr(result, 'dict'):
        result_data = result.dict()
    elif hasattr(result, '__dict__'):
        result_data = result.__dict__
    else:
        result_data = result

    # Print summary
    print("\n" + "="*70)
    print("EXTRACTION RESULTS")
    print("="*70)

    if isinstance(result_data, dict):
        if 'error' in result_data:
            print(f"ERROR: {result_data['error']}")
        else:
            print(json.dumps(result_data, indent=2, default=str))
    else:
        print(result_data)

    print("="*70)

    # Save if output path specified
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(json.dumps(result_data, indent=2, default=str), encoding="utf-8")
        print(f"\n[SAVED] {args.output}")


if __name__ == "__main__":
    main()
