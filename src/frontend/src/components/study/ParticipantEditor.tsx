import { useState } from "react";

import type { ParticipantAssignment, PhaseAssignment } from "../../types";
import PhaseCard from "./PhaseCard";
import PipelinePreview from "./PipelinePreview";

interface ParticipantEditorProps {
  assignment: ParticipantAssignment;
  onSave: (phases: PhaseAssignment[], group: "A" | "B") => void;
  onReset: () => void;
  onBack: () => void;
  isSaving: boolean;
}

export default function ParticipantEditor({
  assignment,
  onSave,
  onReset,
  onBack,
  isSaving,
}: ParticipantEditorProps) {
  const [editingPhases, setEditingPhases] = useState<PhaseAssignment[]>([
    ...assignment.phases,
  ]);
  const [editingGroup, setEditingGroup] = useState<"A" | "B">(assignment.group);
  const [showPreview, setShowPreview] = useState(false);
  const [dirty, setDirty] = useState(false);

  function handlePhaseChange(index: number, updated: PhaseAssignment) {
    const next = [...editingPhases];
    next[index] = updated;
    setEditingPhases(next);
    setDirty(true);
  }

  function handleGroupChange(group: "A" | "B") {
    setEditingGroup(group);
    setDirty(true);
  }

  function handleSave() {
    onSave(editingPhases, editingGroup);
    setDirty(false);
  }

  function handleCancel() {
    setEditingPhases([...assignment.phases]);
    setEditingGroup(assignment.group);
    setDirty(false);
  }

  if (showPreview) {
    return (
      <div className="scp-editor-container">
        <div className="scp-editor-topbar">
          <button
            type="button"
            className="pi-secondary-btn"
            onClick={() => setShowPreview(false)}
          >
            &#8592; Back to Editor
          </button>
          <h3 className="scp-editor-title">
            Pipeline Preview &mdash; {assignment.participant_id}
          </h3>
        </div>
        <PipelinePreview
          participantId={assignment.participant_id}
          group={editingGroup}
          phases={editingPhases}
        />
      </div>
    );
  }

  return (
    <div className="scp-editor-container">
      <div className="scp-editor-topbar">
        <button type="button" className="pi-secondary-btn" onClick={onBack}>
          &#8592; Back to Participants
        </button>
        <h3 className="scp-editor-title">{assignment.participant_id}</h3>
        <div className="scp-editor-topbar-right">
          {assignment.override && (
            <span className="scp-override-badge">Overridden</span>
          )}
          <button
            type="button"
            className="pi-status-action-btn"
            onClick={() => setShowPreview(true)}
          >
            Preview Pipeline
          </button>
        </div>
      </div>

      {/* Group selector */}
      <div className="scp-editor-section">
        <div className="scp-field-group scp-inline-row">
          <label className="scp-field-label">Group</label>
          <div className="scp-mode-chips">
            <button
              type="button"
              className={`cp-chip ${editingGroup === "A" ? "active" : ""}`}
              onClick={() => handleGroupChange("A")}
            >
              Group A
            </button>
            <button
              type="button"
              className={`cp-chip ${editingGroup === "B" ? "active" : ""}`}
              onClick={() => handleGroupChange("B")}
            >
              Group B
            </button>
          </div>
          <span className={`scp-status-badge ${assignment.status.replace("_", "-")}`}>
            {assignment.status === "not_started"
              ? "Not Started"
              : assignment.status === "in_progress"
                ? "In Progress"
                : "Completed"}
          </span>
        </div>
      </div>

      {/* Phase cards */}
      <div className="scp-phase-list">
        {editingPhases.map((phase, idx) => (
          <PhaseCard
            key={phase.phase}
            phase={phase}
            onChange={(updated) => handlePhaseChange(idx, updated)}
          />
        ))}
      </div>

      {/* Actions */}
      <div className="scp-editor-actions">
        <button
          type="button"
          className="pi-primary-btn"
          onClick={handleSave}
          disabled={!dirty || isSaving}
        >
          {isSaving ? "Saving..." : "Save Changes"}
        </button>
        <button
          type="button"
          className="pi-secondary-btn"
          onClick={handleCancel}
          disabled={!dirty}
        >
          Cancel
        </button>
        <button
          type="button"
          className="scp-reset-btn"
          onClick={onReset}
          disabled={isSaving}
          title="Reset this participant to computed defaults"
        >
          Reset to Defaults
        </button>
      </div>
    </div>
  );
}
