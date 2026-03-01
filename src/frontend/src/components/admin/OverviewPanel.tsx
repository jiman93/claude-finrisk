import { useState } from "react";

import { useAdminStore } from "../../stores/adminStore";
import type { AdminActivityEvent, AdminParticipantRow } from "../../types";

// ── Helpers ──

function formatTime(seconds: number | null | undefined): string {
  if (seconds == null) return "--";
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
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

type SortKey = "participant_id" | "group" | "assignment_status" | "current_phase" | "phases_completed" | "total_time_seconds";

// ── Participant Table ──

function ParticipantTable({
  participants,
  onClickRow,
}: {
  participants: AdminParticipantRow[];
  onClickRow: (sessionId: string) => void;
}) {
  const [sortKey, setSortKey] = useState<SortKey>("participant_id");
  const [sortAsc, setSortAsc] = useState(true);

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortAsc(!sortAsc);
    else {
      setSortKey(key);
      setSortAsc(true);
    }
  }

  const sorted = [...participants].sort((a, b) => {
    const va = a[sortKey];
    const vb = b[sortKey];
    if (va == null && vb == null) return 0;
    if (va == null) return 1;
    if (vb == null) return -1;
    const cmp = va < vb ? -1 : va > vb ? 1 : 0;
    return sortAsc ? cmp : -cmp;
  });

  const arrow = (key: SortKey) =>
    sortKey === key ? (sortAsc ? " \u25B4" : " \u25BE") : "";

  return (
    <table className="adm-table">
      <thead>
        <tr>
          <th onClick={() => handleSort("participant_id")}>
            ID{arrow("participant_id")}
          </th>
          <th onClick={() => handleSort("group")}>
            Group{arrow("group")}
          </th>
          <th onClick={() => handleSort("assignment_status")}>
            Status{arrow("assignment_status")}
          </th>
          <th onClick={() => handleSort("current_phase")}>
            Phase{arrow("current_phase")}
          </th>
          <th>Mode</th>
          <th onClick={() => handleSort("phases_completed")}>
            Progress{arrow("phases_completed")}
          </th>
          <th onClick={() => handleSort("total_time_seconds")}>
            Time{arrow("total_time_seconds")}
          </th>
          <th>Started</th>
        </tr>
      </thead>
      <tbody>
        {sorted.map((p) => {
          const hasSession = !!p.session_id;
          const statusClass = p.assignment_status.replace("_", "-");
          return (
            <tr
              key={p.participant_id}
              className={hasSession ? "adm-clickable" : "adm-no-session"}
              onClick={() => hasSession && onClickRow(p.session_id!)}
            >
              <td>
                <strong>{p.participant_id}</strong>
              </td>
              <td>
                <span
                  className={`scp-card-group group-${p.group.toLowerCase()}`}
                >
                  {p.group}
                </span>
              </td>
              <td>
                <span className={`scp-status-badge ${statusClass}`}>
                  {p.assignment_status.replace("_", " ")}
                </span>
              </td>
              <td>{p.current_phase != null ? `${p.current_phase}/3` : "--"}</td>
              <td>
                {p.current_mode ? (
                  <span
                    className={`scp-card-mode-badge scp-mode-${p.current_mode.replace("_", "")}`}
                  >
                    {MODE_LABELS[p.current_mode]}
                  </span>
                ) : (
                  "--"
                )}
              </td>
              <td>
                <div className="adm-progress-bar">
                  <div
                    className="adm-progress-fill"
                    style={{
                      width: `${(p.phases_completed / 3) * 100}%`,
                    }}
                  />
                </div>
                <span className="adm-progress-text">
                  {p.phases_completed}/3
                </span>
              </td>
              <td>{formatTime(p.total_time_seconds)}</td>
              <td>
                {p.session_started_at
                  ? relativeTime(p.session_started_at)
                  : "--"}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

// ── Activity Feed ──

function ActivityFeed({ events }: { events: AdminActivityEvent[] }) {
  if (events.length === 0) {
    return (
      <div className="adm-activity">
        <div className="adm-activity-title">Activity</div>
        <div className="adm-muted">No activity yet</div>
      </div>
    );
  }

  return (
    <div className="adm-activity">
      <div className="adm-activity-title">Recent Activity</div>
      {events.map((e, i) => (
        <div key={i} className="adm-event">
          <span className={`adm-event-dot ${e.event_type}`} />
          <span className="adm-event-detail">{e.detail}</span>
          <span className="adm-event-time">{relativeTime(e.timestamp)}</span>
        </div>
      ))}
    </div>
  );
}

// ── Main Overview Panel ──

export default function OverviewPanel() {
  const overview = useAdminStore((s) => s.overview);
  const participants = useAdminStore((s) => s.participants);
  const activityFeed = useAdminStore((s) => s.activityFeed);
  const isLoading = useAdminStore((s) => s.isLoading);
  const error = useAdminStore((s) => s.error);
  const autoRefresh = useAdminStore((s) => s.autoRefresh);
  const toggleAutoRefresh = useAdminStore((s) => s.toggleAutoRefresh);
  const fetchOverview = useAdminStore((s) => s.fetchOverview);
  const fetchActivity = useAdminStore((s) => s.fetchActivity);
  const fetchSessionDetail = useAdminStore((s) => s.fetchSessionDetail);

  function handleRefresh() {
    fetchOverview();
    fetchActivity();
  }

  return (
    <div className="adm-overview">
      {/* Header */}
      <div className="adm-overview-header">
        <h2 className="adm-page-title">Study Monitor</h2>
        <div className="adm-header-actions">
          <button className="pi-pill-btn" onClick={handleRefresh}>
            {isLoading ? "Refreshing..." : "Refresh"}
          </button>
          <button
            className={`pi-pill-btn ${autoRefresh ? "accent" : ""}`}
            onClick={toggleAutoRefresh}
          >
            <span className={`adm-refresh-dot ${autoRefresh ? "on" : "off"}`} />
            Auto {autoRefresh ? "ON" : "OFF"}
          </button>
        </div>
      </div>

      {error && <div className="adm-error">{error}</div>}

      {/* Stats row */}
      {overview && (
        <div className="adm-stats-row">
          <div className="adm-stat-card">
            <div className="adm-stat-value">{overview.total_participants}</div>
            <div className="adm-stat-label">Total</div>
          </div>
          <div className="adm-stat-card">
            <div className="adm-stat-value adm-val-muted">
              {overview.not_started}
            </div>
            <div className="adm-stat-label">Not Started</div>
          </div>
          <div className="adm-stat-card">
            <div className="adm-stat-value adm-val-active">
              {overview.in_progress}
            </div>
            <div className="adm-stat-label">In Progress</div>
          </div>
          <div className="adm-stat-card">
            <div className="adm-stat-value adm-val-done">
              {overview.completed}
            </div>
            <div className="adm-stat-label">Completed</div>
          </div>
          <div className="adm-stat-card">
            <div className="adm-stat-value">
              {overview.completion_pct}%
            </div>
            <div className="adm-stat-label">Completion</div>
          </div>
          <div className="adm-stat-card">
            <div className="adm-stat-value">
              {formatTime(
                overview.avg_time_on_task_seconds
                  ? Math.round(overview.avg_time_on_task_seconds)
                  : null
              )}
            </div>
            <div className="adm-stat-label">Avg Task Time</div>
          </div>
        </div>
      )}

      {/* Body: table + activity */}
      <div className="adm-body">
        <div className="adm-table-wrap">
          <ParticipantTable
            participants={participants}
            onClickRow={fetchSessionDetail}
          />
        </div>
        <ActivityFeed events={activityFeed} />
      </div>
    </div>
  );
}
