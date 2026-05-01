import { useCallback, useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import PdfjsWorker from "pdfjs-dist/build/pdf.worker.min.mjs?worker";

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

import { useStudyStore } from "../stores/studyStore";

// Bundle the PDF.js worker via Vite's ?worker import. The worker is
// instantiated directly as a Worker (no URL fetch), so it bypasses any
// nginx MIME-type concerns with .mjs files and avoids external CDNs.
pdfjs.GlobalWorkerOptions.workerPort = new PdfjsWorker();

const ZOOM_STEP = 0.15;
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 3.0;

export default function PdfViewerOverlay() {
  const pdfViewer = useStudyStore((s) => s.pdfViewer);
  const closePdfViewer = useStudyStore((s) => s.closePdfViewer);

  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [pageInput, setPageInput] = useState<string>("1");

  const bodyRef = useRef<HTMLDivElement>(null);

  // Sync initial page from store
  useEffect(() => {
    if (pdfViewer) {
      setPageNumber(pdfViewer.page);
      setPageInput(String(pdfViewer.page));
      setScale(1.0);
      setNumPages(0);
    }
  }, [pdfViewer]);

  // Escape key closes overlay
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") closePdfViewer();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [closePdfViewer]);

  // Scroll to top when page changes
  useEffect(() => {
    bodyRef.current?.scrollTo(0, 0);
  }, [pageNumber]);

  const onDocumentLoadSuccess = useCallback(({ numPages: n }: { numPages: number }) => {
    setNumPages(n);
  }, []);

  // Highlight matching text in the text layer after it renders
  const onRenderTextLayerSuccess = useCallback(() => {
    const highlightText = pdfViewer?.highlightText;
    if (!highlightText || !bodyRef.current) return;

    // Extract first meaningful words from the section title for matching
    const searchTerms = highlightText
      .replace(/\(Part \d+\)/gi, "")
      .replace(/[—–\-]/g, " ")
      .trim()
      .split(/\s+/)
      .filter((w) => w.length > 2)
      .slice(0, 5);

    if (searchTerms.length === 0) return;

    const spans = bodyRef.current.querySelectorAll(
      ".react-pdf__Page__textContent span"
    );

    // Build a search phrase from first few words
    const searchPhrase = searchTerms.join(" ").toLowerCase();

    let matched = false;
    spans.forEach((span) => {
      span.classList.remove("pdf-highlight-match");
      const text = (span.textContent || "").toLowerCase();
      // Check if span contains enough of the search terms
      const matchCount = searchTerms.filter((t) =>
        text.includes(t.toLowerCase())
      ).length;
      if (matchCount >= Math.min(2, searchTerms.length) || text.includes(searchPhrase)) {
        span.classList.add("pdf-highlight-match");
        if (!matched) {
          span.scrollIntoView({ behavior: "smooth", block: "center" });
          matched = true;
        }
      }
    });
  }, [pdfViewer?.highlightText]);

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

  if (!pdfViewer) return null;

  return (
    <div className="pdf-viewer-overlay">
      <div className="pdf-viewer-toolbar">
        <div className="pdf-viewer-toolbar-left">
          <button
            type="button"
            className="pdf-viewer-close-btn"
            onClick={closePdfViewer}
          >
            ← Close
          </button>
          <span className="pdf-viewer-label">
            {pdfViewer.ticker} 10-K
          </span>
        </div>
        <div className="pdf-viewer-toolbar-center">
          <button
            type="button"
            className="pdf-viewer-zoom-btn"
            onClick={() => setScale((s) => Math.max(ZOOM_MIN, s - ZOOM_STEP))}
            title="Zoom out"
          >
            -
          </button>
          <span className="pdf-viewer-zoom-label">{Math.round(scale * 100)}%</span>
          <button
            type="button"
            className="pdf-viewer-zoom-btn"
            onClick={() => setScale((s) => Math.min(ZOOM_MAX, s + ZOOM_STEP))}
            title="Zoom in"
          >
            +
          </button>
          <button
            type="button"
            className="pdf-viewer-zoom-btn"
            onClick={() => setScale(1.0)}
            title="Reset zoom"
          >
            Reset
          </button>
        </div>
        <div className="pdf-viewer-toolbar-right">
          {numPages > 0 && (
            <span className="pdf-viewer-page-info">
              Page {pageNumber} of {numPages}
            </span>
          )}
        </div>
      </div>

      <div className="pdf-viewer-body" ref={bodyRef}>
        <Document
          file={pdfViewer.url}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={<div className="pdf-viewer-loading">Loading PDF...</div>}
          error={<div className="pdf-viewer-error">Failed to load PDF.</div>}
        >
          <Page
            pageNumber={pageNumber}
            scale={scale}
            loading={<div className="pdf-viewer-loading">Rendering page...</div>}
            onRenderTextLayerSuccess={onRenderTextLayerSuccess}
          />
        </Document>
      </div>

      <div className="pdf-viewer-footer">
        <button
          type="button"
          className="pdf-viewer-nav-btn"
          disabled={pageNumber <= 1}
          onClick={() => goToPage(pageNumber - 1)}
        >
          ◄ Prev
        </button>
        <div className="pdf-viewer-page-input-group">
          <input
            type="text"
            className="pdf-viewer-page-input"
            value={pageInput}
            onChange={(e) => setPageInput(e.target.value)}
            onBlur={handlePageInputSubmit}
            onKeyDown={(e) => e.key === "Enter" && handlePageInputSubmit()}
          />
          <span className="pdf-viewer-page-total">/ {numPages || "?"}</span>
        </div>
        <button
          type="button"
          className="pdf-viewer-nav-btn"
          disabled={pageNumber >= numPages}
          onClick={() => goToPage(pageNumber + 1)}
        >
          Next ►
        </button>
      </div>
    </div>
  );
}
