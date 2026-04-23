import type { ParticipantAssignment } from "../../types";

interface ParticipantGridProps {
  assignments: ParticipantAssignment[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export default function ParticipantGrid({
  assignments,
  selectedId,
  onSelect,
}: ParticipantGridProps) {
  return (
    <div className="scp-participant-grid">
      {assignments.map((a) => (
        <div
          key={a.participant_id}
          className={`scp-participant-card ${
            selectedId === a.participant_id ? "scp-selected" : ""
          }`}
          onClick={() => onSelect(a.participant_id)}
        >
          <div className="scp-card-header">
            <span className="scp-card-id">
              {a.participant_id}
              {a.override && <span className="scp-override-dot" title="Overridden" />}
            </span>
          </div>

          <div className="scp-card-tickers">
            {a.phases.map((p, i) => (
              <span key={p.phase}>
                {i > 0 && <span className="scp-ticker-arrow"> &#8594; </span>}
                <span className="scp-ticker-tag">{p.ticker}</span>
              </span>
            ))}
          </div>

          <div className="scp-card-modes">
            {a.phases.map((p) => (
              <span
                key={p.phase}
                className={`scp-card-mode-badge scp-mode-${p.mode.replace("_", "")}`}
              >
                {p.mode === "baseline"
                  ? "BL"
                  : p.mode === "hitl_r"
                    ? "R"
                    : p.mode === "hitl_g"
                      ? "G"
                      : "Full"}
              </span>
            ))}
          </div>

          <div className="scp-card-status">
            <span className={`scp-status-badge ${a.status.replace("_", "-")}`}>
              {a.status === "not_started"
                ? "Not Started"
                : a.status === "in_progress"
                  ? "In Progress"
                  : "Completed"}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
