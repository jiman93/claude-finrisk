import { useState } from "react";

import { QUERIES, SEED_DEFINITIONS, TICKERS } from "../../data/checkpointDefinitions";
import type { Mode, PhaseAssignment, PhaseCheckpointRef } from "../../types";

interface PhaseCardProps {
  phase: PhaseAssignment;
  onChange: (updated: PhaseAssignment) => void;
  readOnly?: boolean;
}

const MODE_OPTIONS: Array<{ value: Mode; label: string }> = [
  { value: "baseline", label: "Baseline" },
  { value: "hitl_r", label: "HITL-R" },
  { value: "hitl_g", label: "HITL-G" },
  { value: "hitl_full", label: "HITL-Full" },
];

const MODE_COLORS: Record<string, string> = {
  baseline: "scp-mode-baseline",
  hitl_r: "scp-mode-hitlr",
  hitl_g: "scp-mode-hitlg",
  hitl_full: "scp-mode-hitlfull",
};

const POSITION_LABELS: Record<string, string> = {
  after_retrieval: "After Retrieval",
  after_generation: "After Generation",
  post_generation: "Post Generation",
};

function getCheckpointsForMode(mode: Mode): PhaseCheckpointRef[] {
  return SEED_DEFINITIONS
    .filter(
      (d) =>
        d.applicable_modes.includes(mode) || d.applicable_modes.includes("*")
    )
    .map((d) => ({
      definition_id: d.id,
      control_type: d.control_type,
      label: d.label,
      pipeline_position: d.pipeline_position,
      sort_order: d.sort_order,
    }));
}

