import { useCallback, useState } from "react";

import type {
  CheckpointDefinition,
  CheckpointFieldDef,
  CheckpointInstance,
  CheckpointState,
  PipelinePosition,
} from "../../types";
import { SEED_DEFINITIONS } from "../../data/checkpointDefinitions";
import DynamicControlRenderer from "../controls/DynamicControlRenderer";
import FieldSchemaBuilder from "./FieldSchemaBuilder";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeId(): string {
  return `cp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

// ---------------------------------------------------------------------------
// Types for editor state
// ---------------------------------------------------------------------------

interface EditorState {
  control_type: string;
  label: string;
  description: string;
  field_schema: CheckpointFieldDef[];
  pipeline_position: PipelinePosition;
  sort_order: number;
  applicable_modes: string[];
  required: boolean;
  timeout_seconds: string;
  max_retries: string;
  circuit_breaker_threshold: string;
  circuit_breaker_window_minutes: string;
}

function emptyEditor(): EditorState {
  return {
    control_type: "",
    label: "",
    description: "",
    field_schema: [],
    pipeline_position: "post_generation",
    sort_order: 0,
    applicable_modes: ["*"],
    required: false,
    timeout_seconds: "",
    max_retries: "2",
    circuit_breaker_threshold: "5",
    circuit_breaker_window_minutes: "60",
  };
}

function editorFromDef(def: CheckpointDefinition): EditorState {
  return {
    control_type: def.control_type,
    label: def.label,
    description: def.description,
    field_schema: def.field_schema,
    pipeline_position: def.pipeline_position,
    sort_order: def.sort_order,
    applicable_modes: def.applicable_modes,
    required: def.required,
    timeout_seconds: def.timeout_seconds?.toString() ?? "",
    max_retries: def.max_retries.toString(),
    circuit_breaker_threshold: def.circuit_breaker_threshold.toString(),
    circuit_breaker_window_minutes: def.circuit_breaker_window_minutes.toString(),
  };
}

const MODE_OPTIONS = [
  { value: "*", label: "All modes" },
  { value: "baseline", label: "Baseline" },
  { value: "hitl_r", label: "HITL-R" },
  { value: "hitl_g", label: "HITL-G" },
  { value: "hitl_full", label: "HITL-Full" },
];

const PIPELINE_OPTIONS: Array<{ value: PipelinePosition; label: string }> = [
  { value: "after_retrieval", label: "After Retrieval" },
  { value: "after_generation", label: "After Generation" },
  { value: "post_generation", label: "Post Generation" },
];

// ---------------------------------------------------------------------------
// Main Dashboard Component
// ---------------------------------------------------------------------------

interface CheckpointDashboardProps {
  onBack: () => void;
}

export default function CheckpointDashboard({ onBack }: CheckpointDashboardProps) {
  const [definitions, setDefinitions] = useState<CheckpointDefinition[]>(SEED_DEFINITIONS);
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [previewInstance, setPreviewInstance] = useState<CheckpointInstance | null>(null);
  const [previewState, setPreviewState] = useState<CheckpointState>("active");
  const [showPipelinePreview, setShowPipelinePreview] = useState(false);

  // ── CRUD handlers ──

  function handleCreate() {
    setEditor(emptyEditor());
    setEditingId(null);
  }

  function handleEdit(def: CheckpointDefinition) {
    setEditor(editorFromDef(def));
    setEditingId(def.id);
  }

  function handleToggle(id: string) {
    setDefinitions((prev) =>
      prev.map((d) =>
        d.id === id ? { ...d, enabled: !d.enabled, updated_at: new Date().toISOString() } : d
      )
    );
  }

  function handleDelete(id: string) {
    setDefinitions((prev) => prev.filter((d) => d.id !== id));
  }

  function handleSave() {
    if (!editor) return;

    const now = new Date().toISOString();
    const def: CheckpointDefinition = {
      id: editingId ?? makeId(),
      control_type: editor.control_type,
      label: editor.label,
      description: editor.description,
      field_schema: editor.field_schema,
      pipeline_position: editor.pipeline_position,
      sort_order: editor.sort_order,
      applicable_modes: editor.applicable_modes,
      required: editor.required,
      timeout_seconds: editor.timeout_seconds ? Number(editor.timeout_seconds) : null,
      max_retries: Number(editor.max_retries) || 2,
      circuit_breaker_threshold: Number(editor.circuit_breaker_threshold) || 5,
      circuit_breaker_window_minutes: Number(editor.circuit_breaker_window_minutes) || 60,
      enabled: true,
      created_at: editingId
        ? definitions.find((d) => d.id === editingId)?.created_at ?? now
        : now,
      updated_at: now,
    };

    if (editingId) {
      setDefinitions((prev) => prev.map((d) => (d.id === editingId ? def : d)));
    } else {
      setDefinitions((prev) => [...prev, def]);
    }
    setEditor(null);
    setEditingId(null);
  }

  function handleCancel() {
    setEditor(null);
    setEditingId(null);
  }

  // ── Preview helpers ──

  function handlePreview(def: CheckpointDefinition) {
    setPreviewState("active");
    setPreviewInstance({
      id: `preview-${def.id}`,
      task_id: "preview-task",
      definition_id: def.id,
      control_type: def.control_type,
      label: def.label,
      state: "active",
      field_schema: def.field_schema,
      payload: null,
      submit_result: null,
      required: def.required,
      timeout_seconds: def.timeout_seconds,
      attempt_count: 0,
      max_retries: def.max_retries,
      last_error: null,
      offered_at: new Date().toISOString(),
      submitted_at: null,
    });
  }

  const handlePreviewSubmit = useCallback(
    (_instanceId: string, data: Record<string, unknown>) => {
      setPreviewInstance((prev) =>
        prev ? { ...prev, state: "submitted" as CheckpointState, submit_result: data } : null
      );
      setPreviewState("submitted");
    },
    []
  );

  const handlePreviewSkip = useCallback((_instanceId: string) => {
    setPreviewInstance((prev) =>
      prev ? { ...prev, state: "skipped" as CheckpointState } : null
    );
    setPreviewState("skipped");
  }, []);

  const handlePreviewRetry = useCallback((_instanceId: string) => {
    setPreviewInstance((prev) =>
      prev
        ? { ...prev, state: "active" as CheckpointState, last_error: null, offered_at: new Date().toISOString() }
        : null
    );
    setPreviewState("active");
  }, []);

  function setPreviewToState(state: CheckpointState) {
    setPreviewState(state);
    setPreviewInstance((prev) => {
      if (!prev) return null;
      const updated = { ...prev, state };
      if (state === "failed") {
        updated.last_error = "Simulated failure for preview";
        updated.attempt_count = 1;
      }
      if (state === "timed_out") {
        updated.last_error = "Checkpoint timed out";
      }
      if (state === "submitted") {
        updated.submit_result = { preview: "sample data" };
      }
      return updated;
    });
  }

  // ── Pipeline Preview ──

  function buildPipelineInstances(): Array<{
    position: PipelinePosition;
    label: string;
    instances: CheckpointInstance[];
  }> {
    const positions: Array<{ position: PipelinePosition; label: string }> = [
      { position: "after_retrieval", label: "After Retrieval" },
      { position: "after_generation", label: "After Generation" },
      { position: "post_generation", label: "Post Generation" },
    ];

    return positions.map(({ position, label }) => ({
      position,
      label,
      instances: definitions
        .filter((d) => d.enabled && d.pipeline_position === position && d.field_schema.length > 0)
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((d) => ({
          id: `pipeline-${d.id}`,
          task_id: "pipeline-preview-task",
          definition_id: d.id,
          control_type: d.control_type,
          label: d.label,
          state: "active" as CheckpointState,
          field_schema: d.field_schema,
          payload: null,
          submit_result: null,
          required: d.required,
          timeout_seconds: d.timeout_seconds,
          attempt_count: 0,
          max_retries: d.max_retries,
          last_error: null,
          offered_at: new Date().toISOString(),
          submitted_at: null,
        })),
    }));
  }

  // ── Render ──

  // Pipeline preview mode
  if (showPipelinePreview) {
    const pipeline = buildPipelineInstances();
    return (
      <div className="cpd-container">
        <div className="cpd-topbar">
          <button type="button" className="pi-secondary-btn" onClick={() => setShowPipelinePreview(false)}>
            &#8592; Back to Dashboard
          </button>
          <h2 className="cpd-page-title">Pipeline Preview</h2>
        </div>

        <div className="cpd-pipeline-preview">
          {/* Simulated chat transcript */}
          <div className="cpd-pipeline-chat">
            <div className="pi-user-bubble">
              What are the key technology and cybersecurity risks that could impact Microsoft&apos;s cloud business?
            </div>
            <div className="pi-assistant-text">
              I&apos;ll help with that. Let me inspect the document structure and fetch relevant passages.
            </div>
            <div className="pi-step-card completed">
              <div className="pi-step-left">
                <span className="pi-step-icon">&#10003;</span>
                <span>Get document structure</span>
              </div>
              <div className="pi-step-right">34 sections scanned</div>
            </div>
            <div className="pi-step-card completed">
              <div className="pi-step-left">
                <span className="pi-step-icon">&#10003;</span>
                <span>Get page content</span>
              </div>
              <div className="pi-step-right">6 chunks &bull; 1,240 ms</div>
            </div>

            {pipeline.map(({ position, label, instances }) => (
              <div key={position} className="cpd-pipeline-stage">
                <div className="cpd-pipeline-stage-label">
                  <span className="cpd-pipeline-dot" />
                  {label}
                  <span className="cpd-pipeline-count">
                    {instances.length} checkpoint{instances.length !== 1 ? "s" : ""}
                  </span>
                </div>

                {instances.length === 0 && (
                  <div className="cpd-pipeline-empty">No checkpoints at this position</div>
                )}

                {instances.map((inst) => (
                  <DynamicControlRenderer
                    key={inst.id}
                    instance={inst}
                    onSubmit={handlePreviewSubmit}
                    onSkip={handlePreviewSkip}
                    onRetry={handlePreviewRetry}
                  />
                ))}

                {position === "after_retrieval" && (
                  <>
                    <div className="pi-step-card completed">
                      <div className="pi-step-left">
                        <span className="pi-step-icon">&#10003;</span>
                        <span>Synthesize answer</span>
                      </div>
                      <div className="pi-step-right">4 citations &bull; 860 ms</div>
                    </div>
                    <div className="pi-answer-card">
                      <div className="pi-answer-label">Generated summary</div>
                      <div className="pi-answer-text" style={{ maxHeight: 80, overflow: "hidden" }}>
                        Executive overview: Microsoft&apos;s 10-K filing reveals a multi-factor risk profile
                        spanning cloud infrastructure resilience, cybersecurity threats, and regulatory compliance...
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}

            <div className="pi-run-meta pi-status-row">
              <span>HITL flow completed. You can start the next query.</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Editor mode
  if (editor) {
    return (
      <div className="cpd-container">
        <div className="cpd-topbar">
          <button type="button" className="pi-secondary-btn" onClick={handleCancel}>
            &#8592; Back
          </button>
          <h2 className="cpd-page-title">
            {editingId ? "Edit Checkpoint" : "Create Checkpoint"}
          </h2>
        </div>

        <div className="cpd-editor-grid">
          <div className="cpd-editor-main">
            <div className="cpd-section">
              <h3 className="cpd-section-title">Identity</h3>
              <div className="cpd-row">
                <div className="cpd-col">
                  <label className="fsb-label">Label</label>
                  <input
                    type="text"
                    className="pi-form-control"
                    placeholder="e.g. Risk Priority Ranking"
                    value={editor.label}
                    onChange={(e) => setEditor({ ...editor, label: e.target.value })}
                  />
                </div>
                <div className="cpd-col cpd-col-narrow">
                  <label className="fsb-label">Control Type (slug)</label>
                  <input
                    type="text"
                    className="pi-form-control"
                    placeholder="e.g. risk_ranker"
                    value={editor.control_type}
                    onChange={(e) =>
                      setEditor({
                        ...editor,
                        control_type: e.target.value.replace(/[^a-z0-9_]/gi, "_").toLowerCase(),
                      })
                    }
                  />
                </div>
              </div>
              <label className="fsb-label">Description</label>
              <textarea
                className="pi-form-control pi-form-textarea"
                placeholder="What does this checkpoint do?"
                value={editor.description}
                onChange={(e) => setEditor({ ...editor, description: e.target.value })}
                rows={2}
              />
            </div>

            <div className="cpd-section">
              <h3 className="cpd-section-title">Pipeline Configuration</h3>
              <div className="cpd-row">
                <div className="cpd-col cpd-col-narrow">
                  <label className="fsb-label">Pipeline Position</label>
                  <select
                    className="pi-form-control"
                    value={editor.pipeline_position}
                    onChange={(e) =>
                      setEditor({
                        ...editor,
                        pipeline_position: e.target.value as PipelinePosition,
                      })
                    }
                  >
                    {PIPELINE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="cpd-col cpd-col-xs">
                  <label className="fsb-label">Sort Order</label>
                  <input
                    type="number"
                    className="pi-form-control"
                    value={editor.sort_order}
                    onChange={(e) =>
                      setEditor({ ...editor, sort_order: Number(e.target.value) || 0 })
                    }
                  />
                </div>
                <div className="cpd-col cpd-col-narrow">
                  <label className="fsb-label">Required</label>
                  <label className="cp-checkbox-item fsb-checkbox">
                    <input
                      type="checkbox"
                      checked={editor.required}
                      onChange={(e) => setEditor({ ...editor, required: e.target.checked })}
                    />
                    <span>Block pipeline if incomplete</span>
                  </label>
                </div>
              </div>

              <label className="fsb-label">Applicable Modes</label>
              <div className="cpd-mode-chips">
                {MODE_OPTIONS.map((m) => {
                  const active = editor.applicable_modes.includes(m.value);
                  return (
                    <button
                      key={m.value}
                      type="button"
                      className={`cp-chip ${active ? "active" : ""}`}
                      onClick={() => {
                        if (m.value === "*") {
                          setEditor({ ...editor, applicable_modes: active ? [] : ["*"] });
                        } else {
                          const filtered = editor.applicable_modes.filter((v) => v !== "*");
                          const next = active
                            ? filtered.filter((v) => v !== m.value)
                            : [...filtered, m.value];
                          setEditor({ ...editor, applicable_modes: next });
                        }
                      }}
                    >
                      {m.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="cpd-section">
              <h3 className="cpd-section-title">Failure Strategy</h3>
              <div className="cpd-row">
                <div className="cpd-col cpd-col-xs">
                  <label className="fsb-label">Timeout (sec)</label>
                  <input
                    type="number"
                    className="pi-form-control"
                    placeholder="None"
                    value={editor.timeout_seconds}
                    onChange={(e) => setEditor({ ...editor, timeout_seconds: e.target.value })}
                  />
                </div>
                <div className="cpd-col cpd-col-xs">
                  <label className="fsb-label">Max Retries</label>
                  <input
                    type="number"
                    className="pi-form-control"
                    value={editor.max_retries}
                    onChange={(e) => setEditor({ ...editor, max_retries: e.target.value })}
                  />
                </div>
                <div className="cpd-col cpd-col-xs">
                  <label className="fsb-label">CB Threshold</label>
                  <input
                    type="number"
                    className="pi-form-control"
                    value={editor.circuit_breaker_threshold}
                    onChange={(e) =>
                      setEditor({ ...editor, circuit_breaker_threshold: e.target.value })
                    }
                  />
                </div>
                <div className="cpd-col cpd-col-xs">
                  <label className="fsb-label">CB Window (min)</label>
                  <input
                    type="number"
                    className="pi-form-control"
                    value={editor.circuit_breaker_window_minutes}
                    onChange={(e) =>
                      setEditor({
                        ...editor,
                        circuit_breaker_window_minutes: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
            </div>

            <div className="cpd-section">
              <FieldSchemaBuilder
                fields={editor.field_schema}
                onChange={(fields) => setEditor({ ...editor, field_schema: fields })}
              />
            </div>

            <div className="cpd-editor-actions">
              <button type="button" className="pi-primary-btn" onClick={handleSave}>
                {editingId ? "Save Changes" : "Create Checkpoint"}
              </button>
              <button type="button" className="pi-secondary-btn" onClick={handleCancel}>
                Cancel
              </button>
            </div>
          </div>

          {/* Live preview sidebar */}
          <div className="cpd-editor-preview">
            <h3 className="cpd-section-title">Live Preview</h3>
            {editor.field_schema.length === 0 ? (
              <div className="cpd-preview-empty">
                Add fields to see a live preview of the checkpoint control.
              </div>
            ) : (
              <DynamicControlRenderer
                instance={{
                  id: "editor-preview",
                  task_id: "preview",
                  definition_id: "preview",
                  control_type: editor.control_type || "custom",
                  label: editor.label || "Untitled Checkpoint",
                  state: "active",
                  field_schema: editor.field_schema,
                  payload: null,
                  submit_result: null,
                  required: editor.required,
                  timeout_seconds: editor.timeout_seconds ? Number(editor.timeout_seconds) : null,
                  attempt_count: 0,
                  max_retries: Number(editor.max_retries) || 2,
                  last_error: null,
                  offered_at: new Date().toISOString(),
                  submitted_at: null,
                }}
                onSubmit={() => {}}
                onSkip={() => {}}
                onRetry={() => {}}
              />
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── List view (main dashboard) ──

  return (
    <div className="cpd-container">
      <div className="cpd-topbar">
        <button type="button" className="pi-secondary-btn" onClick={onBack}>
          &#8592; Back to Chat
        </button>
        <h2 className="cpd-page-title">HITL Checkpoint Dashboard</h2>
        <div className="cpd-topbar-actions">
          <button
            type="button"
            className="pi-secondary-btn"
            onClick={() => setShowPipelinePreview(true)}
          >
            Pipeline Preview
          </button>
          <button type="button" className="pi-primary-btn" onClick={handleCreate}>
            + New Checkpoint
          </button>
        </div>
      </div>

      <div className="cpd-stats-row">
        <div className="cpd-stat-card">
          <div className="cpd-stat-value">{definitions.length}</div>
          <div className="cpd-stat-label">Total</div>
        </div>
        <div className="cpd-stat-card">
          <div className="cpd-stat-value cpd-stat-success">
            {definitions.filter((d) => d.enabled).length}
          </div>
          <div className="cpd-stat-label">Enabled</div>
        </div>
        <div className="cpd-stat-card">
          <div className="cpd-stat-value cpd-stat-muted">
            {definitions.filter((d) => !d.enabled).length}
          </div>
          <div className="cpd-stat-label">Disabled</div>
        </div>
        <div className="cpd-stat-card">
          <div className="cpd-stat-value cpd-stat-accent">
            {new Set(definitions.map((d) => d.pipeline_position)).size}
          </div>
          <div className="cpd-stat-label">Pipeline stages</div>
        </div>
      </div>

      <div className="cpd-list">
        {definitions.map((def) => (
          <div
            key={def.id}
            className={`cpd-def-card ${def.enabled ? "" : "cpd-disabled"}`}
          >
            <div className="cpd-def-header">
              <div className="cpd-def-title-row">
                <span className={`cpd-def-dot ${def.enabled ? "enabled" : "disabled"}`} />
                <span className="cpd-def-label">{def.label}</span>
                <span className="cp-control-badge">{def.control_type}</span>
              </div>
              <div className="cpd-def-actions">
                {def.field_schema.length > 0 && (
                  <button
                    type="button"
                    className="pi-status-action-btn"
                    onClick={() => handlePreview(def)}
                  >
                    Preview
                  </button>
                )}
                <button
                  type="button"
                  className="pi-status-action-btn"
                  onClick={() => handleEdit(def)}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="pi-status-action-btn"
                  onClick={() => handleToggle(def.id)}
                >
                  {def.enabled ? "Disable" : "Enable"}
                </button>
                <button
                  type="button"
                  className="fsb-remove-btn"
                  onClick={() => handleDelete(def.id)}
                  title="Delete"
                >
                  &#10005;
                </button>
              </div>
            </div>

            <div className="cpd-def-description">{def.description}</div>

            <div className="cpd-def-meta">
              <span className="cpd-meta-tag">
                {PIPELINE_OPTIONS.find((p) => p.value === def.pipeline_position)?.label ??
                  def.pipeline_position}
              </span>
              <span className="cpd-meta-tag">
                {def.required ? "Required" : "Optional"}
              </span>
              <span className="cpd-meta-tag">
                {def.field_schema.length} field{def.field_schema.length !== 1 ? "s" : ""}
              </span>
              <span className="cpd-meta-tag">
                Modes: {def.applicable_modes.join(", ")}
              </span>
              {def.timeout_seconds && (
                <span className="cpd-meta-tag">Timeout: {def.timeout_seconds}s</span>
              )}
              <span className="cpd-meta-tag">
                Retries: {def.max_retries}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Single checkpoint preview modal */}
      {previewInstance && (
        <div className="cpd-preview-overlay" onClick={() => setPreviewInstance(null)}>
          <div className="cpd-preview-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cpd-preview-modal-header">
              <h3>Checkpoint Preview</h3>
              <button
                type="button"
                className="fsb-remove-btn"
                onClick={() => setPreviewInstance(null)}
              >
                &#10005;
              </button>
            </div>

            <div className="cpd-preview-state-bar">
              <span className="fsb-label">Simulate state:</span>
              {(
                ["active", "submitted", "skipped", "failed", "timed_out"] as CheckpointState[]
              ).map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`cp-chip ${previewState === s ? "active" : ""}`}
                  onClick={() => setPreviewToState(s)}
                >
                  {s}
                </button>
              ))}
            </div>

            <div className="cpd-preview-content">
              <DynamicControlRenderer
                instance={previewInstance}
                onSubmit={handlePreviewSubmit}
                onSkip={handlePreviewSkip}
                onRetry={handlePreviewRetry}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
