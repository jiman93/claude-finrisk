import { FormEvent, useEffect, useRef, useState } from "react";

import { SEED_DEFINITIONS } from "../../data/checkpointDefinitions";
import { useStudyStore } from "../../stores/studyStore";
import type {
  ChatMessage,
  CheckpointInstance,
  CheckpointState,
  ParticipantAssignment,
  PhaseAssignment,
} from "../../types";
import DynamicControlRenderer from "../controls/DynamicControlRenderer";
import FormattedMarkdown from "../FormattedMarkdown";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";
const CHUNK_TRUNCATE_LEN = 200;

interface StudyChatGateProps {
  onPromptLogged: (prompt: string) => void;
}

const MODE_LABELS: Record<string, string> = {
  baseline: "Baseline",
  hitl_r: "HITL-R (Retrieval)",
  hitl_g: "HITL-G (Generation)",
  hitl_full: "HITL-Full",
};

const MODE_COLORS: Record<string, string> = {
  baseline: "scp-mode-baseline",
  hitl_r: "scp-mode-hitlr",
  hitl_g: "scp-mode-hitlg",
  hitl_full: "scp-mode-hitlfull",
};

function PhaseOverviewCard({ phase, isCurrent }: { phase: PhaseAssignment; isCurrent: boolean }) {
  return (
    <div className={`scg-phase-card ${isCurrent ? "scg-current" : ""}`}>
      <div className="scg-phase-header">
        <span className="scg-phase-num">Phase {phase.phase}</span>
        <span className={`scp-mode-badge ${MODE_COLORS[phase.mode] ?? ""}`}>
          {MODE_LABELS[phase.mode] ?? phase.mode}
        </span>
      </div>
      <div className="scg-phase-ticker">{phase.ticker}</div>
      <div className="scg-phase-query">{phase.query}</div>
      <div className="scg-phase-cps">
        {phase.checkpoints.length === 0
          ? "No checkpoints"
          : phase.checkpoints.map((cp) => (
              <span key={cp.definition_id} className="scg-cp-tag">
                {cp.control_type}
              </span>
            ))}
      </div>
    </div>
  );
}

