import { FormEvent, Fragment, lazy, Suspense, useEffect, useRef, useState } from "react";

import { useStudyStore } from "../../stores/studyStore";
import type {
  ChatMessage,
  CheckpointInstance,
  CheckpointState,
  ParticipantAssignment,
  PhaseAssignment,
  RetrievalNode,
  SessionState,
  TailAction,
} from "../../types";
import { cleanChunkMarkdown, cleanChunkPreview } from "../../utils/chunkText";
import DynamicControlRenderer from "../controls/DynamicControlRenderer";
import FormattedMarkdown from "../FormattedMarkdown";
import SessionLedger from "./SessionLedger";

const PdfViewerOverlay = lazy(() => import("../PdfViewerOverlay"));

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";
const CHUNK_TRUNCATE_LEN = 250;

interface StudyChatGateProps {
  onSaveChat: (chatId: string, title: string, assignment: ParticipantAssignment) => void;
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

const MODE_ROLE_DESCRIPTIONS: Record<string, string> = {
  baseline:
    "Read only — the system retrieves and summarises automatically. You just review the output.",
  hitl_r:
    "Select which retrieved document chunks the AI should use before it generates the summary.",
  hitl_g:
    "Review and edit the AI-generated summary to improve accuracy, completeness, or clarity.",
  hitl_full:
    "Select chunks AND edit the generated summary. Full control over both retrieval and generation.",
};

// Video source config — change when the actual video is ready
const VIDEO_CONFIG = {
  type: "placeholder" as "placeholder" | "youtube" | "local",
  youtubeUrl: "",
  localSrc: "",
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function StudyChatGate({ onSaveChat }: StudyChatGateProps) {
  const [participantInput, setParticipantInput] = useState("P01");
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(false);

  // Study flow state from store
  const {
    session,
    assignment,
    messages,
    isLoading,
    error: studyError,
    activeChatId,
    chatSnapshots,
    tailAction,
    activeCheckpoints,
    setParticipantId,
    setAssignment,
    startAndRunCurrentPhase,
    advancePhase,
    triggerGeneration,
    submitNodeSelection,
    submitEditedSummary,
    startQuestionnaire,
    submitCheckpoint,
    skipCheckpoint,
  } = useStudyStore();

  const [started, setStarted] = useState(false);
  const sessionStartedRef = useRef(false);
  const chatIdRef = useRef<string | null>(null);

  // Determine if we're viewing a restored (read-only) past chat
  const isRestoredView = !!(
    activeChatId &&
    chatSnapshots[activeChatId] &&
    !started &&
    !sessionStartedRef.current
  );

  // When viewing a restored snapshot, use its assignment
  const restoredAssignment = activeChatId ? chatSnapshots[activeChatId]?.assignment ?? null : null;
  const effectiveAssignment = isRestoredView ? restoredAssignment : assignment;

  // Right pane: view a summary or checkpoint detail
  const [paneSummary, setPaneSummary] = useState<{
    label: string;
    text: string;
    sourceNodes?: RetrievalNode[];
    ticker?: string;
  } | null>(null);
  const [paneCheckpoint, setPaneCheckpoint] = useState<{
    label: string;
    fields: Array<{ label: string; value: string }>;
  } | null>(null);

  function openSummaryPane(label: string, text: string, sourceNodes?: RetrievalNode[], ticker?: string) {
    setPaneCheckpoint(null);
    setPaneSummary({ label, text, sourceNodes, ticker });
  }
  function openCheckpointPane(label: string, fields: Array<{ label: string; value: string }>) {
    setPaneSummary(null);
    setPaneCheckpoint({ label, fields });
  }
  function closePane() {
    setPaneSummary(null);
    setPaneCheckpoint(null);
  }

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

  // Start the study session
  async function handleStartSession() {
    if (!assignment) return;
    setParticipantId(assignment.participant_id);
    setStarted(true);
  }

  // Trigger the actual session start once
  useEffect(() => {
    if (started && !sessionStartedRef.current) {
      sessionStartedRef.current = true;
      chatIdRef.current = `chat-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      startAndRunCurrentPhase();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started]);

  // Auto-save to chat history whenever messages change
  useEffect(() => {
    if (!started || !sessionStartedRef.current || !assignment || !chatIdRef.current) return;
    if (messages.length === 0) return;
    const title = `${assignment.participant_id} - Study Session`;
    onSaveChat(chatIdRef.current, title, assignment);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, session]);

  // ── Right pane (shared between active and restored views) ──
  // Layer 2: PDF viewer (highest priority — covers entire right pane)
  // Layer 1: paneSummary | paneCheckpoint (overlay, one at a time)
  // Layer 0: SessionLedger (always visible during active session)
  const pdfViewer = useStudyStore((s) => s.pdfViewer);
  const closePdfViewer = useStudyStore((s) => s.closePdfViewer);
  const hasOverlay = !!(paneSummary || paneCheckpoint);

  const rightPane = (
    <div className="pi-right-pane">
      {/* Layer 2: PDF Viewer */}
      {pdfViewer && (
        <Suspense fallback={null}>
          <PdfViewerOverlay />
        </Suspense>
      )}

      {/* Layer 1: Overlay (hidden when PDF viewer is open) */}
      {!pdfViewer && paneSummary && (
        <div className="ledger-overlay">
          <div className="pi-right-header">
            <span className="pi-right-file">{paneSummary.label}</span>
            <button type="button" className="pi-close-pane-btn" onClick={closePane}>
              Close
            </button>
          </div>
          <div className="pi-right-body">
            <FormattedMarkdown text={paneSummary.text} />
            {paneSummary.sourceNodes && paneSummary.sourceNodes.length > 0 && (
              <SummarySources nodes={paneSummary.sourceNodes} tickerOverride={paneSummary.ticker} />
            )}
          </div>
        </div>
      )}
      {!pdfViewer && paneCheckpoint && (
        <div className="ledger-overlay">
          <div className="pi-right-header">
            <span className="pi-right-file">{paneCheckpoint.label}</span>
            <button type="button" className="pi-close-pane-btn" onClick={closePane}>
              Close
            </button>
          </div>
          <div className="pi-right-body">
            <div className="scg-cp-detail-list">
              {paneCheckpoint.fields.map((f, i) => (
                <div key={i} className="scg-cp-detail-row">
                  <span className="scg-cp-detail-label">{f.label}</span>
                  <span className="scg-cp-detail-value">{f.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Layer 0: Session Map (hidden when overlay or PDF viewer is open) */}
      {!pdfViewer && !hasOverlay && effectiveAssignment && (
        <SessionLedger
          assignment={effectiveAssignment}
          onViewSummary={openSummaryPane}
          onViewCheckpoint={openCheckpointPane}
        />
      )}
    </div>
  );

  // ── Restored view: show saved chat stream (read-only) ──
  if (isRestoredView && session && effectiveAssignment) {
    return (
      <section className="pi-chat-shell">
        <div className="pi-workspace">
          <div className="pi-left-pane scg-active-layout">
            <SessionBar assignment={effectiveAssignment} session={session} />
            <div className="pi-chat-stream">
              <div className="pi-transcript">
                <DocumentCard ticker={session.current_ticker} />
                <StreamRenderer
                  messages={messages}
                  readOnly
                  isLoading={false}
                  onSubmitNodeSelection={submitNodeSelection}
                  onSubmitEditedSummary={submitEditedSummary}
                  onTriggerGeneration={triggerGeneration}
                  onViewSummary={openSummaryPane}
                  onViewCheckpoint={openCheckpointPane}
                />
                <div className="pi-run-meta pi-status-row" style={{ marginTop: 16 }}>
                  <span style={{ opacity: 0.6 }}>Viewing saved session</span>
                </div>
              </div>
            </div>
          </div>
          {rightPane}
        </div>
      </section>
    );
  }

  // ── Screen 1: Study onboarding ──
  if (!assignment) {
    return (
      <section className="pi-chat-shell">
        <div className="pi-workspace pane-collapsed">
          <div className="pi-left-pane">
            <div className="pi-chat-stream">
              <div className="scg-onboard">
                {/* Header */}
                <div className="scg-onboard-header">
                  <h1 className="scg-onboard-title">FinRisk AI Study</h1>
                  <p className="scg-onboard-tagline">
                    Use an AI-powered tool to create financial risk summaries from company 10-K filings
                  </p>
                </div>

                {/* Video */}
                <VideoPlaceholder />

                {/* At-a-glance */}
                <div className="scg-glance-row">
                  <div className="scg-glance-card">
                    <span className="scg-glance-icon">&#9201;</span>
                    <span className="scg-glance-value">~15 min</span>
                    <span className="scg-glance-label">Duration</span>
                  </div>
                  <div className="scg-glance-card">
                    <span className="scg-glance-icon">&#9635;</span>
                    <span className="scg-glance-value">3 Phases</span>
                    <span className="scg-glance-label">3 Company 10-Ks</span>
                  </div>
                  <div className="scg-glance-card">
                    <span className="scg-glance-icon">&#9881;</span>
                    <span className="scg-glance-value">Risk Summary</span>
                    <span className="scg-glance-label">Your deliverable</span>
                  </div>
                </div>

                {/* Pipeline */}
                <div className="scg-onboard-pipeline">
                  <div className="scg-onboard-pipeline-label">How it works</div>
                  <div className="scg-onboard-pipeline-row">
                    {["Retrieve", "Select", "Generate", "Edit"].map((step, i) => (
                      <Fragment key={step}>
                        {i > 0 && <span className="scg-onboard-pipe-arrow">&rsaquo;</span>}
                        <span className="scg-onboard-pipe-chip">{step}</span>
                      </Fragment>
                    ))}
                  </div>
                  <p className="scg-onboard-pipeline-desc">
                    Each phase produces one risk summary. The AI retrieves and drafts — you guide the result.
                  </p>
                </div>

                {/* Divider */}
                <div className="scg-onboard-divider" />

                {/* Form */}
                <div className="scg-onboard-form-section">
                  <div className="scg-onboard-form-label">Enter your participant ID to begin</div>
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
                      {isFetching ? "Loading\u2026" : "Load Participant"}
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

                <WelcomeBlock />

                <div className="scg-section-label">Your 3 phases</div>

                <div className="scg-phases-col">
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
                    Begins Phase 1 ({MODE_LABELS[assignment.phases[0].mode]}) with{" "}
                    {assignment.phases[0].ticker}. Estimated ~15 minutes total.
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
      <div className="pi-workspace">
        <div className="pi-left-pane scg-active-layout">
          <SessionBar assignment={assignment} session={session} />

          <div className="pi-chat-stream">
            <div className="pi-transcript">
              <StreamRenderer
                messages={messages}
                readOnly={false}
                isLoading={isLoading}
                onSubmitNodeSelection={submitNodeSelection}
                onSubmitEditedSummary={submitEditedSummary}
                onTriggerGeneration={triggerGeneration}
                onViewSummary={openSummaryPane}
                onViewCheckpoint={openCheckpointPane}
              />
            </div>
          </div>

          {studyError && <div className="scg-error" style={{ margin: "0 16px 8px" }}>{studyError}</div>}

          {/* Pinned tail action zone */}
          <TailActionZone
            tailAction={tailAction}
            activeCheckpoints={activeCheckpoints}
            isLoading={isLoading}
            onStartQuestionnaire={startQuestionnaire}
            onSubmitCheckpoint={submitCheckpoint}
            onSkipCheckpoint={skipCheckpoint}
            onAdvancePhase={advancePhase}
          />

        </div>
        {rightPane}
      </div>
    </section>
  );
}

// ===========================================================================
// StreamRenderer — Pure type-switch message renderer
// ===========================================================================

interface StreamRendererProps {
  messages: ChatMessage[];
  readOnly: boolean;
  isLoading: boolean;
  onSubmitNodeSelection: (taskId: string, selected: string[], rejected: string[], order: string[]) => Promise<void>;
  onSubmitEditedSummary: (taskId: string, editedText: string, firstEditAtMs?: number | null) => Promise<void>;
  onTriggerGeneration: (taskId: string) => Promise<void>;
  onViewSummary: (label: string, text: string, sourceNodes?: RetrievalNode[], ticker?: string) => void;
  onViewCheckpoint: (label: string, fields: Array<{ label: string; value: string }>) => void;
}

function StreamRenderer({
  messages,
  readOnly,
  isLoading,
  onSubmitNodeSelection,
  onSubmitEditedSummary,
  onTriggerGeneration,
  onViewSummary,
  onViewCheckpoint,
}: StreamRendererProps) {
  return (
    <>
      {messages.map((msg) => {
        switch (msg.type) {
          case "phase_start":
            return (
              <Fragment key={msg.id}>
                <PhaseStartCard msg={msg} />
                <DocumentCard ticker={msg.ticker} />
              </Fragment>
            );

          case "text":
            return <TextBubble key={msg.id} role={msg.role} content={msg.content} />;

          case "loading":
            return readOnly ? null : (
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

          case "retrieved_nodes":
            return <RetrievedNodesCard key={msg.id} nodes={msg.nodes} />;

          case "selector":
            return readOnly || msg.submitted ? (
              <div key={msg.id} className="pi-selector-card">
                <div className="pi-selector-header">
                  <span>Chunk selection submitted</span>
                  <span className="pi-selector-meta">{msg.selectedCount ?? msg.nodes.length} selected</span>
                </div>
              </div>
            ) : (
              <SelectorCard
                key={msg.id}
                taskId={msg.taskId}
                nodes={msg.nodes}
                onSubmit={onSubmitNodeSelection}
                disabled={isLoading}
              />
            );

          case "generate_prompt":
            return readOnly ? (
              <div key={msg.id} className="pi-step-card completed">
                <div className="pi-step-left">
                  <span className="pi-step-icon">&#10003;</span>
                  <span>Generate Summary (triggered)</span>
                </div>
              </div>
            ) : (
              <GeneratePromptCard
                key={msg.id}
                taskId={msg.taskId}
                onGenerate={onTriggerGeneration}
                disabled={isLoading}
              />
            );

          case "summary":
            return (
              <div key={msg.id} className="pi-answer-card">
                <div className="pi-answer-label">Generated Summary</div>
                <FormattedMarkdown text={msg.summary} />
                {msg.sourceNodes && msg.sourceNodes.length > 0 && (
                  <SummarySources nodes={msg.sourceNodes} />
                )}
              </div>
            );

          case "editable_summary":
            return readOnly ? (
              <div key={msg.id} className="pi-answer-card">
                <div className="pi-answer-label">Generated Summary</div>
                <FormattedMarkdown text={msg.summary} />
                {msg.sourceNodes && msg.sourceNodes.length > 0 && (
                  <SummarySources nodes={msg.sourceNodes} />
                )}
              </div>
            ) : (
              <EditableSummaryCard
                key={msg.id}
                taskId={msg.taskId}
                summary={msg.summary}
                sourceNodes={msg.sourceNodes}
                onSubmit={onSubmitEditedSummary}
                onViewSummary={onViewSummary}
                disabled={isLoading}
              />
            );

          case "submitted_checkpoint":
            return (
              <SubmittedCheckpointCard
                key={msg.id}
                label={msg.label}
                state={msg.state}
                fields={msg.fields}
                onViewCheckpoint={onViewCheckpoint}
              />
            );

          default:
            return null;
        }
      })}
    </>
  );
}

// ===========================================================================
// TailActionZone — Pinned below the scrollable stream
// ===========================================================================

interface TailActionZoneProps {
  tailAction: TailAction | null;
  activeCheckpoints: CheckpointInstance[];
  isLoading: boolean;
  onStartQuestionnaire: () => void;
  onSubmitCheckpoint: (definitionId: string, data: Record<string, unknown>) => void;
  onSkipCheckpoint: (definitionId: string) => void;
  onAdvancePhase: () => Promise<void>;
}

function TailActionZone({
  tailAction,
  activeCheckpoints,
  isLoading,
  onStartQuestionnaire,
  onSubmitCheckpoint,
  onSkipCheckpoint,
  onAdvancePhase,
}: TailActionZoneProps) {
  if (!tailAction && activeCheckpoints.length === 0) return null;

  return (
    <div className="scg-tail-zone">
      {/* Active checkpoint forms */}
      {activeCheckpoints.map((inst) => (
        <ActiveCheckpointCard
          key={inst.id}
          definitionId={inst.definition_id}
          instance={inst}
          onSubmit={onSubmitCheckpoint}
          onSkip={onSkipCheckpoint}
        />
      ))}

      {/* Tail action buttons */}
      {tailAction?.type === "questionnaire_prompt" && (
        <QuestionnairePromptCard onContinue={onStartQuestionnaire} />
      )}
      {tailAction?.type === "phase_advance" && (
        <div className="scg-advance-section">
          <button
            type="button"
            className="pi-primary-btn"
            onClick={() => void onAdvancePhase()}
            disabled={isLoading}
          >
            Next Phase ▶ Phase {tailAction.nextPhase}
          </button>
        </div>
      )}
      {tailAction?.type === "session_complete" && (
        <div className="pi-run-meta pi-status-row" style={{ marginTop: 8 }}>
          <span>Study session complete. All 3 phases finished.</span>
        </div>
      )}
    </div>
  );
}

// ===========================================================================
// Sub-components
// ===========================================================================

function SessionBar({ assignment, session }: { assignment: ParticipantAssignment; session: SessionState | null }) {
  return (
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
  );
}

function DocumentCard({ ticker }: { ticker: string }) {
  const pdfUrl = useStudyStore((s) => s.pdfUrlMap[ticker]);
  const openPdfViewer = useStudyStore((s) => s.openPdfViewer);
  const thumbSrc = `${BASE_URL}/api/documents/thumb/${ticker}`;

  return (
    <button
      type="button"
      className="scg-doc-card"
      onClick={() => pdfUrl && openPdfViewer({ url: pdfUrl, page: 1, ticker })}
    >
      <div className="scg-doc-thumb">
        <img
          src={thumbSrc}
          alt={`${ticker} 10-K page 1`}
          className="scg-doc-thumb-img"
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
        />
      </div>
      <div className="scg-doc-info">
        <span className="scg-doc-name">{ticker}_10-K_Annual_Report.pdf</span>
        <span className="scg-doc-meta">10-K Annual Filing</span>
      </div>
    </button>
  );
}

function PhaseStartCard({ msg }: { msg: Extract<ChatMessage, { type: "phase_start" }> }) {
  return (
    <div className="scg-phase-start-card">
      <div className="scg-phase-start-header">
        <span className="scg-phase-num">Phase {msg.phase}</span>
        <span className={`scp-mode-badge ${MODE_COLORS[msg.mode] ?? ""}`}>
          {MODE_LABELS[msg.mode] ?? msg.mode}
        </span>
        <span className="scg-session-ticker">{msg.ticker}</span>
      </div>
    </div>
  );
}

function TextBubble({ role, content }: { role: "system" | "user" | "assistant"; content: string }) {
  if (role === "system") {
    return (
      <div className="pi-assistant-text" style={{ opacity: 0.7, fontSize: 13 }}>
        {content}
      </div>
    );
  }
  if (role === "user") {
    return <div className="pi-user-bubble">{content}</div>;
  }
  return <div className="pi-assistant-text">{content}</div>;
}

function RetrievedNodesCard({ nodes }: { nodes: RetrievalNode[] }) {
  return (
    <div className="pi-step-card completed">
      <div className="pi-step-left">
        <span className="pi-step-icon">&#10003;</span>
        <span>Retrieved {nodes.length} chunks</span>
      </div>
      <div className="pi-step-right">
        {nodes.map((n) => cleanChunkPreview(n.title)).slice(0, 3).join(", ")}
        {nodes.length > 3 ? ` +${nodes.length - 3} more` : ""}
      </div>
    </div>
  );
}

function WelcomeBlock() {
  const steps = [
    { num: "1", label: "Retrieve", desc: "AI fetches relevant chunks from the 10-K filing" },
    { num: "2", label: "Select", desc: "You choose which chunks to keep", note: "HITL-R & Full" },
    { num: "3", label: "Generate", desc: "AI produces a risk summary from selected chunks" },
    { num: "4", label: "Edit", desc: "You refine the AI summary", note: "HITL-G & Full" },
  ];

  return (
    <div className="scg-welcome-block">
      <h2 className="scg-welcome-title">Welcome to your study session</h2>
      <p className="scg-welcome-body">
        You will analyse 3 companies by querying an AI-powered financial risk
        tool. Each phase uses a different interaction mode, which determines how
        much control you have over the AI pipeline.
      </p>
      <div className="scg-pipeline-steps">
        {steps.map((step, i) => (
          <Fragment key={step.num}>
            {i > 0 && <span className="scg-pipe-arrow">&rsaquo;</span>}
            <div className="scg-pipe-step">
              <span className="scg-pipe-num">{step.num}</span>
              <span className="scg-pipe-label">{step.label}</span>
              <span className="scg-pipe-desc">{step.desc}</span>
              {step.note && <span className="scg-pipe-note">{step.note}</span>}
            </div>
          </Fragment>
        ))}
      </div>
    </div>
  );
}

function VideoPlaceholder() {
  if (VIDEO_CONFIG.type === "youtube" && VIDEO_CONFIG.youtubeUrl) {
    return (
      <div className="scg-video-wrapper">
        <iframe
          className="scg-video-iframe"
          src={VIDEO_CONFIG.youtubeUrl}
          title="Study introduction video"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }
  if (VIDEO_CONFIG.type === "local" && VIDEO_CONFIG.localSrc) {
    return (
      <div className="scg-video-wrapper">
        <video className="scg-video-element" src={VIDEO_CONFIG.localSrc} controls preload="metadata">
          Your browser does not support the video element.
        </video>
      </div>
    );
  }
  return (
    <div className="scg-video-wrapper scg-video-placeholder">
      <div className="scg-video-play">&#9654;</div>
      <div className="scg-video-cta">Watch a 30-sec intro</div>
      <div className="scg-video-note">Video coming soon</div>
    </div>
  );
}

function PhaseOverviewCard({ phase, isCurrent }: { phase: PhaseAssignment; isCurrent: boolean }) {
  const thumbSrc = `${BASE_URL}/api/documents/thumb/${phase.ticker}`;

  return (
    <div className={`scg-phase-card ${isCurrent ? "scg-current" : ""}`}>
      <div className="scg-phase-top">
        <div className="scg-phase-thumb">
          <img
            src={thumbSrc}
            alt={`${phase.ticker} 10-K page 1`}
            className="scg-phase-thumb-img"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        </div>
        <div className="scg-phase-info">
          <div className="scg-phase-header">
            <span className="scg-phase-num">Phase {phase.phase}</span>
            <span className={`scp-mode-badge ${MODE_COLORS[phase.mode] ?? ""}`}>
              {MODE_LABELS[phase.mode] ?? phase.mode}
            </span>
          </div>
          <div className="scg-phase-ticker">{phase.ticker}</div>
          <div className="scg-phase-query">{phase.query}</div>
        </div>
      </div>

      <div className="scg-phase-role">
        <span className="scg-role-label">Your role</span>
        <span className="scg-role-text">
          {MODE_ROLE_DESCRIPTIONS[phase.mode] ?? "Complete the phase as directed."}
        </span>
      </div>

      {phase.checkpoints.length > 0 && (
        <div className="scg-phase-cps">
          {phase.checkpoints.map((cp) => (
            <span key={cp.definition_id} className="scg-cp-tag">
              {cp.label || cp.control_type}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Interactive sub-components ──

function TruncatedContent({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const preview = cleanChunkPreview(text);
  const needsTruncation = preview.length > CHUNK_TRUNCATE_LEN;

  return (
    <div className="pi-selector-content">
      {expanded ? (
        <FormattedMarkdown text={cleanChunkMarkdown(text)} />
      ) : (
        needsTruncation ? preview.slice(0, CHUNK_TRUNCATE_LEN) + "…" : preview
      )}
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
              <div className="pi-selector-title">{cleanChunkPreview(node.title)}</div>
              <TruncatedContent text={node.relevant_content} />
              <CitationChip title={node.title} pageIndex={node.page_index} />
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
  sourceNodes,
  onSubmit,
  onViewSummary,
  disabled,
}: {
  taskId: string;
  summary: string;
  sourceNodes?: RetrievalNode[];
  onSubmit: (taskId: string, editedText: string, firstEditAtMs?: number | null) => Promise<void>;
  onViewSummary: (label: string, text: string, sourceNodes?: RetrievalNode[]) => void;
  disabled: boolean;
}) {
  const [phase, setPhase] = useState<"reviewing" | "editing" | "submitted">("reviewing");
  const [text, setText] = useState(summary);
  const firstEditRef = useRef<number | null>(null);

  function handleTextChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    if (firstEditRef.current === null) {
      firstEditRef.current = Date.now();
    }
    setText(e.target.value);
  }

  async function handleAccept() {
    setPhase("submitted");
    await onSubmit(taskId, summary, null);
  }

  async function handleSubmitEdit() {
    setPhase("submitted");
    await onSubmit(taskId, text, firstEditRef.current);
  }

  if (phase === "submitted") {
    const wasEdited = text !== summary;
    return (
      <>
        {wasEdited && (
          <div className="pi-step-card completed">
            <div className="pi-step-left">
              <span className="pi-step-icon">&#9998;</span>
              <span>User edited the generated summary</span>
            </div>
            <button
              type="button"
              className="pi-show-more-btn"
              onClick={() => onViewSummary("Edited Summary", text, sourceNodes)}
            >
              View edited version
            </button>
          </div>
        )}
        <div className="pi-answer-card">
          <div className="pi-answer-label">
            {wasEdited ? "Original Summary" : "Generated Summary (accepted)"}
          </div>
          <FormattedMarkdown text={summary} />
          {sourceNodes && sourceNodes.length > 0 && (
            <SummarySources nodes={sourceNodes} />
          )}
        </div>
      </>
    );
  }

  if (phase === "editing") {
    return (
      <div className="pi-inline-control-card">
        <div className="pi-postgen-title">Edit the generated summary</div>
        <textarea
          className="pi-edit-textarea"
          value={text}
          onChange={handleTextChange}
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

  return (
    <div className="pi-inline-control-card">
      <div className="pi-answer-label">Generated Summary</div>
      <FormattedMarkdown text={summary} />
      {sourceNodes && sourceNodes.length > 0 && (
        <SummarySources nodes={sourceNodes} />
      )}
      <div className="pi-postgen-actions">
        <button
          type="button"
          className="pi-primary-btn"
          onClick={() => void handleAccept()}
          disabled={disabled}
        >
          Accept
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

function GeneratePromptCard({
  taskId,
  onGenerate,
  disabled,
}: {
  taskId: string;
  onGenerate: (taskId: string) => Promise<void>;
  disabled: boolean;
}) {
  const [clicked, setClicked] = useState(false);

  async function handleClick() {
    if (clicked || disabled) return;
    setClicked(true);
    await onGenerate(taskId);
  }

  if (clicked) return null;

  return (
    <div className="scg-action-prompt">
      <div className="scg-action-prompt-text">
        Chunks retrieved. Review above, then generate a summary when ready.
      </div>
      <button
        type="button"
        className="pi-primary-btn scg-action-prompt-btn"
        onClick={() => void handleClick()}
        disabled={disabled}
      >
        Generate Summary ▶
      </button>
    </div>
  );
}

function QuestionnairePromptCard({ onContinue }: { onContinue: () => void }) {
  const [clicked, setClicked] = useState(false);

  function handleClick() {
    if (clicked) return;
    setClicked(true);
    onContinue();
  }

  if (clicked) return null;

  return (
    <div className="scg-action-prompt">
      <div className="scg-action-prompt-text">
        Summary complete. Proceed to the questionnaire when you&apos;re ready.
      </div>
      <button
        type="button"
        className="pi-primary-btn scg-action-prompt-btn"
        onClick={handleClick}
      >
        Continue to Questionnaire ▶
      </button>
    </div>
  );
}

function ActiveCheckpointCard({
  definitionId,
  instance,
  onSubmit,
  onSkip,
}: {
  definitionId: string;
  instance: CheckpointInstance;
  onSubmit: (definitionId: string, data: Record<string, unknown>) => void;
  onSkip: (definitionId: string) => void;
}) {
  const [inst, setInst] = useState(instance);

  return (
    <DynamicControlRenderer
      instance={inst}
      onSubmit={(_id, data) => {
        setInst((prev) => ({ ...prev, state: "submitted" as CheckpointState, submit_result: data }));
        onSubmit(definitionId, data);
      }}
      onSkip={(_id) => {
        setInst((prev) => ({ ...prev, state: "skipped" as CheckpointState }));
        onSkip(definitionId);
      }}
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

function SubmittedCheckpointCard({
  label,
  state,
  fields,
  onViewCheckpoint,
}: {
  label: string;
  state: "submitted" | "skipped";
  fields: Array<{ label: string; value: string }>;
  onViewCheckpoint: (label: string, fields: Array<{ label: string; value: string }>) => void;
}) {
  if (state === "skipped") {
    return (
      <div className="pi-step-card completed scg-cp-clickable">
        <div className="pi-step-left">
          <span className="pi-step-icon">&#8594;</span>
          <span>{label}</span>
          <span className="cp-control-badge skipped">Skipped</span>
        </div>
      </div>
    );
  }

  return (
    <div className="pi-step-card completed scg-cp-clickable">
      <div className="pi-step-left">
        <span className="pi-step-icon">&#10003;</span>
        <span>{label}</span>
        <span className="cp-control-badge submitted">Submitted</span>
      </div>
      <button
        type="button"
        className="pi-show-more-btn"
        onClick={() => onViewCheckpoint(label, fields)}
      >
        View responses
      </button>
    </div>
  );
}

function CitationChip({ title, pageIndex, tickerOverride }: { title: string; pageIndex: number; tickerOverride?: string }) {
  const pdfUrlMap = useStudyStore((s) => s.pdfUrlMap);
  const openPdfViewer = useStudyStore((s) => s.openPdfViewer);
  const sessionTicker = useStudyStore((s) => s.session?.current_ticker);
  const ticker = tickerOverride ?? sessionTicker;

  const pdfUrl = ticker ? pdfUrlMap[ticker] : null;

  if (pdfUrl && ticker) {
    return (
      <button
        type="button"
        className="pi-citation-chip pi-citation-chip-btn"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          openPdfViewer({ url: pdfUrl, page: pageIndex, ticker, highlightText: title });
        }}
        title={`Open PDF at page ${pageIndex}`}
      >
        [{cleanChunkPreview(title)}, Page {pageIndex}]
      </button>
    );
  }

  return (
    <span className="pi-citation-chip">
      [{cleanChunkPreview(title)}, Page {pageIndex}]
    </span>
  );
}

function SummarySources({ nodes, tickerOverride }: { nodes: RetrievalNode[]; tickerOverride?: string }) {
  // Deduplicate by page_index (multiple chunks can share a page)
  const uniquePages = new Map<number, RetrievalNode>();
  for (const n of nodes) {
    if (!uniquePages.has(n.page_index)) uniquePages.set(n.page_index, n);
  }
  const sorted = [...uniquePages.values()].sort((a, b) => a.page_index - b.page_index);

  return (
    <div className="pi-summary-sources">
      <span className="pi-summary-sources-label">Sources:</span>
      <div className="pi-summary-sources-chips">
        {sorted.map((n) => (
          <CitationChip key={n.node_id} title={n.title} pageIndex={n.page_index} tickerOverride={tickerOverride} />
        ))}
      </div>
    </div>
  );
}
