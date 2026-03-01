import { useState } from "react";

import { useStudyStore } from "../../stores/studyStore";
import type { LedgerChunk } from "../../types";
import { cleanChunkMarkdown, cleanChunkPreview } from "../../utils/chunkText";
import FormattedMarkdown from "../FormattedMarkdown";

interface ChunkDetailViewProps {
  chunks: LedgerChunk[];
  initialIndex: number;
  onBack: () => void;
}

export default function ChunkDetailView({ chunks, initialIndex, onBack }: ChunkDetailViewProps) {
  const [currentIdx, setCurrentIdx] = useState(initialIndex);
  const pdfUrlMap = useStudyStore((s) => s.pdfUrlMap);
  const openPdfViewer = useStudyStore((s) => s.openPdfViewer);
  const ticker = useStudyStore((s) => s.session?.current_ticker);
  const chunk = chunks[currentIdx];
  if (!chunk) return null;

  const pageNum = parseInt(chunk.pageRef.replace(/\D/g, ""), 10) || 1;
  const pdfUrl = ticker ? pdfUrlMap[ticker] : null;

  return (
    <div className="ledger-chunk-detail">
      <div className="ledger-chunk-detail-header">
        <button type="button" className="ledger-back-btn" onClick={onBack}>
          ← Back to Session Map
        </button>
        <span className="ledger-chunk-detail-pos">
          Chunk {chunk.index} of {chunks.length}
        </span>
      </div>

      <div className="ledger-chunk-detail-body">
        <div className="ledger-chunk-detail-status">
          <span className={`ledger-chunk-status-badge ${chunk.selected ? "selected" : "rejected"}`}>
            {chunk.selected ? "✓ Selected" : "✗ Rejected"}
          </span>
        </div>

        <div className="ledger-section">
          <div className="ledger-section-label">Title</div>
          <div className="ledger-chunk-detail-title">{cleanChunkPreview(chunk.title)}</div>
        </div>

        <div className="ledger-section">
          <div className="ledger-section-label">Source</div>
          <div className="ledger-chunk-detail-source">
            {pdfUrl ? (
              <button
                type="button"
                className="pi-citation-chip pi-citation-chip-btn"
                onClick={() => ticker && openPdfViewer({ url: pdfUrl!, page: pageNum, ticker, highlightText: chunk.title })}
                title={`Open PDF at page ${pageNum}`}
              >
                {chunk.pageRef} — View in PDF
              </button>
            ) : (
              chunk.pageRef
            )}
          </div>
        </div>

        <div className="ledger-section">
          <div className="ledger-section-label">Content</div>
          <div className="ledger-chunk-detail-content">
            <FormattedMarkdown text={cleanChunkMarkdown(chunk.contentPreview)} />
          </div>
        </div>
      </div>

      <div className="ledger-chunk-detail-nav">
        <button
          type="button"
          className="ledger-nav-btn"
          disabled={currentIdx === 0}
          onClick={() => setCurrentIdx((i) => i - 1)}
        >
          ◄ Prev chunk
        </button>
        <button
          type="button"
          className="ledger-nav-btn"
          disabled={currentIdx === chunks.length - 1}
          onClick={() => setCurrentIdx((i) => i + 1)}
        >
          Next chunk ►
        </button>
      </div>
    </div>
  );
}
