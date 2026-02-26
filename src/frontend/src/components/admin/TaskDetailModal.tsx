import type { AdminTaskFullDetail } from "../../types";

function formatTime(seconds: number | null): string {
  if (seconds == null) return "--";
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

function formatTs(iso: string | null): string {
  if (!iso) return "--";
  return new Date(iso).toLocaleString();
}

const MODE_LABELS: Record<string, string> = {
  baseline: "Baseline",
  hitl_r: "HITL-R",
  hitl_g: "HITL-G",
  hitl_full: "HITL-Full",
};

interface Props {
  task: AdminTaskFullDetail;
  onClose: () => void;
}

export default function TaskDetailModal({ task, onClose }: Props) {
  const modeClass = task.mode.replace("_", "");

  return (
    <div className="adm-modal-overlay" onClick={onClose}>
      <div className="adm-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="adm-modal-header">
          <div className="adm-modal-title-row">
            <h3>Task Detail — Phase {task.phase}</h3>
            <span className={`scp-card-mode-badge scp-mode-${modeClass}`}>
              {MODE_LABELS[task.mode] ?? task.mode}
            </span>
            <span className="adm-ticker-badge">{task.ticker}</span>
          </div>
          <button className="adm-close-btn" onClick={onClose}>
            &#x2715;
          </button>
        </div>

        {/* Timestamps bar */}
        <div className="adm-modal-meta">
          <span>Started: {formatTs(task.started_at)}</span>
          <span>Completed: {formatTs(task.completed_at)}</span>
          <span>Duration: {formatTime(task.time_on_task_seconds)}</span>
        </div>

        {/* Query */}
        <section className="adm-modal-section">
          <h4>Query</h4>
          <div className="adm-modal-block">{task.query_text}</div>
        </section>

        {/* Retrieval */}
        <section className="adm-modal-section">
          <h4>Retrieval</h4>
          <div className="adm-modal-stats-row">
            <span className="adm-stat-chip">
              {task.retrieved_count} retrieved
            </span>
            <span className="adm-stat-chip adm-chip-selected">
              {task.selected_count} selected
            </span>
            <span className="adm-stat-chip adm-chip-rejected">
              {task.rejected_count} rejected
            </span>
            <span className="adm-modal-ts">
              {formatTs(task.retrieval_completed_at)}
            </span>
          </div>

          {task.retrieved_nodes && task.retrieved_nodes.length > 0 && (
            <div className="adm-node-list">
              {task.retrieved_nodes.map((node, i) => {
                const nid = (node.node_id as string) || `node-${i}`;
                const isSelected = task.selected_node_ids?.includes(nid);
                const isRejected = task.rejected_node_ids?.includes(nid);
                return (
                  <div
                    key={nid}
                    className={`adm-node-row ${isSelected ? "selected" : ""} ${isRejected ? "rejected" : ""}`}
                  >
                    <span className="adm-node-idx">{i + 1}</span>
                    <span className="adm-node-title">
                      {(node.title as string) || "Untitled"}
                    </span>
                    <span className="adm-node-page">
                      p.{node.page_index as number}
                    </span>
                    {isSelected && <span className="adm-node-tag selected">Selected</span>}
                    {isRejected && <span className="adm-node-tag rejected">Rejected</span>}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Traversal Path */}
        {task.traversal_path && task.traversal_path.length > 0 && (
          <section className="adm-modal-section">
            <h4>Traversal Path</h4>
            <div className="adm-traversal-list">
              {task.traversal_path.map((step, i) => (
                <div key={i} className="adm-traversal-step">
                  <span className="adm-traversal-depth">
                    D{step.depth as number}
                  </span>
                  <span>{step.action as string}</span>
                  {step.count != null && (
                    <span className="adm-stat-chip">
                      {step.count as number} nodes
                    </span>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Generated Summary */}
        {task.generated_summary && (
          <section className="adm-modal-section">
            <h4>
              Generated Summary
              <span className="adm-modal-ts">
                {formatTs(task.generation_completed_at)}
              </span>
            </h4>
            <div className="adm-modal-block adm-summary-block">
              {task.generated_summary}
            </div>
          </section>
        )}

        {/* Edited Summary */}
        {task.edited_summary && (
          <section className="adm-modal-section">
            <h4>
              Edited Summary
              <span className="adm-stat-chip" style={{ marginLeft: 8 }}>
                {task.characters_edited ?? 0} chars edited
              </span>
              <span className="adm-modal-ts">
                {formatTs(task.edit_completed_at)}
              </span>
            </h4>
            <div className="adm-modal-block adm-summary-block">
              {task.edited_summary}
            </div>
          </section>
        )}

        {/* Flagged Spans */}
        {task.flagged_spans && task.flagged_spans.length > 0 && (
          <section className="adm-modal-section">
            <h4>Flagged Spans ({task.flagged_spans.length})</h4>
            <div className="adm-node-list">
              {task.flagged_spans.map((span, i) => (
                <div key={i} className="adm-node-row">
                  <span className="adm-node-tag rejected">
                    {span.reason as string}
                  </span>
                  <span className="adm-flagged-text">
                    "{span.text as string}"
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Feedback */}
        {task.feedback_responses && (
          <section className="adm-modal-section">
            <h4>
              Feedback
              <span className="adm-modal-ts">
                {formatTs(task.feedback_submitted_at)}
              </span>
            </h4>
            <div className="adm-feedback-grid">
              {Object.entries(task.feedback_responses).map(([key, val]) => (
                <div key={key} className="adm-feedback-item">
                  <span className="adm-feedback-key">{key}</span>
                  <span className="adm-feedback-val">{String(val)}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
