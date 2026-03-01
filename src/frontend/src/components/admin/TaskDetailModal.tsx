import type { AdminTaskFullDetail } from "../../types";

function formatTime(seconds: number | null): string {
  if (seconds == null) return "--";
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

function formatMs(ms: number | null | undefined): string {
  if (ms == null) return "--";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatTs(iso: string | null): string {
  if (!iso) return "--";
  const utcIso = iso.endsWith("Z") || iso.includes("+") ? iso : iso + "Z";
  return new Date(utcIso).toLocaleString();
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
  const gen = task.llm_metrics?.generation;
  const nav = task.llm_metrics?.navigation;

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
          {task.pdf_view_duration_ms != null && task.pdf_view_duration_ms > 0 && (
            <span>PDF viewed: {formatMs(task.pdf_view_duration_ms)}</span>
          )}
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

        {/* LLM Metrics */}
        {(gen || nav) && (
          <section className="adm-modal-section">
            <h4>LLM Metrics</h4>
            <div className="adm-feedback-grid">
              {gen && (
                <>
                  <div className="adm-feedback-item">
                    <span className="adm-feedback-key">Generation model</span>
                    <span className="adm-feedback-val">{gen.model}</span>
                  </div>
                  <div className="adm-feedback-item">
                    <span className="adm-feedback-key">Generation tokens</span>
                    <span className="adm-feedback-val">
                      {gen.prompt_tokens} in / {gen.completion_tokens} out
                    </span>
                  </div>
                  <div className="adm-feedback-item">
                    <span className="adm-feedback-key">Generation latency</span>
                    <span className="adm-feedback-val">{formatMs(gen.duration_ms)}</span>
                  </div>
                </>
              )}
              {nav && nav.length > 0 && (
                <>
                  <div className="adm-feedback-item">
                    <span className="adm-feedback-key">Navigation model</span>
                    <span className="adm-feedback-val">{nav[0].model}</span>
                  </div>
                  <div className="adm-feedback-item">
                    <span className="adm-feedback-key">Navigation calls</span>
                    <span className="adm-feedback-val">{nav.length}</span>
                  </div>
                  <div className="adm-feedback-item">
                    <span className="adm-feedback-key">Nav total tokens</span>
                    <span className="adm-feedback-val">
                      {nav.reduce((s, n) => s + n.prompt_tokens, 0)} in /{" "}
                      {nav.reduce((s, n) => s + n.completion_tokens, 0)} out
                    </span>
                  </div>
                  <div className="adm-feedback-item">
                    <span className="adm-feedback-key">Nav total latency</span>
                    <span className="adm-feedback-val">
                      {formatMs(nav.reduce((s, n) => s + n.duration_ms, 0))}
                    </span>
                  </div>
                </>
              )}
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
                {task.characters_edited ?? 0} chars
              </span>
              {task.edit_distance != null && (
                <span className="adm-stat-chip" style={{ marginLeft: 4 }}>
                  {task.edit_distance} words Levenshtein
                </span>
              )}
              {task.edit_similarity != null && (
                <span className="adm-stat-chip" style={{ marginLeft: 4 }}>
                  {Math.round(task.edit_similarity * 100)}% similar
                </span>
              )}
              <span className="adm-modal-ts">
                {formatTs(task.edit_completed_at)}
              </span>
            </h4>
            {task.first_edit_at && task.generation_completed_at && (
              <div className="adm-modal-meta" style={{ marginBottom: 8 }}>
                <span>
                  Deliberation:{" "}
                  {formatTime(
                    Math.round(
                      (new Date(task.first_edit_at).getTime() -
                        new Date(task.generation_completed_at).getTime()) /
                        1000
                    )
                  )}
                </span>
                <span>First edit: {formatTs(task.first_edit_at)}</span>
              </div>
            )}
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
