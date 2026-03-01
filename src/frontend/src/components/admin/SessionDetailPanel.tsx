import { useAdminStore } from "../../stores/adminStore";
import type { AdminTaskDetail } from "../../types";

function formatTime(seconds: number | null): string {
  if (seconds == null) return "--";
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

function formatTs(iso: string | null): string {
  if (!iso) return "--";
  const utcIso = iso.endsWith("Z") || iso.includes("+") ? iso : iso + "Z";
  return new Date(utcIso).toLocaleString();
}

function relativeTime(iso: string): string {
  const utcIso = iso.endsWith("Z") || iso.includes("+") ? iso : iso + "Z";
  const diff = Date.now() - new Date(utcIso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

const MODE_LABELS: Record<string, string> = {
  baseline: "Baseline",
  hitl_r: "HITL-R",
  hitl_g: "HITL-G",
  hitl_full: "HITL-Full",
};

const STEPS = ["Query", "Retrieval", "Generation", "Editing", "Feedback"];

function stepStatus(task: AdminTaskDetail | undefined) {
  if (!task) return Array(5).fill("upcoming");
  return [
    task.started_at ? "done" : "upcoming",
    task.retrieval_completed_at ? "done" : task.started_at ? "active" : "upcoming",
    task.generation_completed_at
      ? "done"
      : task.retrieval_completed_at
        ? "active"
        : "upcoming",
    task.edit_completed_at
      ? "done"
      : task.generation_completed_at &&
          (task.mode === "hitl_g" || task.mode === "hitl_full")
        ? "active"
        : task.generation_completed_at
          ? "done"
          : "upcoming",
    task.feedback_submitted_at
      ? "done"
      : task.edit_completed_at || (task.generation_completed_at && task.mode === "baseline")
        ? "active"
        : "upcoming",
  ];
}

export default function SessionDetailPanel() {
  const session = useAdminStore((s) => s.selectedSession);
  const goBack = useAdminStore((s) => s.goBack);
  const fetchTaskDetail = useAdminStore((s) => s.fetchTaskDetail);

  if (!session) return null;

  const modeClass = session.current_mode.replace("_", "");

  // Build phase cards — one per phase (1-3)
  const phases = [1, 2, 3].map((p) => {
    const task = session.tasks.find((t) => t.phase === p);
    return { phase: p, task };
  });

  return (
    <div className="adm-session-panel">
      {/* Header */}
      <div className="adm-session-header">
        <button className="adm-back-btn" onClick={goBack}>
          &#8592; Back
        </button>
        <h2 className="adm-page-title">{session.participant_id}</h2>
        <span
          className={`scp-card-group group-${session.group.toLowerCase()}`}
        >
          Group {session.group}
        </span>
        <span className={`scp-card-mode-badge scp-mode-${modeClass}`}>
          Phase {session.current_phase} — {MODE_LABELS[session.current_mode]}
        </span>
        {session.ended_at ? (
          <span className="scp-status-badge completed">Completed</span>
        ) : (
          <span className="scp-status-badge in-progress">Active</span>
        )}
      </div>

      <div className="adm-session-meta">
        <span>Started: {relativeTime(session.started_at)}</span>
        <span>({formatTs(session.started_at)})</span>
        {session.ended_at && (
          <>
            <span> | Ended: {formatTs(session.ended_at)}</span>
          </>
        )}
      </div>

      {/* Phase cards */}
      <div className="adm-phase-cards">
        {phases.map(({ phase, task }) => {
          const statuses = stepStatus(task);
          const isActive = phase === session.current_phase && !session.ended_at;
          const isDone = task?.completed_at != null;

          return (
            <div
              key={phase}
              className={`adm-phase-card ${isActive ? "active" : ""} ${isDone ? "done" : ""}`}
            >
              <div className="adm-phase-card-header">
                <span className="adm-phase-num">Phase {phase}</span>
                {task && (
                  <>
                    <span
                      className={`scp-card-mode-badge scp-mode-${task.mode.replace("_", "")}`}
                    >
                      {MODE_LABELS[task.mode]}
                    </span>
                    <span className="adm-ticker-badge">{task.ticker}</span>
                    <span className="adm-phase-time">
                      {formatTime(task.time_on_task_seconds)}
                    </span>
                  </>
                )}
                {!task && (
                  <span className="adm-phase-pending">Not started</span>
                )}
              </div>

              {/* Step progress indicator */}
              <div className="adm-step-indicator">
                {STEPS.map((label, i) => (
                  <div key={label} className="adm-step-item">
                    <div className={`adm-step ${statuses[i]}`} />
                    <span className="adm-step-label">{label}</span>
                  </div>
                ))}
              </div>

              {/* Task summary card */}
              {task && (
                <div
                  className="adm-task-card"
                  onClick={() => fetchTaskDetail(task.task_id)}
                >
                  <div className="adm-task-query">
                    {task.query_text.length > 120
                      ? task.query_text.slice(0, 120) + "..."
                      : task.query_text}
                  </div>
                  <div className="adm-task-stats">
                    <span>
                      {task.retrieved_count} chunks
                      {task.selected_count > 0 &&
                        ` | ${task.selected_count} selected`}
                      {task.rejected_count > 0 &&
                        ` | ${task.rejected_count} rejected`}
                    </span>
                    {task.generated_summary_preview && (
                      <span className="adm-stat-chip adm-chip-selected">
                        Summary generated
                      </span>
                    )}
                    {task.characters_edited != null &&
                      task.characters_edited > 0 && (
                        <span className="adm-stat-chip">
                          {task.characters_edited} chars edited
                        </span>
                      )}
                    {task.feedback_submitted_at && (
                      <span className="adm-stat-chip adm-chip-selected">
                        Feedback submitted
                      </span>
                    )}
                  </div>
                  <div className="adm-task-preview">
                    {task.generated_summary_preview ||
                      task.edited_summary_preview || (
                        <span className="adm-muted">No summary yet</span>
                      )}
                  </div>
                  <div className="adm-task-click-hint">
                    Click to view full detail &#8594;
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
