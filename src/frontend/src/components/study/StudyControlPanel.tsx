import { useEffect } from "react";

import { useAssignmentStore } from "../../stores/assignmentStore";
import type { PhaseAssignment } from "../../types";
import ParticipantEditor from "./ParticipantEditor";
import ParticipantGrid from "./ParticipantGrid";

interface StudyControlPanelProps {
  onBack: () => void;
}

export default function StudyControlPanel({ onBack }: StudyControlPanelProps) {
  const {
    assignments,
    selectedParticipantId,
    isLoading,
    error,
    fetchAssignments,
    selectParticipant,
    updateAssignment,
    resetAssignment,
    regenerateDefaults,
  } = useAssignmentStore();

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  const selected = assignments.find(
    (a) => a.participant_id === selectedParticipantId
  );

  function handleSave(phases: PhaseAssignment[]) {
    if (!selectedParticipantId) return;
    updateAssignment(selectedParticipantId, phases);
  }

  function handleReset() {
    if (!selectedParticipantId) return;
    resetAssignment(selectedParticipantId);
  }

  // Stats
  const total = assignments.length;
  const started = assignments.filter((a) => a.status === "in_progress").length;
  const completed = assignments.filter((a) => a.status === "completed").length;
  const overridden = assignments.filter((a) => a.override).length;

  // Editor view
  if (selected) {
    return (
      <div className="scp-container">
        <ParticipantEditor
          key={selected.participant_id + selected.updated_at}
          assignment={selected}
          onSave={handleSave}
          onReset={handleReset}
          onBack={() => selectParticipant(null)}
          isSaving={isLoading}
        />
      </div>
    );
  }

  // List/grid view
  return (
    <div className="scp-container">
      <div className="scp-topbar">
        <h2 className="scp-page-title">Study Control Panel</h2>
        <div className="scp-topbar-actions">
          <button
            type="button"
            className="pi-secondary-btn"
            onClick={() => {
              if (
                window.confirm(
                  "This will reset ALL participant assignments to computed defaults. Continue?"
                )
              ) {
                regenerateDefaults();
              }
            }}
            disabled={isLoading}
          >
            Regenerate Defaults
          </button>
        </div>
      </div>

      {error && <div className="scp-error">{error}</div>}

      <div className="scp-stats-row">
        <div className="cpd-stat-card">
          <div className="cpd-stat-value">{total}</div>
          <div className="cpd-stat-label">Total</div>
        </div>
        <div className="cpd-stat-card">
          <div className="cpd-stat-value cpd-stat-accent">{started}</div>
          <div className="cpd-stat-label">In Progress</div>
        </div>
        <div className="cpd-stat-card">
          <div className="cpd-stat-value cpd-stat-success">{completed}</div>
          <div className="cpd-stat-label">Completed</div>
        </div>
        <div className="cpd-stat-card">
          <div className="cpd-stat-value" style={{ color: "#ffb74d" }}>
            {overridden}
          </div>
          <div className="cpd-stat-label">Overridden</div>
        </div>
      </div>

      {isLoading && assignments.length === 0 && (
        <div className="scp-loading">Loading assignments...</div>
      )}

      <ParticipantGrid
        assignments={assignments}
        selectedId={selectedParticipantId}
        onSelect={(id) => selectParticipant(id)}
      />
    </div>
  );
}
