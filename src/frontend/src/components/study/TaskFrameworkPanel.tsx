import type { TFPState, TFPDetailView, RetrievalNode } from "../../types";
import FormattedMarkdown from "../FormattedMarkdown";

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

interface TaskFrameworkPanelProps {
  tfpState: TFPState;
  isOpen: boolean;
  onClose: () => void;
  detailView: TFPDetailView | null;
  onDetailView: (detail: TFPDetailView) => void;
  onCloseDetail: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

export default function TaskFrameworkPanel({
  tfpState,
  isOpen,
  onClose,
  detailView,
  onDetailView,
  onCloseDetail,
}: TaskFrameworkPanelProps) {
  return (
    <div className={`tfp-drawer ${isOpen ? "tfp-open" : ""}`}>
      {/* ── Detail overlay (nested on top of drawer) ── */}
      {detailView && (
        <div className="tfp-detail-overlay">
          <div className="tfp-detail-header">
            <button
              type="button"
              className="tfp-detail-back"
              onClick={onCloseDetail}
            >
              &#8592; Back
            </button>
            <span className="tfp-detail-title">{detailView.label}</span>
          </div>
          <div className="tfp-detail-body">
            {detailView.content === "markdown" && detailView.text && (
              <FormattedMarkdown text={detailView.text} />
            )}
            {detailView.content === "fields" && detailView.fields && (
              <div className="scg-cp-detail-list">
                {detailView.fields.map((f, i) => (
                  <div key={i} className="scg-cp-detail-row">
                    <span className="scg-cp-detail-label">{f.label}</span>
                    <span className="scg-cp-detail-value">{f.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Drawer header ── */}
      <div className="tfp-header">
        <span className="tfp-title">Task Framework</span>
        <button type="button" className="tfp-close-btn" onClick={onClose}>
          &#10005;
        </button>
      </div>

      {/* ── Scrollable sections ── */}
      <div className="tfp-body">
        <TFPTaskDefinition data={tfpState.taskDefinition} />
        <TFPEvidenceSection
          data={tfpState.evidence}
          onViewChunks={(nodes) =>
            onDetailView({
              label: "Retrieved Chunks",
              content: "fields",
              fields: nodes.map((n) => ({
                label: `${n.title} (p.${n.page_index})`,
                value: n.relevant_content,
              })),
            })
          }
        />
        <TFPSummarySection
          data={tfpState.summary}
          onViewSummary={(text) =>
            onDetailView({ label: "Summary", content: "markdown", text })
          }
        />
        <TFPCheckpointSection
          data={tfpState.checkpoints}
          onViewCheckpoint={(label, fields) =>
            onDetailView({ label, content: "fields", fields })
          }
        />
        <TFPWorkflowProgress steps={tfpState.pipelineSteps} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section: Task Definition
// ─────────────────────────────────────────────────────────────────────────────

function TFPTaskDefinition({
  data,
}: {
  data: TFPState["taskDefinition"];
}) {
  if (!data) return null;

  const modeLabels: Record<string, string> = {
    baseline: "Baseline",
    hitl_r: "HITL-R",
    hitl_g: "HITL-G",
    hitl_full: "HITL-Full",
  };

  return (
    <div className="tfp-section" id="tfp-task-definition">
      <div className="tfp-section-title">Task Definition</div>
      <div className="tfp-kv-grid">
        <span className="tfp-kv-label">Phase</span>
        <span className="tfp-kv-value">{data.phase} / 3</span>
        <span className="tfp-kv-label">Mode</span>
        <span className="tfp-kv-value tfp-mode-badge">
          {modeLabels[data.mode] ?? data.mode}
        </span>
        <span className="tfp-kv-label">Ticker</span>
        <span className="tfp-kv-value">{data.ticker}</span>
        <span className="tfp-kv-label">Query</span>
        <span className="tfp-kv-value tfp-query-text">{data.query}</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section: Evidence Framework
// ─────────────────────────────────────────────────────────────────────────────

function TFPEvidenceSection({
  data,
  onViewChunks,
}: {
  data: TFPState["evidence"];
  onViewChunks: (nodes: RetrievalNode[]) => void;
}) {
  return (
    <div className="tfp-section" id="tfp-evidence">
      <div className="tfp-section-title">Evidence</div>
      {!data ? (
        <div className="tfp-empty">Awaiting retrieval&hellip;</div>
      ) : (
        <>
          <div className="tfp-kv-grid">
            <span className="tfp-kv-label">Retrieved</span>
            <span className="tfp-kv-value">
              {data.retrievedNodes.length} chunks
            </span>
            {data.selectedNodeIds !== null && (
              <>
                <span className="tfp-kv-label">Selected</span>
                <span className="tfp-kv-value">
                  {data.selectedNodeIds.length} /{" "}
                  {data.retrievedNodes.length}
                </span>
              </>
            )}
          </div>

          {/* Coverage bar */}
          <div className="tfp-coverage-bar">
            <div
              className="tfp-coverage-fill"
              style={{ width: `${Math.round(data.coverageRatio * 100)}%` }}
            />
          </div>
          <div className="tfp-coverage-label">
            {Math.round(data.coverageRatio * 100)}% coverage
          </div>

          <button
            type="button"
            className="tfp-view-link"
            onClick={() => onViewChunks(data.retrievedNodes)}
          >
            View chunks &rarr;
          </button>
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section: Summary
// ─────────────────────────────────────────────────────────────────────────────

function TFPSummarySection({
  data,
  onViewSummary,
}: {
  data: TFPState["summary"];
  onViewSummary: (text: string) => void;
}) {
  return (
    <div className="tfp-section" id="tfp-summary">
      <div className="tfp-section-title">Summary</div>
      {!data ? (
        <div className="tfp-empty">Awaiting generation&hellip;</div>
      ) : (
        <>
          <div className="tfp-kv-grid">
            <span className="tfp-kv-label">Status</span>
            <span className="tfp-kv-value">
              {data.wasEdited ? "Edited" : "Generated"}
            </span>
            <span className="tfp-kv-label">Word count</span>
            <span className="tfp-kv-value">
              {(data.editedText ?? data.generatedText ?? "")
                .split(/\s+/)
                .filter(Boolean).length}
            </span>
          </div>

          <button
            type="button"
            className="tfp-view-link"
            onClick={() =>
              onViewSummary(
                data.editedText ?? data.generatedText ?? "",
              )
            }
          >
            View summary &rarr;
          </button>
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section: Checkpoints
// ─────────────────────────────────────────────────────────────────────────────

function TFPCheckpointSection({
  data,
  onViewCheckpoint,
}: {
  data: TFPState["checkpoints"];
  onViewCheckpoint: (
    label: string,
    fields: Array<{ label: string; value: string }>,
  ) => void;
}) {
  return (
    <div className="tfp-section" id="tfp-checkpoints">
      <div className="tfp-section-title">Checkpoints</div>
      {data.length === 0 ? (
        <div className="tfp-empty">No checkpoints yet</div>
      ) : (
        <div className="tfp-checkpoint-list">
          {data.map((cp, i) => (
            <div key={i} className="tfp-checkpoint-row">
              <span
                className={`tfp-checkpoint-icon ${cp.state === "submitted" ? "submitted" : "skipped"}`}
              >
                {cp.state === "submitted" ? "\u2713" : "\u2014"}
              </span>
              <span className="tfp-checkpoint-label">{cp.label}</span>
              <span
                className={`tfp-checkpoint-badge ${cp.state}`}
              >
                {cp.state === "submitted" ? "Submitted" : "Skipped"}
              </span>
              {cp.state === "submitted" && cp.fields.length > 0 && (
                <button
                  type="button"
                  className="tfp-view-link"
                  onClick={() => onViewCheckpoint(cp.label, cp.fields)}
                >
                  View
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section: Workflow Progress
// ─────────────────────────────────────────────────────────────────────────────

function TFPWorkflowProgress({
  steps,
}: {
  steps: TFPState["pipelineSteps"];
}) {
  if (steps.length === 0) return null;

  const icons: Record<string, string> = {
    completed: "\u2713",
    active: "\u25CF",
    pending: "\u25CB",
    skipped: "\u2014",
  };

  return (
    <div className="tfp-section" id="tfp-workflow">
      <div className="tfp-section-title">Workflow Progress</div>
      <div className="tfp-step-list">
        {steps.map((s) => (
          <div key={s.step} className={`tfp-step-item ${s.status}`}>
            <span className="tfp-step-icon">{icons[s.status]}</span>
            <span className="tfp-step-label">{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
