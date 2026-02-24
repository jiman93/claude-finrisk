import { useCallback, useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import pdfjsWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl;

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

const ZOOM_STEP = 0.15;
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 3.0;

interface DocumentRecord {
  ticker: string;
  filing_date: string;
  report_date: string;
  form: string;
  pdf_url: string;
  pdf_filename: string;
}

export default function DocumentsPanel() {
  const [docs, setDocs] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<DocumentRecord | null>(null);

  useEffect(() => {
    fetch(`${BASE_URL}/api/documents`)
      .then((res) => res.json())
      .then((data) => {
        setDocs(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="documents-panel">
        <div className="documents-loading">Loading documents...</div>
      </div>
    );
  }

  if (docs.length === 0) {
    return (
      <div className="documents-panel">
        <div className="documents-empty">No 10-K documents found.</div>
      </div>
    );
  }

  return (
    <div className={`documents-split ${selected ? "has-viewer" : ""}`}>
      {/* Left: card grid */}
      <div className="documents-left">
        <div className="documents-header">
          <h2 className="documents-title">10-K Annual Reports</h2>
          <span className="documents-count">{docs.length} filings</span>
        </div>
        <div className="documents-grid">
          {docs.map((doc) => {
            const thumbSrc = `${BASE_URL}/api/documents/thumb/${doc.ticker}`;
            const isActive = selected?.ticker === doc.ticker;
            return (
              <button
                key={doc.ticker}
                type="button"
                className={`documents-card ${isActive ? "active" : ""}`}
                onClick={() => setSelected(isActive ? null : doc)}
              >
                <div className="documents-card-thumb">
                  <img
                    src={thumbSrc}
                    alt={`${doc.ticker} 10-K page 1`}
                    className="documents-card-thumb-img"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                </div>
                <div className="documents-card-info">
                  <div className="documents-card-ticker">{doc.ticker}</div>
                  <div className="documents-card-form">{doc.form}</div>
                  <div className="documents-card-dates">
                    <span>Filed: {doc.filing_date}</span>
                    <span>Period: {doc.report_date}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right: inline PDF viewer */}
      {selected && (
        <InlinePdfViewer
          key={selected.ticker}
          url={`${BASE_URL}${selected.pdf_url}`}
          ticker={selected.ticker}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

// ── Inline PDF Viewer (right pane) ──

function InlinePdfViewer({
  url,
  ticker,
  onClose,
}: {
  url: string;
  ticker: string;
  onClose: () => void;
}) {
  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [pageInput, setPageInput] = useState("1");
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bodyRef.current?.scrollTo(0, 0);
  }, [pageNumber]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const onDocumentLoadSuccess = useCallback(({ numPages: n }: { numPages: number }) => {
    setNumPages(n);
  }, []);

  function goToPage(p: number) {
    const clamped = Math.max(1, Math.min(p, numPages || 1));
    setPageNumber(clamped);
    setPageInput(String(clamped));
  }

  function handlePageInputSubmit() {
    const parsed = parseInt(pageInput, 10);
    if (!isNaN(parsed)) goToPage(parsed);
    else setPageInput(String(pageNumber));
  }

  return (
    <div className="documents-viewer">
      <div className="documents-viewer-toolbar">
        <button type="button" className="documents-viewer-close" onClick={onClose}>
          ← Close
        </button>
        <span className="documents-viewer-label">{ticker} 10-K</span>
        <div className="documents-viewer-zoom">
          <button
            type="button"
            className="documents-viewer-zoom-btn"
            onClick={() => setScale((s) => Math.max(ZOOM_MIN, s - ZOOM_STEP))}
          >
            -
          </button>
          <span className="documents-viewer-zoom-label">{Math.round(scale * 100)}%</span>
          <button
            type="button"
            className="documents-viewer-zoom-btn"
            onClick={() => setScale((s) => Math.min(ZOOM_MAX, s + ZOOM_STEP))}
          >
            +
          </button>
        </div>
      </div>

      <div className="documents-viewer-body" ref={bodyRef}>
        <Document
          file={url}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={<div className="documents-viewer-msg">Loading PDF...</div>}
          error={<div className="documents-viewer-msg">Failed to load PDF.</div>}
        >
          <Page
            pageNumber={pageNumber}
            scale={scale}
            loading={<div className="documents-viewer-msg">Rendering page...</div>}
          />
        </Document>
      </div>

      <div className="documents-viewer-footer">
        <button
          type="button"
          className="documents-viewer-nav-btn"
          disabled={pageNumber <= 1}
          onClick={() => goToPage(pageNumber - 1)}
        >
          ◄ Prev
        </button>
        <div className="documents-viewer-page-group">
          <input
            type="text"
            className="documents-viewer-page-input"
            value={pageInput}
            onChange={(e) => setPageInput(e.target.value)}
            onBlur={handlePageInputSubmit}
            onKeyDown={(e) => e.key === "Enter" && handlePageInputSubmit()}
          />
          <span className="documents-viewer-page-total">/ {numPages || "?"}</span>
        </div>
        <button
          type="button"
          className="documents-viewer-nav-btn"
          disabled={pageNumber >= numPages}
          onClick={() => goToPage(pageNumber + 1)}
        >
          Next ►
        </button>
      </div>
    </div>
  );
}

/** Fetch the documents manifest and return a ticker→pdf_url map. */
export async function fetchDocumentsMap(): Promise<Record<string, string>> {
  try {
    const res = await fetch(`${BASE_URL}/api/documents`);
    if (!res.ok) return {};
    const docs: DocumentRecord[] = await res.json();
    const map: Record<string, string> = {};
    for (const doc of docs) {
      map[doc.ticker] = `${BASE_URL}${doc.pdf_url}`;
    }
    return map;
  } catch {
    return {};
  }
}
