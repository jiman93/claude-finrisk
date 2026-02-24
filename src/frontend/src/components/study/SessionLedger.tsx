import { useEffect, useRef, useState } from "react";

import { useStudyStore } from "../../stores/studyStore";
import type { LedgerPhase, ParticipantAssignment, RetrievalNode } from "../../types";
import ChunkDetailView from "./ChunkDetailView";
import LedgerPhaseCard from "./LedgerPhaseCard";

interface SessionLedgerProps {
  assignment: ParticipantAssignment;
  onViewSummary: (label: string, text: string, sourceNodes?: RetrievalNode[], ticker?: string) => void;
  onViewCheckpoint: (label: string, fields: Array<{ label: string; value: string }>) => void;
}

export default function SessionLedger({
  assignment,
  onViewSummary,
  onViewCheckpoint,
}: SessionLedgerProps) {
  const ledgerPhases = useStudyStore((s) => s.ledgerPhases);
  const [chunkDetail, setChunkDetail] = useState<{
    phaseNum: number;
    chunkIndex: number;
  } | null>(null);

  const listRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to active phase when it changes
  useEffect(() => {
    if (!listRef.current) return;
    const activeEl = listRef.current.querySelector(".ledger-phase.active");
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [ledgerPhases.find((lp) => lp.status === "active")?.phase]);

  // Calculate overall progress
  const progress = calculateProgress(ledgerPhases);
  const allComplete = ledgerPhases.length > 0 && ledgerPhases.every((lp) => lp.status === "completed");

  // Handle chunk detail view
  function handleViewChunk(phaseNum: number, chunkIndex: number) {
    setChunkDetail({ phaseNum, chunkIndex });
  }

  // If showing chunk detail, render overlay
  if (chunkDetail) {
    const phase = ledgerPhases.find((lp) => lp.phase === chunkDetail.phaseNum);
    if (phase?.retrieval?.chunks) {
      return (
        <div className="ledger-container">
          <ChunkDetailView
            chunks={phase.retrieval.chunks}
            initialIndex={chunkDetail.chunkIndex}
            onBack={() => setChunkDetail(null)}
          />
        </div>
      );
    }
  }

  // Empty state
  if (ledgerPhases.length === 0) {
    return (
      <div className="ledger-container">
        <div className="ledger-header">
          <div className="ledger-title-row">
            <span className="ledger-title">Session Map</span>
            <span className="ledger-pid-group">
              {assignment.participant_id} · {assignment.group}
            </span>
          </div>
        </div>
        <div className="ledger-empty">
          <span className="ledger-empty-text">Session not started</span>
        </div>
      </div>
    );
  }

  return (
    <div className="ledger-container">
      {/* Header */}
      <div className="ledger-header">
        <div className="ledger-title-row">
          <span className="ledger-title">Session Map</span>
          <span className="ledger-pid-group">
            {assignment.participant_id} · {assignment.group}
          </span>
        </div>
        <div className="ledger-progress">
          <div
            className="ledger-progress-fill"
            style={{ width: `${allComplete ? 100 : progress}%` }}
          />
        </div>
        <div className="ledger-progress-label">
          {allComplete ? "100% ✓ Complete" : `${progress}%`}
        </div>
      </div>

      {/* Phase list */}
      <div className="ledger-phase-list" ref={listRef}>
        {ledgerPhases.map((lp, i) => (
          <div key={lp.phase}>
            <LedgerPhaseCard
              phase={lp}
              isCompact={
                lp.status === "completed" &&
                i < ledgerPhases.length - 1 &&
                ledgerPhases.some((p) => p.status === "active" || (p.status === "completed" && p.phase > lp.phase))
              }
              onViewChunk={handleViewChunk}
              onViewSummary={onViewSummary}
              onViewCheckpoint={onViewCheckpoint}
            />
            {i < ledgerPhases.length - 1 && <div className="ledger-phase-divider" />}
          </div>
        ))}
      </div>

      {/* Footer */}
      {allComplete && (
        <div className="ledger-footer">
          Session complete. Thank you!
        </div>
      )}
    </div>
  );
}

// ── Helpers ──

function calculateProgress(phases: LedgerPhase[]): number {
  if (phases.length === 0) return 0;

  let totalSteps = 0;
  let completedSteps = 0;

  for (const phase of phases) {
    // Each phase has 4 steps: query, retrieval, summary, feedback
    totalSteps += 4;
    if (phase.query) completedSteps++;
    if (phase.retrieval) completedSteps++;
    if (phase.summary) completedSteps++;
    if (phase.feedback) completedSteps++;
  }

  return totalSteps === 0 ? 0 : Math.round((completedSteps / totalSteps) * 100);
}
