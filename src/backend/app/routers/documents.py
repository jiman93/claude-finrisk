"""Documents router — serves the 10-K PDF manifest and PDF files."""

import json
from pathlib import Path

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

from app.config import PROJECT_ROOT

router = APIRouter(prefix="/api/documents", tags=["documents"])

_MANIFEST_PATH = PROJECT_ROOT / "data" / "metadata" / "edgar_10k_manifest.json"
_PDF_DIR = PROJECT_ROOT / "data" / "10k_pdfs"
_THUMB_DIR = PROJECT_ROOT / "data" / "10k_thumbs"


@router.get("")
def list_documents():
    """Return a list of available 10-K documents with PDF URLs."""
    if not _MANIFEST_PATH.exists():
        return []

    with open(_MANIFEST_PATH, "r", encoding="utf-8") as f:
        manifest = json.load(f)

    docs = []
    for record in manifest.get("records", []):
        ticker = record["ticker"]
        # Find the actual PDF filename in our local directory
        pdf_filename = None
        for pdf_file in _PDF_DIR.iterdir():
            if pdf_file.name.startswith(f"{ticker}_") and pdf_file.suffix == ".pdf":
                pdf_filename = pdf_file.name
                break

        if not pdf_filename:
            continue

        thumb_file = _THUMB_DIR / f"{ticker}_thumb.png"
        docs.append(
            {
                "ticker": ticker,
                "filing_date": record.get("filing_date", ""),
                "report_date": record.get("report_date", ""),
                "form": record.get("form", "10-K"),
                "pdf_url": f"/api/documents/pdf/{pdf_filename}",
                "pdf_filename": pdf_filename,
                "thumb_url": f"/api/documents/thumb/{ticker}" if thumb_file.exists() else None,
            }
        )

    docs.sort(key=lambda d: d["ticker"])
    return docs


@router.get("/pdf/{filename}")
def serve_pdf(filename: str):
    """Serve a PDF file by filename. Goes through CORS middleware."""
    pdf_path = _PDF_DIR / filename
    if not pdf_path.exists() or not pdf_path.suffix == ".pdf":
        raise HTTPException(status_code=404, detail="PDF not found")
    # Prevent path traversal
    if pdf_path.resolve().parent != _PDF_DIR.resolve():
        raise HTTPException(status_code=403, detail="Forbidden")
    return FileResponse(pdf_path, media_type="application/pdf")


@router.get("/thumb/{ticker}")
def serve_thumb(ticker: str):
    """Serve a pre-rendered first-page thumbnail PNG for a given ticker."""
    thumb_path = _THUMB_DIR / f"{ticker}_thumb.png"
    if not thumb_path.exists():
        raise HTTPException(status_code=404, detail="Thumbnail not found")
    if thumb_path.resolve().parent != _THUMB_DIR.resolve():
        raise HTTPException(status_code=403, detail="Forbidden")
    return FileResponse(
        thumb_path,
        media_type="image/png",
        headers={"Cache-Control": "public, max-age=86400"},
    )