export default function StudyChatGate({ onPromptLogged }: StudyChatGateProps) {
  const [participantInput, setParticipantInput] = useState("P01");
  const [assignment, setAssignment] = useState<ParticipantAssignment | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(false);

  // Study flow state
  const {
    session,
    messages,
    isLoading,
    error: studyError,
    setParticipantId,
    startAndRunCurrentPhase,
    advancePhase,
    submitNodeSelection,
    submitEditedSummary,
  } = useStudyStore();

  const [started, setStarted] = useState(false);
  const sessionStartedRef = useRef(false);

  // Fetch the participant's assignment from the study control panel API
  async function handleLoadParticipant(e: FormEvent) {
    e.preventDefault();
    const pid = participantInput.trim().toUpperCase();
    if (!pid) return;

    setIsFetching(true);
    setFetchError(null);
    try {
      const res = await fetch(`${BASE_URL}/api/study/assignments/${pid}`);
      if (!res.ok) {
        if (res.status === 404) {
          // Try to generate defaults first, then retry
          await fetch(`${BASE_URL}/api/study/assignments`, { method: "GET" });
          const res2 = await fetch(`${BASE_URL}/api/study/assignments/${pid}`);
          if (!res2.ok) throw new Error(`Participant ${pid} not found`);
          const data2 = await res2.json();
          setAssignment(data2 as ParticipantAssignment);
          setParticipantInput(pid);
          return;
        }
        throw new Error(`Failed to load assignment: ${res.status}`);
      }
      const data = await res.json();
      setAssignment(data as ParticipantAssignment);
      setParticipantInput(pid);
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setIsFetching(false);
    }
  }

  // Start the study session for this participant
  async function handleStartSession() {
    if (!assignment) return;
    setParticipantId(assignment.participant_id);
    setStarted(true);
  }

  // Trigger the actual session start once when started flag flips to true
  useEffect(() => {
    if (started && !sessionStartedRef.current) {
      sessionStartedRef.current = true;
      startAndRunCurrentPhase();
      if (assignment) {
        onPromptLogged(`${assignment.participant_id} - Study Session`);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started]);

  // Build checkpoint instances for the current phase from the assignment
  const currentPhase = assignment?.phases.find(
    (p) => p.phase === (session?.current_phase ?? 1)
  );

  // ── Screen 1: Participant ID prompt ──
  if (!assignment) {
    return (
      <section className="pi-chat-shell">
        <div className="pi-workspace pane-collapsed">
          <div className="pi-left-pane">
            <div className="pi-chat-stream">
              <div className="scg-entry-center">
                <div className="scg-entry-icon">&#9881;</div>
                <h2 className="scg-entry-title">Study Session</h2>
                <p className="scg-entry-subtitle">
                  Enter a participant ID to load their configured pipeline and begin the study.
                </p>
                <form className="scg-entry-form" onSubmit={handleLoadParticipant}>
                  <input
                    className="pi-form-control scg-pid-input"
                    type="text"
                    value={participantInput}
                    onChange={(e) => setParticipantInput(e.target.value.toUpperCase())}
                    placeholder="e.g. P01"
                    maxLength={4}
                    disabled={isFetching}
                  />
                  <button
                    type="submit"
                    className="pi-primary-btn"
                    disabled={!participantInput.trim() || isFetching}
                  >
                    {isFetching ? "Loading..." : "Load Participant"}
                  </button>
                </form>
                {fetchError && <div className="scg-error">{fetchError}</div>}
                <div className="scg-hint">
                  Participants P01–P16 are auto-generated. Configure custom assignments in{" "}
                  <strong>Study Setup</strong>.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // ── Screen 2: Assignment loaded, show overview + start button ──
  if (!started) {
    return (
      <section className="pi-chat-shell">
        <div className="pi-workspace pane-collapsed">
          <div className="pi-left-pane">
            <div className="pi-chat-stream">
              <div className="scg-overview-center">
                <div className="scg-overview-header">
                  <div className="scg-participant-badge">
                    <span className="scg-pid">{assignment.participant_id}</span>
                    <span className={`scp-card-group group-${assignment.group.toLowerCase()}`}>
                      Group {assignment.group}
                    </span>
                    {assignment.override && (
                      <span className="scp-override-badge">Custom</span>
                    )}
                  </div>
                  <button
                    type="button"
                    className="pi-secondary-btn"
                    onClick={() => {
                      setAssignment(null);
                      setStarted(false);
                      sessionStartedRef.current = false;
                    }}
                  >
                    Change Participant
                  </button>
                </div>

                <div className="scg-phases-row">
                  {assignment.phases.map((phase) => (
                    <PhaseOverviewCard key={phase.phase} phase={phase} isCurrent={phase.phase === 1} />
                  ))}
                </div>

                <div className="scg-start-section">
                  <button
                    type="button"
                    className="pi-primary-btn scg-start-btn"
                    onClick={handleStartSession}
                  >
                    Start Study Session
                  </button>
                  <p className="scg-start-hint">
                    This will begin Phase 1 ({MODE_LABELS[assignment.phases[0].mode]}) with{" "}
                    {assignment.phases[0].ticker}.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // ── Screen 3: Active study session (chat stream) ──
  return (
    <section className="pi-chat-shell">
      <div className="pi-workspace pane-collapsed">
        <div className="pi-left-pane scg-active-layout">
          {/* Session info bar */}
          <div className="scg-session-bar">
            <span className="scg-session-pid">{assignment.participant_id}</span>
            <span className={`scp-card-group group-${assignment.group.toLowerCase()}`}>
              {assignment.group}
            </span>
            {session && (
              <>
                <span className="scg-session-phase">Phase {session.current_phase}/3</span>
                <span className={`scp-mode-badge ${MODE_COLORS[session.current_mode] ?? ""}`}>
                  {MODE_LABELS[session.current_mode] ?? session.current_mode}
                </span>
                <span className="scg-session-ticker">{session.current_ticker}</span>
              </>
            )}
          </div>

          <div className="pi-chat-stream">
            <div className="pi-transcript">
              {/* Document attachment card */}
              {session && (
                <div className="scg-doc-card">
                  <div className="scg-doc-thumb">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                    </svg>
                  </div>
                  <div className="scg-doc-info">
                    <span className="scg-doc-name">{session.current_ticker}_10-K_Annual_Report.html</span>
                    <span className="scg-doc-meta">10-K Annual Filing</span>
                  </div>
                </div>
              )}

              {messages.map((msg) => {
                if (msg.type === "text") {
                  if (msg.role === "system") {
                    return (
                      <div key={msg.id} className="pi-assistant-text" style={{ opacity: 0.7, fontSize: 13 }}>
                        {msg.content}
                      </div>
                    );
                  }
                  if (msg.role === "user") {
                    return (
                      <div key={msg.id} className="pi-user-bubble">
                        {msg.content}
                      </div>
                    );
                  }
                  return (
                    <div key={msg.id} className="pi-assistant-text">
                      {msg.content}
                    </div>
                  );
                }

                if (msg.type === "loading") {
                  return (
                    <div key={msg.id} className="pi-step-card running">
                      <div className="pi-step-left">
                        <span className="pi-pulse-loader">
                          <span className="dot" />
                          <span className="dot" />
                          <span className="dot" />
                        </span>
                        <span>{msg.content}</span>
                      </div>
                    </div>
                  );
                }

                if (msg.type === "retrieved_nodes") {
                  return (
                    <div key={msg.id} className="pi-step-card completed">
                      <div className="pi-step-left">
                        <span className="pi-step-icon">&#10003;</span>
                        <span>Retrieved {msg.nodes.length} chunks</span>
                      </div>
                      <div className="pi-step-right">
                        {msg.nodes.map((n) => n.title).slice(0, 3).join(", ")}
                        {msg.nodes.length > 3 ? ` +${msg.nodes.length - 3} more` : ""}
                      </div>
                    </div>
                  );
                }

                if (msg.type === "selector") {
                  return (
                    <SelectorCard
                      key={msg.id}
                      taskId={msg.taskId}
                      nodes={msg.nodes}
                      onSubmit={submitNodeSelection}
                      disabled={isLoading}
                    />
                  );
                }

                if (msg.type === "editable_summary") {
                  return (
                    <EditableSummaryCard
                      key={msg.id}
                      taskId={msg.taskId}
                      summary={msg.summary}
                      onSubmit={submitEditedSummary}
                      disabled={isLoading}
                    />
                  );
                }

                if (msg.type === "summary") {
                  return (
                    <div key={msg.id} className="pi-answer-card">
                      <div className="pi-answer-label">Generated Summary</div>
                      <FormattedMarkdown text={msg.summary} />
                    </div>
                  );
                }

                if (msg.type === "checkpoint") {
                  return (
                    <CheckpointRenderer
                      key={msg.id}
                      instance={msg.instance}
                    />
                  );
                }

                return null;
              })}

              {/* Post-generation checkpoint instances from assignment */}
              {currentPhase &&
                !isLoading &&
                session &&
                currentPhaseHasSummary(messages) &&
                currentPhase.checkpoints
                  .filter((cp) => cp.pipeline_position === "post_generation")
                  .map((cp) => {
                    const def = SEED_DEFINITIONS.find((d) => d.id === cp.definition_id);
                    if (!def || def.field_schema.length === 0) return null;
                    return (
                      <PostGenerationCheckpoint
                        key={cp.definition_id}
                        definitionId={cp.definition_id}
                        label={cp.label}
                      />
                    );
                  })}

              {/* Phase advance button */}
              {session &&
                !isLoading &&
                currentPhaseHasSummary(messages) &&
                session.current_phase < 3 && (
                  <div className="scg-advance-section">
                    <button
                      type="button"
                      className="pi-primary-btn"
                      onClick={() => advancePhase()}
                      disabled={isLoading}
                    >
                      Advance to Phase {session.current_phase + 1}
                    </button>
                  </div>
                )}

              {session && session.current_phase >= 3 && currentPhaseHasSummary(messages) && (
                <div className="pi-run-meta pi-status-row">
                  <span>Study session complete. All 3 phases finished.</span>
                </div>
              )}
            </div>
          </div>

          {studyError && <div className="scg-error" style={{ margin: "0 16px 8px" }}>{studyError}</div>}
        </div>
      </div>
    </section>
  );
}

/**
 * Check whether the *current* phase has a completed summary.
 *
 * When `advancePhase()` is called the store appends to the messages array —
 * previous-phase summaries still exist.  We need to look only at messages
 * that came *after* the last phase-transition system message ("Transitioned
 * to Phase …" or the initial "Phase N | Mode …").  If there's a "summary"
 * message in that slice, the current phase generation is done.
 */
function currentPhaseHasSummary(msgs: ChatMessage[]): boolean {
  let phaseStartIdx = 0;
  for (let i = msgs.length - 1; i >= 0; i--) {
    const m = msgs[i];
    if (
      m.type === "text" &&
      m.role === "system" &&
      (/^Transitioned to Phase/.test(m.content) || /^Phase \d/.test(m.content))
    ) {
      phaseStartIdx = i;
      break;
    }
  }
  return msgs.slice(phaseStartIdx).some((m) => m.type === "summary");
}

// ── Inline sub-components ──

function TruncatedContent({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const needsTruncation = text.length > CHUNK_TRUNCATE_LEN;

  return (
    <div className="pi-selector-content">
      {needsTruncation && !expanded ? text.slice(0, CHUNK_TRUNCATE_LEN) + "…" : text}
      {needsTruncation && (
        <button
          type="button"
          className="pi-show-more-btn"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setExpanded((v) => !v);
          }}
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      )}
    </div>
  );
}

function SelectorCard({
  taskId,
  nodes,
  onSubmit,
  disabled,
}: {
  taskId: string;
  nodes: Array<{ node_id: string; title: string; page_index: number; relevant_content: string }>;
  onSubmit: (taskId: string, selected: string[], rejected: string[], order: string[]) => Promise<void>;
  disabled: boolean;
}) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(nodes.map((n) => n.node_id))
  );
  const [submitted, setSubmitted] = useState(false);

  function toggle(nodeId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) next.delete(nodeId);
      else next.add(nodeId);
      return next;
    });
  }

  async function handleSubmit() {
    const selected = Array.from(selectedIds);
    const rejected = nodes.map((n) => n.node_id).filter((id) => !selectedIds.has(id));
    setSubmitted(true);
    await onSubmit(taskId, selected, rejected, selected);
  }

  if (submitted) {
    return (
      <div className="pi-selector-card">
        <div className="pi-selector-header">
          <span>Chunk selection submitted</span>
          <span className="pi-selector-meta">{selectedIds.size} selected</span>
        </div>
      </div>
    );
  }

  return (
    <div className="pi-selector-card">
      <div className="pi-selector-header">
        <span>Select chunks for retrieval review</span>
        <span className="pi-selector-meta">{selectedIds.size}/{nodes.length} selected</span>
      </div>
      <div className="pi-selector-list">
        {nodes.map((node) => (
          <label key={node.node_id} className="pi-selector-item">
            <input
              type="checkbox"
              checked={selectedIds.has(node.node_id)}
              onChange={() => toggle(node.node_id)}
              disabled={disabled}
            />
            <div>
              <div className="pi-selector-title">{node.title}</div>
              <TruncatedContent text={node.relevant_content} />
              <span className="pi-citation-chip">[{node.title}, Page {node.page_index}]</span>
            </div>
          </label>
        ))}
      </div>
      <button
        className="pi-action-btn"
        disabled={disabled || selectedIds.size === 0}
        onClick={() => void handleSubmit()}
      >
        Submit Selection
      </button>
    </div>
  );
}

