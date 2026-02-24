import { useState } from "react";

import type { LedgerPhase } from "../../types";
import { cleanChunkPreview } from "../../utils/chunkText";

const MODE_LABELS: Record<string, string> = {
  baseline: "Baseline",
  hitl_r: "HITL-R",
  hitl_g: "HITL-G",
  hitl_full: "HITL-Full",
};

const MODE_COLORS: Record<string, string> = {
  baseline: "scp-mode-baseline",
  hitl_r: "scp-mode-hitlr",
  hitl_g: "scp-mode-hitlg",
  hitl_full: "scp-mode-hitlfull",
};

interface LedgerPhaseCardProps {
  phase: LedgerPhase;
  isCompact: boolean;
  onViewChunk: (phaseNum: number, chunkIndex: number) => void;
  onViewSummary: (label: string, text: string) => void;
  onViewCheckpoint: (label: string, fields: Array<{ label: string; value: string }>) => void;
}

export default function LedgerPhaseCard({
  phase,
  isCompact,
  onViewChunk,
  onViewSummary,
  onViewCheckpoint,
}: LedgerPhaseCardProps) {
  const [expanded, setExpanded] = useState(false);
  const showExpanded = phase.status === "active" || expanded || !isCompact;

  // Upcoming phase — collapsed one-liner
  if (phase.status === "upcoming") {
    return (
      <div className="ledger-phase upcoming">
        <PhaseHeader phase={phase} />
        <div className="ledger-upcoming-hint">
          Upcoming — query, {phase.mode === "hitl_r" || phase.mode === "hitl_full" ? "select chunks, " : ""}
          {phase.mode === "hitl_g" || phase.mode === "hitl_full" ? "edit summary, " : ""}
          questionnaire
        </div>
      </div>
    );
  }

  // Compact completed phase
  if (phase.status === "completed" && isCompact && !expanded) {
    return (
      <div className="ledger-phase completed" onClick={() => setExpanded(true)} style={{ cursor: "pointer" }}>
        <PhaseHeader phase={phase} />
        <CompactSections
          phase={phase}
          onViewChunk={onViewChunk}
          onViewSummary={onViewSummary}
          onViewCheckpoint={onViewCheckpoint}
        />
      </div>
    );
  }

  // Expanded view (active or expanded completed)
  return (
    <div className={`ledger-phase ${phase.status}`}>
      <PhaseHeader
        phase={phase}
        onToggle={phase.status === "completed" ? () => setExpanded(false) : undefined}
      />

      {/* QUERY section */}
      <div className="ledger-section">
        <div className="ledger-section-label">Query</div>
        {phase.query ? (
          <div className="ledger-query-block">"{phase.query.text}"</div>
        ) : (
          <div className="ledger-pending">
            {phase.activeStep === "query" ? (
              <span className="ledger-active-indicator">● Awaiting query...</span>
            ) : (
              "○ Pending"
            )}
          </div>
        )}
      </div>

      {/* RETRIEVAL section */}
      <div className="ledger-section">
        <div className="ledger-section-row">
          <span className="ledger-section-label">Retrieval</span>
          {phase.retrieval && phase.retrieval.chunks.length > 0 && phase.status === "completed" && (
            <button
              type="button"
              className="ledger-view-btn"
              onClick={() => onViewChunk(phase.phase, 0)}
            >
              View
            </button>
          )}
        </div>
        {phase.retrieval ? (
          <>
            <div className="ledger-retrieval-summary">
              {phase.retrieval.selectionEnabled
                ? `${phase.retrieval.totalRetrieved} retrieved → ${phase.retrieval.totalSelected} selected`
                : `${phase.retrieval.totalRetrieved} chunks (auto)`}
              {phase.activeStep === "retrieval" && phase.retrieval.selectionEnabled && (
                <span className="ledger-current-marker"> ← CURRENT</span>
              )}
            </div>
            {phase.retrieval.chunks.length > 0 && (
              <div className="ledger-chunk-grid">
                {phase.retrieval.chunks.map((chunk) => (
                  <button
                    key={chunk.id}
                    type="button"
                    className={`ledger-chunk-box ${
                      phase.retrieval!.selectionEnabled
                        ? chunk.selected ? "selected" : "rejected"
                        : "auto"
                    }`}
                    onClick={() => onViewChunk(phase.phase, chunk.index - 1)}
                    title={`Chunk ${chunk.index}: ${cleanChunkPreview(chunk.title)}`}
                  >
                    {phase.retrieval!.selectionEnabled
                      ? `${chunk.selected ? "✓" : "✗"}${chunk.index}`
                      : chunk.index}
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="ledger-pending">
            {phase.activeStep === "retrieval" ? (
              <span className="ledger-active-indicator">◌ Retrieving chunks...</span>
            ) : (
              "○ Pending"
            )}
          </div>
        )}
      </div>

      {/* SUMMARY section */}
      <div className="ledger-section">
        <div className="ledger-section-row">
          <span className="ledger-section-label">
            Summary{phase.summary?.wasEdited ? " (edited)" : ""}
          </span>
          {phase.summary && (
            <button
              type="button"
              className="ledger-view-btn"
              onClick={() => onViewSummary(
                `Phase ${phase.phase} Summary${phase.summary!.wasEdited ? " (edited)" : ""}`,
                phase.summary!.text
              )}
            >
              View
            </button>
          )}
        </div>
        {phase.summary ? (
          <div className="ledger-summary-preview">
            {phase.summary.text.slice(0, 150)}
            {phase.summary.text.length > 150 ? "..." : ""}
          </div>
        ) : (
          <div className="ledger-pending">
            {phase.activeStep === "generation" ? (
              <span className="ledger-active-indicator">◌ Waiting for generation...</span>
            ) : phase.activeStep === "edit" ? (
              <span className="ledger-active-indicator">● Editing summary... ← CURRENT</span>
            ) : (
              "○ Pending"
            )}
          </div>
        )}
      </div>

      {/* FEEDBACK section — not shown for baseline phases */}
      {phase.mode !== "baseline" && (
        <div className="ledger-section">
          <div className="ledger-section-row">
            <span className="ledger-section-label">Feedback</span>
            {phase.feedback && (
              <button
                type="button"
                className="ledger-view-btn"
                onClick={() => {
                  const fields = buildFeedbackFields(phase.feedback!);
                  onViewCheckpoint(`Phase ${phase.phase} Feedback`, fields);
                }}
              >
                View responses
              </button>
            )}
          </div>
          {phase.feedback ? (
            <div className="ledger-feedback-row">
              {phase.feedback.completeness != null && (
                <FeedbackItem label="C" value={phase.feedback.completeness} />
              )}
              {phase.feedback.accuracy != null && (
                <FeedbackItem label="A" value={phase.feedback.accuracy} />
              )}
              {phase.feedback.perceivedControl != null && (
                <FeedbackItem label="Ctrl" value={phase.feedback.perceivedControl} />
              )}
              {phase.feedback.citationHelpfulness != null && (
                <FeedbackItem label="Cite" value={phase.feedback.citationHelpfulness} />
              )}
            </div>
          ) : (
            <div className="ledger-pending">
              {phase.activeStep === "questionnaire" ? (
                <span className="ledger-active-indicator">● Questionnaire... ← CURRENT</span>
              ) : (
                "○ Pending"
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Sub-components ──

function PhaseHeader({
  phase,
  onToggle,
}: {
  phase: LedgerPhase;
  onToggle?: () => void;
}) {
  const statusIcon =
    phase.status === "completed" ? "✓" : phase.status === "active" ? "●" : "○";
  const statusClass =
    phase.status === "completed" ? "done" : phase.status === "active" ? "active" : "upcoming";

  return (
    <div className="ledger-phase-header" onClick={onToggle}>
      <span className={`ledger-phase-check ${statusClass}`}>{statusIcon}</span>
      <span className="ledger-phase-label">
        PHASE {phase.phase}
      </span>
      <span className={`scp-mode-badge ${MODE_COLORS[phase.mode] ?? ""}`}>
        {MODE_LABELS[phase.mode] ?? phase.mode}
      </span>
      <span className="ledger-phase-ticker">{phase.ticker}</span>
    </div>
  );
}

function CompactSections({
  phase,
  onViewChunk,
  onViewSummary,
  onViewCheckpoint,
}: {
  phase: LedgerPhase;
  onViewChunk: (phaseNum: number, chunkIndex: number) => void;
  onViewSummary: (label: string, text: string) => void;
  onViewCheckpoint: (label: string, fields: Array<{ label: string; value: string }>) => void;
}) {
  return (
    <div className="ledger-compact-sections">
      {phase.query && (
        <div className="ledger-compact-line">
          <span className="ledger-compact-label">QUERY</span>
          <span className="ledger-compact-value">
            "{phase.query.text.length > 40
              ? phase.query.text.slice(0, 40) + "..."
              : phase.query.text}"
          </span>
        </div>
      )}
      {phase.retrieval && (
        <div className="ledger-compact-line">
          <span className="ledger-compact-label">RETRIEVAL</span>
          <span className="ledger-compact-value">
            {phase.retrieval.selectionEnabled
              ? `${phase.retrieval.totalRetrieved} → ${phase.retrieval.totalSelected} selected`
              : `${phase.retrieval.totalRetrieved} chunks (auto)`}
          </span>
          {phase.retrieval.chunks.length > 0 && (
            <button
              type="button"
              className="ledger-view-btn"
              onClick={(e) => {
                e.stopPropagation();
                onViewChunk(phase.phase, 0);
              }}
            >
              View
            </button>
          )}
        </div>
      )}
      {phase.summary && (
        <div className="ledger-compact-line">
          <span className="ledger-compact-label">SUMMARY</span>
          <span className="ledger-compact-value">
            {countParagraphs(phase.summary.text)} paragraphs
            {phase.summary.wasEdited ? " (edited)" : ""}
          </span>
          <button
            type="button"
            className="ledger-view-btn"
            onClick={(e) => {
              e.stopPropagation();
              onViewSummary(
                `Phase ${phase.phase} Summary`,
                phase.summary!.text
              );
            }}
          >
            View
          </button>
        </div>
      )}
      {phase.feedback && (
        <div className="ledger-compact-line">
          <span className="ledger-compact-label">FEEDBACK</span>
          <span className="ledger-compact-value">
            {phase.feedback.completeness != null ? `C:${phase.feedback.completeness}` : ""}
            {phase.feedback.accuracy != null ? ` A:${phase.feedback.accuracy}` : ""}
            {phase.feedback.perceivedControl != null ? ` Ctrl:${phase.feedback.perceivedControl}` : ""}
            {phase.feedback.citationHelpfulness != null ? ` Cite:${capitalize(phase.feedback.citationHelpfulness)}` : ""}
          </span>
          <button
            type="button"
            className="ledger-view-btn"
            onClick={(e) => {
              e.stopPropagation();
              const fields = buildFeedbackFields(phase.feedback!);
              onViewCheckpoint(`Phase ${phase.phase} Feedback`, fields);
            }}
          >
            Detail
          </button>
        </div>
      )}
    </div>
  );
}

function FeedbackItem({ label, value }: { label: string; value: string | number }) {
  return (
    <span className="ledger-feedback-item">
      <span className="ledger-feedback-label">{label}:</span>
      <span className="ledger-feedback-value">
        {typeof value === "string" ? capitalize(value) : value}
      </span>
    </span>
  );
}

// ── Helpers ──

function countParagraphs(text: string): number {
  return text.split(/\n\s*\n/).filter((p) => p.trim().length > 0).length || 1;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function buildFeedbackFields(
  feedback: NonNullable<LedgerPhase["feedback"]>
): Array<{ label: string; value: string }> {
  const fields: Array<{ label: string; value: string }> = [];
  if (feedback.completeness != null) fields.push({ label: "Completeness", value: String(feedback.completeness) });
  if (feedback.accuracy != null) fields.push({ label: "Accuracy", value: String(feedback.accuracy) });
  if (feedback.perceivedControl != null) fields.push({ label: "Perceived Control", value: String(feedback.perceivedControl) });
  if (feedback.featureUsefulness != null) fields.push({ label: "Feature Usefulness", value: String(feedback.featureUsefulness) });
  if (feedback.citationHelpfulness != null) fields.push({ label: "Citation Helpfulness", value: capitalize(feedback.citationHelpfulness) });
  if (feedback.openFeedback) fields.push({ label: "Open Feedback", value: feedback.openFeedback });
  return fields;
}
