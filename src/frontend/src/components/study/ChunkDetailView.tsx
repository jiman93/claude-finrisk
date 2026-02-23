import { useState } from "react";

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
  const chunk = chunks[currentIdx];
  if (!chunk) return null;

  return (
    <div className="ledger-chunk-detail">
      <div className="ledger-chunk-detail-header">
        <button type="button" className="ledger-back-btn" onClick={onBack}>
          ← Back to Ledger
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
          <div className="ledger-chunk-detail-source">{chunk.pageRef}</div>
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