function EditableSummaryCard({
  taskId,
  summary,
  onSubmit,
  disabled,
}: {
  taskId: string;
  summary: string;
  onSubmit: (taskId: string, editedText: string) => Promise<void>;
  disabled: boolean;
}) {
  const [phase, setPhase] = useState<"reviewing" | "editing" | "submitted">("reviewing");
  const [text, setText] = useState(summary);

  async function handleAccept() {
    setPhase("submitted");
    await onSubmit(taskId, summary);
  }

  async function handleSubmitEdit() {
    setPhase("submitted");
    await onSubmit(taskId, text);
  }

  // Submitted — read-only formatted result
  if (phase === "submitted") {
    return (
      <div className="pi-answer-card">
        <div className="pi-answer-label">
          {text === summary ? "Generated Summary (accepted)" : "Edited Summary (submitted)"}
        </div>
        <FormattedMarkdown text={text} />
      </div>
    );
  }

  // Editing — raw textarea
  if (phase === "editing") {
    return (
      <div className="pi-inline-control-card">
        <div className="pi-postgen-title">Edit the generated summary</div>
        <textarea
          className="pi-edit-textarea"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={12}
          disabled={disabled}
        />
        <div className="pi-postgen-actions">
          <button
            type="button"
            className="pi-secondary-btn"
            onClick={() => setPhase("reviewing")}
            disabled={disabled}
          >
            Back to Review
          </button>
          <button
            type="button"
            className="pi-primary-btn"
            onClick={() => void handleSubmitEdit()}
            disabled={disabled}
          >
            Submit Edited Summary
          </button>
        </div>
      </div>
    );
  }

  // Reviewing — formatted summary with accept/edit buttons
  return (
    <div className="pi-inline-control-card">
      <div className="pi-answer-label">Generated Summary</div>
      <FormattedMarkdown text={summary} />
      <div className="pi-postgen-actions">
        <button
          type="button"
          className="pi-primary-btn"
          onClick={() => void handleAccept()}
          disabled={disabled}
        >
          Looks Good
        </button>
        <button
          type="button"
          className="pi-secondary-btn"
          onClick={() => setPhase("editing")}
          disabled={disabled}
        >
          Edit Summary
        </button>
      </div>
    </div>
  );
}