export default function PhaseCard({ phase, onChange, readOnly }: PhaseCardProps) {
  const [expanded, setExpanded] = useState(false);

  function setMode(mode: Mode) {
    const newTicker = phase.ticker;
    const newQuery = phase.query;
    const newCheckpoints = getCheckpointsForMode(mode);
    onChange({ ...phase, mode, ticker: newTicker, query: newQuery, checkpoints: newCheckpoints });
  }

  function setTicker(ticker: string) {
    onChange({ ...phase, ticker, query: QUERIES[ticker] ?? phase.query });
  }

  function setQuery(query: string) {
    onChange({ ...phase, query });
  }

  function removeCheckpoint(defId: string) {
    onChange({
      ...phase,
      checkpoints: phase.checkpoints.filter((c) => c.definition_id !== defId),
    });
  }

  function addCheckpoint(defId: string) {
    const def = SEED_DEFINITIONS.find((d) => d.id === defId);
    if (!def) return;
    if (phase.checkpoints.some((c) => c.definition_id === defId)) return;
    onChange({
      ...phase,
      checkpoints: [
        ...phase.checkpoints,
        {
          definition_id: def.id,
          control_type: def.control_type,
          label: def.label,
          pipeline_position: def.pipeline_position,
          sort_order: def.sort_order,
        },
      ],
    });
  }

  function autoPopulateCheckpoints() {
    onChange({ ...phase, checkpoints: getCheckpointsForMode(phase.mode) });
  }

  const availableToAdd = SEED_DEFINITIONS.filter(
    (d) => !phase.checkpoints.some((c) => c.definition_id === d.id)
  );

  // Pipeline mini-flow
  const grouped = {
    after_retrieval: phase.checkpoints.filter((c) => c.pipeline_position === "after_retrieval"),
    after_generation: phase.checkpoints.filter((c) => c.pipeline_position === "after_generation"),
    post_generation: phase.checkpoints.filter((c) => c.pipeline_position === "post_generation"),
  };

  return (
    <div className={`scp-phase-card ${expanded ? "expanded" : ""}`}>
      <div className="scp-phase-header" onClick={() => setExpanded(!expanded)}>
        <span className="scp-phase-number">Phase {phase.phase}</span>
        <span className={`scp-mode-badge ${MODE_COLORS[phase.mode] ?? ""}`}>
          {MODE_OPTIONS.find((m) => m.value === phase.mode)?.label ?? phase.mode}
        </span>
        <span className="scp-phase-ticker">{phase.ticker}</span>
        <span className="scp-phase-cp-count">
          {phase.checkpoints.length} checkpoint{phase.checkpoints.length !== 1 ? "s" : ""}
        </span>
        <span className={`scp-phase-chevron ${expanded ? "open" : ""}`}>&#9654;</span>
      </div>

      {expanded && (
        <div className="scp-phase-body">
          {/* Mode selector */}
          <div className="scp-field-group">
            <label className="scp-field-label">Mode</label>
            <div className="scp-mode-chips">
              {MODE_OPTIONS.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  className={`cp-chip ${phase.mode === m.value ? "active" : ""}`}
                  onClick={() => !readOnly && setMode(m.value)}
                  disabled={readOnly}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Ticker selector */}
          <div className="scp-field-group">
            <label className="scp-field-label">Ticker</label>
            <div className="scp-ticker-chips">
              {TICKERS.map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`cp-chip ${phase.ticker === t ? "active" : ""}`}
                  onClick={() => !readOnly && setTicker(t)}
                  disabled={readOnly}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Query */}
          <div className="scp-field-group">
            <label className="scp-field-label">Research Query</label>
            <textarea
              className="pi-form-control pi-form-textarea"
              value={phase.query}
              onChange={(e) => setQuery(e.target.value)}
              rows={2}
              disabled={readOnly}
            />
          </div>

          {/* Checkpoints */}
          <div className="scp-field-group">
            <div className="scp-checkpoints-header">
              <label className="scp-field-label">Checkpoints</label>
              {!readOnly && (
                <button
                  type="button"
                  className="pi-status-action-btn"
                  onClick={autoPopulateCheckpoints}
                >
                  Auto-populate
                </button>
              )}
            </div>

            {phase.checkpoints.length === 0 && (
              <div className="scp-empty-hint">
                No checkpoints &mdash; this phase runs without HITL controls.
              </div>
            )}

            <div className="scp-checkpoint-list">
              {phase.checkpoints.map((cp) => (
                <div key={cp.definition_id} className="scp-checkpoint-item">
                  <span className="scp-checkpoint-label">{cp.label}</span>
                  <span className="scp-checkpoint-position">
                    {POSITION_LABELS[cp.pipeline_position] ?? cp.pipeline_position}
                  </span>
                  <span className="cp-control-badge">{cp.control_type}</span>
                  {!readOnly && (
                    <button
                      type="button"
                      className="fsb-remove-btn"
                      onClick={() => removeCheckpoint(cp.definition_id)}
                      title="Remove"
                    >
                      &#10005;
                    </button>
                  )}
                </div>
              ))}
            </div>

            {!readOnly && availableToAdd.length > 0 && (
              <div className="scp-add-checkpoint">
                <select
                  className="pi-form-control"
                  defaultValue=""
                  onChange={(e) => {
                    if (e.target.value) addCheckpoint(e.target.value);
                    e.target.value = "";
                  }}
                >
                  <option value="" disabled>
                    + Add checkpoint...
                  </option>
                  {availableToAdd.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Mini pipeline flow */}
          <div className="scp-field-group">
            <label className="scp-field-label">Pipeline Flow</label>
            <div className="scp-mini-pipeline">
              <span className="scp-pipe-node">Query</span>
              <span className="scp-pipe-arrow">&#8594;</span>
              <span className="scp-pipe-node">Retrieval</span>
              {grouped.after_retrieval.length > 0 && (
                <>
                  <span className="scp-pipe-arrow">&#8594;</span>
                  <span className="scp-pipe-node scp-pipe-checkpoint">
                    {grouped.after_retrieval.map((c) => c.control_type).join(", ")}
                  </span>
                </>
              )}
              <span className="scp-pipe-arrow">&#8594;</span>
              <span className="scp-pipe-node">Generation</span>
              {grouped.after_generation.length > 0 && (
                <>
                  <span className="scp-pipe-arrow">&#8594;</span>
                  <span className="scp-pipe-node scp-pipe-checkpoint">
                    {grouped.after_generation.map((c) => c.control_type).join(", ")}
                  </span>
                </>
              )}
              {grouped.post_generation.length > 0 && (
                <>
                  <span className="scp-pipe-arrow">&#8594;</span>
                  <span className="scp-pipe-node scp-pipe-checkpoint">
                    {grouped.post_generation.map((c) => c.control_type).join(", ")}
                  </span>
                </>
              )}
              <span className="scp-pipe-arrow">&#8594;</span>
              <span className="scp-pipe-node scp-pipe-done">Done</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