function CheckpointRenderer({ instance }: { instance: CheckpointInstance }) {
  const [inst, setInst] = useState(instance);

  return (
    <DynamicControlRenderer
      instance={inst}
      onSubmit={(_id, data) =>
        setInst((prev) => ({ ...prev, state: "submitted" as CheckpointState, submit_result: data }))
      }
      onSkip={(_id) =>
        setInst((prev) => ({ ...prev, state: "skipped" as CheckpointState }))
      }
      onRetry={(_id) =>
        setInst((prev) => ({
          ...prev,
          state: "active" as CheckpointState,
          last_error: null,
          offered_at: new Date().toISOString(),
        }))
      }
    />
  );
}

function PostGenerationCheckpoint({
  definitionId,
  label,
}: {
  definitionId: string;
  label: string;
}) {
  const def = SEED_DEFINITIONS.find((d) => d.id === definitionId);
  if (!def || def.field_schema.length === 0) return null;

  const [instance, setInstance] = useState<CheckpointInstance>({
    id: `post-gen-${definitionId}`,
    task_id: "study-task",
    definition_id: definitionId,
    control_type: def.control_type,
    label: label,
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

  return (
    <DynamicControlRenderer
      instance={instance}
      onSubmit={(_id, data) =>
        setInstance((prev) => ({ ...prev, state: "submitted", submit_result: data }))
      }
      onSkip={(_id) =>
        setInstance((prev) => ({ ...prev, state: "skipped" }))
      }
      onRetry={(_id) =>
        setInstance((prev) => ({
          ...prev,
          state: "active",
          last_error: null,
          offered_at: new Date().toISOString(),
        }))
      }
    />
  );
}
