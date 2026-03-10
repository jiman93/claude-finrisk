import { create } from "zustand";
import { persist } from "zustand/middleware";

import {
  completeSession,
  completeTask,
  editSummaryTask,
  generateTask,
  nextPhase,
  patchPdfDuration,
  queryTask,
  selectNodesTask,
  startSession,
  submitFeedbackTask,
} from "../api/client";
import { fetchDocumentsMap } from "../components/DocumentsPanel";
import { SEED_DEFINITIONS } from "../data/checkpointDefinitions";
import type {
  ChatMessage,
  ChatSnapshot,
  CheckpointInstance,
  LedgerFeedback,
  LedgerPhase,
  LedgerRetrieval,
  LedgerSummary,
  Mode,
  ParticipantAssignment,
  PhaseAssignment,
  RetrievalNode,
  SessionState,
  TailAction,
  TraversalStep,
} from "../types";

// ---------------------------------------------------------------------------
// Interface
// ---------------------------------------------------------------------------

interface StudyState {
  // Active session state
  participantId: string;
  session: SessionState | null;
  assignment: ParticipantAssignment | null;
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;

  // Pinned tail action zone — lives outside the scrollable stream
  tailAction: TailAction | null;
  activeCheckpoints: CheckpointInstance[];

  // Session Ledger
  ledgerPhases: LedgerPhase[];

  // Documents: ticker → full PDF URL
  pdfUrlMap: Record<string, string>;

  // In-app PDF viewer
  pdfViewer: { url: string; page: number; ticker: string; highlightText?: string } | null;
  pdfViewOpenedAt: number | null;
  pdfViewDurationMs: number;

  // Chat history
  activeChatId: string | null;
  chatSnapshots: Record<string, ChatSnapshot>;
  chatOrder: string[];

  // Ledger actions
  initLedgerPhases: (assignment: ParticipantAssignment) => void;
  appendLedgerQuery: (phase: number, query: string) => void;
  appendLedgerRetrieval: (phase: number, retrieval: LedgerRetrieval) => void;
  updateLedgerRetrievalSelection: (phase: number, selectedIds: string[], rejectedIds: string[]) => void;
  appendLedgerSummary: (phase: number, summary: LedgerSummary) => void;
  appendLedgerFeedback: (phase: number, feedback: LedgerFeedback) => void;
  setLedgerActiveStep: (phase: number, step: LedgerPhase["activeStep"]) => void;
  advanceLedgerPhase: (completedPhase: number) => void;

  // Active session actions
  setParticipantId: (participantId: string) => void;
  setAssignment: (assignment: ParticipantAssignment | null) => void;
  startAndRunCurrentPhase: () => Promise<void>;
  askQuery: (query: string) => Promise<void>;
  triggerGeneration: (taskId: string) => Promise<void>;
  advancePhase: () => Promise<void>;
  submitNodeSelection: (
    taskId: string,
    selectedIds: string[],
    rejectedIds: string[],
    order: string[]
  ) => Promise<void>;
  submitEditedSummary: (taskId: string, editedText: string, firstEditAtMs?: number | null) => Promise<void>;
  startQuestionnaire: () => void;
  submitCheckpoint: (definitionId: string, data: Record<string, unknown>) => void;
  skipCheckpoint: (definitionId: string) => void;

  // Documents actions
  loadPdfUrlMap: () => Promise<void>;
  openPdfViewer: (params: { url: string; page: number; ticker: string; highlightText?: string }) => void;
  closePdfViewer: () => void;

  // Chat history actions
  saveChat: (chatId: string, title: string, assignment: ParticipantAssignment) => void;
  loadChat: (chatId: string) => void;
  clearForNewChat: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/** Get the current phase assignment from the store's assignment. */
function getCurrentPhaseAssignment(
  assignment: ParticipantAssignment | null,
  session: SessionState | null
): PhaseAssignment | undefined {
  if (!assignment || !session) return undefined;
  return assignment.phases.find((p) => p.phase === session.current_phase);
}

/** Build LedgerChunk[] from RetrievalNode[] (all initially selected). */
function buildLedgerChunks(nodes: RetrievalNode[]): import("../types").LedgerChunk[] {
  return nodes.map((n, i) => ({
    id: n.node_id,
    index: i + 1,
    title: n.title,
    pageRef: `Page ${n.page_index}`,
    contentPreview: n.relevant_content,
    selected: true,
  }));
}

/** Get post-generation checkpoint refs for a phase. */
function getPostGenCheckpoints(phase: PhaseAssignment | undefined) {
  if (!phase) return [];
  return phase.checkpoints.filter((cp) => cp.pipeline_position === "post_generation");
}

/** Build field label→value pairs for a submitted checkpoint. */
function buildFieldSummary(definitionId: string, data: Record<string, unknown>) {
  const def = SEED_DEFINITIONS.find((d) => d.id === definitionId);
  if (!def) return [];
  return def.field_schema.map((field) => {
    const val = data[field.key];
    const display =
      val === undefined || val === null || val === ""
        ? "—"
        : Array.isArray(val)
          ? val.join(", ")
          : String(val);
    return { label: field.label, value: display };
  });
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useStudyStore = create<StudyState>()(
  persist(
    (set, get) => ({
  participantId: "P01",
  session: null,
  assignment: null,
  messages: [],
  isLoading: false,
  error: null,

  tailAction: null,
  activeCheckpoints: [],

  ledgerPhases: [],

  pdfUrlMap: {},
  pdfViewer: null,
  pdfViewOpenedAt: null as number | null,
  pdfViewDurationMs: 0,

  activeChatId: null,
  chatSnapshots: {},
  chatOrder: [],

  // ── Ledger actions ──

  initLedgerPhases: (assignment) => {
    const phases: LedgerPhase[] = assignment.phases.map((p, i) => ({
      phase: p.phase,
      mode: p.mode,
      ticker: p.ticker,
      status: i === 0 ? "active" : "upcoming",
      query: null,
      retrieval: null,
      summary: null,
      feedback: null,
      activeStep: i === 0 ? "query" : null,
    }));
    set({ ledgerPhases: phases });
  },

  appendLedgerQuery: (phase, query) => {
    set((state) => ({
      ledgerPhases: state.ledgerPhases.map((lp) =>
        lp.phase === phase
          ? { ...lp, query: { text: query, submittedAt: new Date().toISOString() }, activeStep: "retrieval" }
          : lp
      ),
    }));
  },

  appendLedgerRetrieval: (phase, retrieval) => {
    set((state) => ({
      ledgerPhases: state.ledgerPhases.map((lp) =>
        lp.phase === phase
          ? { ...lp, retrieval, activeStep: retrieval.selectionEnabled ? "retrieval" : "generation" }
          : lp
      ),
    }));
  },

  updateLedgerRetrievalSelection: (phase, selectedIds, rejectedIds) => {
    set((state) => ({
      ledgerPhases: state.ledgerPhases.map((lp) => {
        if (lp.phase !== phase || !lp.retrieval) return lp;
        return {
          ...lp,
          retrieval: {
            ...lp.retrieval,
            totalSelected: selectedIds.length,
            chunks: lp.retrieval.chunks.map((c) => ({
              ...c,
              selected: selectedIds.includes(c.id) ? true : rejectedIds.includes(c.id) ? false : c.selected,
            })),
          },
          activeStep: "generation",
        };
      }),
    }));
  },

  appendLedgerSummary: (phase, summary) => {
    set((state) => ({
      ledgerPhases: state.ledgerPhases.map((lp) =>
        lp.phase === phase
          ? { ...lp, summary, activeStep: summary.wasEdited ? "edit" : "questionnaire" }
          : lp
      ),
    }));
  },

  appendLedgerFeedback: (phase, feedback) => {
    set((state) => ({
      ledgerPhases: state.ledgerPhases.map((lp) =>
        lp.phase === phase ? { ...lp, feedback } : lp
      ),
    }));
  },

  setLedgerActiveStep: (phase, step) => {
    set((state) => ({
      ledgerPhases: state.ledgerPhases.map((lp) =>
        lp.phase === phase ? { ...lp, activeStep: step } : lp
      ),
    }));
  },

  advanceLedgerPhase: (completedPhase) => {
    set((state) => ({
      ledgerPhases: state.ledgerPhases.map((lp) => {
        if (lp.phase === completedPhase) return { ...lp, status: "completed", activeStep: null };
        if (lp.phase === completedPhase + 1) return { ...lp, status: "active", activeStep: "query" };
        return lp;
      }),
    }));
  },

  loadPdfUrlMap: async () => {
    if (Object.keys(get().pdfUrlMap).length > 0) return;
    const map = await fetchDocumentsMap();
    set({ pdfUrlMap: map });
  },

  openPdfViewer: (params) => set({ pdfViewer: params, pdfViewOpenedAt: Date.now() }),
  closePdfViewer: () => {
    const { pdfViewOpenedAt, pdfViewDurationMs } = get();
    const elapsed = pdfViewOpenedAt ? Date.now() - pdfViewOpenedAt : 0;
    set({ pdfViewer: null, pdfViewOpenedAt: null, pdfViewDurationMs: pdfViewDurationMs + elapsed });
  },

  setParticipantId: (participantId) => set({ participantId }),

  setAssignment: (assignment) => set({ assignment }),

  // ── Start session and run phase 1 ──

  startAndRunCurrentPhase: async () => {
    const { participantId, assignment } = get();
    set({ isLoading: true, error: null, messages: [], tailAction: null, activeCheckpoints: [] });
    try {
      const session = await startSession(participantId);
      set({
        session,
        messages: [
          {
            id: makeId("phase"),
            type: "phase_start",
            phase: session.current_phase,
            mode: session.current_mode,
            ticker: session.current_ticker,
            query: session.current_query,
          },
        ],
      });

      // Initialize ledger phases from assignment
      if (assignment) {
        get().initLedgerPhases(assignment);
      }

      // Load PDF URL map for citations (fire and forget)
      get().loadPdfUrlMap();

      await runTaskFlow({
        taskId: session.current_task_id,
        query: session.current_query,
        mode: session.current_mode,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unexpected error";
      set({ error: message, isLoading: false });
    }
  },

  // ── Ask a query (initial) ──

  askQuery: async (query) => {
    const session = get().session;
    const normalizedQuery = query.trim();
    if (!session || !normalizedQuery) return;

    await runTaskFlow({
      taskId: session.current_task_id,
      query: normalizedQuery,
      mode: session.current_mode,
    });
  },

  // ── Trigger generation ──

  triggerGeneration: async (taskId) => {
    const session = get().session;
    if (!session) return;

    const generationLoadingId = makeId("loading-generation");

    useStudyStore.setState((state) => ({
      isLoading: true,
      error: null,
      messages: [
        ...state.messages.filter((m) => m.type !== "generate_prompt"),
        { id: generationLoadingId, type: "loading", content: "Generating summary..." },
      ],
    }));

    try {
      const generation = await generateTask(taskId);
      useStudyStore.setState((state) => ({
        messages: state.messages.filter((m) => m.id !== generationLoadingId),
      }));

      const sourceNodes = generation.used_nodes;

      if (session.current_mode === "hitl_g" || session.current_mode === "hitl_full") {
        // Ledger: summary pending edit
        useStudyStore.getState().appendLedgerSummary(session.current_phase, {
          text: generation.summary,
          wasEdited: false,
          sourceNodes,
        });
        useStudyStore.getState().setLedgerActiveStep(session.current_phase, "edit");

        useStudyStore.setState((state) => ({
          messages: [
            ...state.messages,
            {
              id: makeId("edit"),
              type: "editable_summary",
              taskId,
              summary: generation.summary,
              sourceNodes,
            },
          ],
          isLoading: false,
        }));
        return;
      }

      // Baseline / HITL-R: push summary then set tail action
      useStudyStore.getState().appendLedgerSummary(session.current_phase, {
        text: generation.summary,
        wasEdited: false,
        sourceNodes,
      });
      useStudyStore.getState().setLedgerActiveStep(session.current_phase, "questionnaire");

      useStudyStore.setState((state) => ({
        messages: [
          ...state.messages,
          { id: makeId("summary"), type: "summary", summary: generation.summary, sourceNodes },
        ],
        isLoading: false,
      }));

      setTailActionForPostSummary();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unexpected error";
      useStudyStore.setState((state) => ({
        error: message,
        isLoading: false,
        messages: state.messages.filter((m) => m.id !== generationLoadingId),
      }));
    }
  },

  // ── Advance phase ──

  advancePhase: async () => {
    const { session } = get();
    if (!session) return;

    // Complete the outgoing task and flush PDF view duration
    completeTask(session.current_task_id).catch(console.error);
    flushPdfDuration(session.current_task_id);

    // Mark current ledger phase as completed, activate next
    get().advanceLedgerPhase(session.current_phase);

    set({ isLoading: true, error: null, tailAction: null, activeCheckpoints: [] });

    try {
      const next = await nextPhase(session.session_id);
      const updated: SessionState = {
        ...session,
        current_phase: next.current_phase,
        current_mode: next.current_mode,
        current_task_id: next.current_task_id,
        current_ticker: next.current_ticker,
        current_query: next.current_query,
      };
      set((state) => ({
        session: updated,
        messages: [
          ...state.messages,
          {
            id: makeId("phase"),
            type: "phase_start",
            phase: next.current_phase,
            mode: next.current_mode,
            ticker: next.current_ticker,
            query: next.current_query,
          },
        ],
      }));
      await runTaskFlow({
        taskId: next.current_task_id,
        query: next.current_query,
        mode: next.current_mode,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unexpected error";
      set({ error: message, isLoading: false });
    }
  },

  // ── Submit node selection (HITL-R / HITL-Full) ──

  submitNodeSelection: async (taskId, selectedIds, rejectedIds, order) => {
    const session = get().session;
    if (!session) return;

    set({ isLoading: true });

    try {
      await selectNodesTask(taskId, selectedIds, rejectedIds, order);

      // Update ledger with selection
      get().updateLedgerRetrievalSelection(session.current_phase, selectedIds, rejectedIds);

      set((state) => ({
        messages: [
          ...state.messages.map((m) =>
            m.type === "selector" && m.taskId === taskId
              ? { ...m, submitted: true, selectedCount: selectedIds.length }
              : m
          ),
          { id: makeId("gen-prompt"), type: "generate_prompt" as const, taskId },
        ],
        isLoading: false,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unexpected error";
      set({ error: message, isLoading: false });
    }
  },

  // ── Submit edited summary (HITL-G / HITL-Full) ──

  submitEditedSummary: async (taskId, editedText, firstEditAtMs) => {
    const session = get().session;
    set({ isLoading: true, error: null });
    try {
      const result = await editSummaryTask(taskId, editedText, [], firstEditAtMs);

      // Carry forward source nodes from the pre-edit summary
      const existingPhase = session
        ? get().ledgerPhases.find((lp) => lp.phase === session.current_phase)
        : undefined;
      const sourceNodes = existingPhase?.summary?.sourceNodes;

      // Update ledger summary with edit info
      if (session) {
        get().appendLedgerSummary(session.current_phase, {
          text: result.edited_summary,
          wasEdited: true,
          editCount: result.characters_edited > 0 ? 1 : 0,
          sourceNodes,
        });
        get().setLedgerActiveStep(session.current_phase, "questionnaire");
      }

      set((state) => ({
        messages: [
          ...state.messages,
          {
            id: makeId("summary"),
            type: "summary",
            summary: result.edited_summary,
            sourceNodes,
          },
        ],
        isLoading: false,
      }));

      setTailActionForPostSummary();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unexpected error";
      set({ error: message, isLoading: false });
    }
  },

  // ── Start questionnaire (user clicks "Continue to Questionnaire") ──

  startQuestionnaire: () => {
    const { session, assignment } = get();
    const currentPhase = getCurrentPhaseAssignment(assignment, session);
    const postGenCps = getPostGenCheckpoints(currentPhase);

    const instances: CheckpointInstance[] = [];

    for (const cp of postGenCps) {
      const def = SEED_DEFINITIONS.find((d) => d.id === cp.definition_id);
      if (!def || def.field_schema.length === 0) continue;

      instances.push({
        id: `post-gen-${cp.definition_id}-${Date.now()}`,
        task_id: session?.current_task_id ?? "study-task",
        definition_id: cp.definition_id,
        control_type: def.control_type,
        label: cp.label,
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

    set({ tailAction: null, activeCheckpoints: instances });
  },

  // ── Submit a checkpoint ──

  submitCheckpoint: (definitionId, data) => {
    const fields = buildFieldSummary(definitionId, data);
    const def = SEED_DEFINITIONS.find((d) => d.id === definitionId);
    const label = def?.label ?? definitionId;
    const session = get().session;

    // Append feedback to ledger
    if (session) {
      get().appendLedgerFeedback(session.current_phase, {
        completeness: data.completeness as number | undefined,
        accuracy: data.accuracy as number | undefined,
        citationHelpfulness: data.citation_helpfulness as string | undefined,
        perceivedControl: data.perceived_control as number | undefined,
        featureUsefulness: data.feature_usefulness as number | undefined,
        openFeedback: data.open_feedback as string | undefined,
      });
    }

    set((state) => ({
      activeCheckpoints: state.activeCheckpoints.filter(
        (cp) => cp.definition_id !== definitionId
      ),
      messages: [
        ...state.messages,
        {
          id: makeId("scp"),
          type: "submitted_checkpoint",
          definitionId,
          label,
          state: "submitted",
          fields,
        },
      ],
    }));

    // Persist feedback to backend (include accumulated PDF view duration)
    const taskId = session?.current_task_id;
    if (taskId) {
      const pdfDuration = get().pdfViewDurationMs;
      submitFeedbackTask(taskId, definitionId, data, pdfDuration > 0 ? pdfDuration : undefined).catch(console.error);
      set({ pdfViewDurationMs: 0, pdfViewOpenedAt: null });
    }

    checkAllCheckpointsDone();
  },

  // ── Skip a checkpoint ──

  skipCheckpoint: (definitionId) => {
    const def = SEED_DEFINITIONS.find((d) => d.id === definitionId);
    const label = def?.label ?? definitionId;

    set((state) => ({
      activeCheckpoints: state.activeCheckpoints.filter(
        (cp) => cp.definition_id !== definitionId
      ),
      messages: [
        ...state.messages,
        {
          id: makeId("scp"),
          type: "submitted_checkpoint",
          definitionId,
          label,
          state: "skipped",
          fields: [],
        },
      ],
    }));

    checkAllCheckpointsDone();
  },

  // ── Chat history actions ──

  saveChat: (chatId, title, assignment) => {
    const { session, messages, ledgerPhases } = get();
    const snapshot: ChatSnapshot = {
      chatId,
      title,
      session,
      messages: [...messages],
      assignment,
      ledgerPhases: [...ledgerPhases],
    };
    set((state) => {
      const newOrder = [chatId, ...state.chatOrder.filter((id) => id !== chatId)].slice(0, 20);
      return {
        activeChatId: chatId,
        chatSnapshots: { ...state.chatSnapshots, [chatId]: snapshot },
        chatOrder: newOrder,
      };
    });
  },

  loadChat: (chatId) => {
    const snapshot = get().chatSnapshots[chatId];
    if (!snapshot) return;
    set({
      activeChatId: chatId,
      session: snapshot.session,
      messages: [...snapshot.messages],
      assignment: snapshot.assignment,
      ledgerPhases: snapshot.ledgerPhases ?? [],
      isLoading: false,
      error: null,
      tailAction: null,
      activeCheckpoints: [],
    });
  },

  clearForNewChat: () => {
    set({
      activeChatId: null,
      session: null,
      assignment: null,
      messages: [],
      isLoading: false,
      error: null,
      participantId: "P01",
      tailAction: null,
      activeCheckpoints: [],
      ledgerPhases: [],
    });
  },
    }),
    {
      name: "finrisk-chat-history",
      partialize: (state) => ({
        chatSnapshots: state.chatSnapshots,
        chatOrder: state.chatOrder,
        activeChatId: state.activeChatId,
      }),
      merge: (persisted, current) => ({
        ...current,
        ...(persisted as Partial<StudyState>),
      }),
    }
  )
);

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

/** Flush accumulated PDF view duration to the backend (fire-and-forget). */
function flushPdfDuration(taskId: string) {
  const { pdfViewOpenedAt, pdfViewDurationMs } = useStudyStore.getState();
  const elapsed = pdfViewOpenedAt ? Date.now() - pdfViewOpenedAt : 0;
  const total = pdfViewDurationMs + elapsed;
  useStudyStore.setState({ pdfViewDurationMs: 0, pdfViewOpenedAt: null });
  if (total > 0) {
    patchPdfDuration(taskId, total).catch(console.error);
  }
}

/**
 * After a summary is finalized, set the appropriate tail action.
 * - If post-gen checkpoints exist → questionnaire_prompt
 * - Else if phase < 3 → phase_advance
 * - Else → session_complete
 */
function setTailActionForPostSummary() {
  const { session, assignment } = useStudyStore.getState();
  const currentPhase = getCurrentPhaseAssignment(assignment, session);
  const postGenCps = getPostGenCheckpoints(currentPhase);

  if (postGenCps.length > 0) {
    useStudyStore.setState({ tailAction: { type: "questionnaire_prompt" } });
  } else if (session && session.current_phase < 3) {
    useStudyStore.setState({
      tailAction: { type: "phase_advance", nextPhase: session.current_phase + 1 },
    });
  } else {
    // Final phase with no checkpoints — complete task/session and flush PDF duration
    if (session) {
      completeTask(session.current_task_id).catch(console.error);
      flushPdfDuration(session.current_task_id);
      completeSession(session.session_id).catch(console.error);
    }
    useStudyStore.setState({ tailAction: { type: "session_complete" } });
  }
}

/**
 * After a checkpoint is submitted/skipped, check if all post-gen checkpoints
 * for the current phase are done. If so, set tail action to phase_advance or session_complete.
 */
function checkAllCheckpointsDone() {
  const { session, assignment, messages, activeCheckpoints } = useStudyStore.getState();

  // If there are still active checkpoints, don't set tail yet
  if (activeCheckpoints.length > 0) return;

  const currentPhase = getCurrentPhaseAssignment(assignment, session);
  const postGenCps = getPostGenCheckpoints(currentPhase);
  if (postGenCps.length === 0) return;

  const allDone = postGenCps.every((cp) =>
    messages.some(
      (m) => m.type === "submitted_checkpoint" && m.definitionId === cp.definition_id
    )
  );

  if (!allDone) return;

  if (session && session.current_phase < 3) {
    useStudyStore.setState({
      tailAction: { type: "phase_advance", nextPhase: session.current_phase + 1 },
    });
  } else {
    // Mark final phase as completed in ledger, complete task and session
    if (session) {
      useStudyStore.getState().advanceLedgerPhase(session.current_phase);
      completeTask(session.current_task_id).catch(console.error);
      completeSession(session.session_id).catch(console.error);
    }
    useStudyStore.setState({ tailAction: { type: "session_complete" } });
  }
}

// ---------------------------------------------------------------------------
// Pipeline flow
// ---------------------------------------------------------------------------

interface RunTaskFlowParams {
  taskId: string;
  query: string;
  mode: Mode;
}

async function runTaskFlow({ taskId, query, mode }: RunTaskFlowParams) {
  const retrievalLoadingId = makeId("loading-retrieval");
  const session = useStudyStore.getState().session;
  const currentPhase = session?.current_phase ?? 1;

  useStudyStore.setState((state) => ({
    isLoading: true,
    error: null,
    messages: [
      ...state.messages,
      { id: makeId("msg"), type: "text", role: "user", content: query },
      { id: retrievalLoadingId, type: "loading", content: "Searching document..." },
    ],
  }));

  // Ledger: record query
  useStudyStore.getState().appendLedgerQuery(currentPhase, query);

  try {
    const retrieval = await queryTask(taskId, query);

    // Ledger: record retrieval
    const selectionEnabled = mode === "hitl_r" || mode === "hitl_full";
    useStudyStore.getState().appendLedgerRetrieval(currentPhase, {
      totalRetrieved: retrieval.retrieved_nodes.length,
      totalSelected: retrieval.retrieved_nodes.length,
      chunks: buildLedgerChunks(retrieval.retrieved_nodes),
      selectionEnabled,
    });

    // Build messages: optionally include traversal path for tree mode.
    const newMessages: ChatMessage[] = [];
    if (retrieval.traversal_path && retrieval.traversal_path.length > 0) {
      newMessages.push({
        id: makeId("traversal"),
        type: "traversal_path",
        steps: retrieval.traversal_path as TraversalStep[],
      });
    }
    newMessages.push({
      id: makeId("nodes"),
      type: "retrieved_nodes",
      nodes: retrieval.retrieved_nodes,
    });

    useStudyStore.setState((state) => ({
      messages: [
        ...state.messages.filter((m) => m.id !== retrievalLoadingId),
        ...newMessages,
      ],
    }));

    if (selectionEnabled) {
      useStudyStore.setState((state) => ({
        messages: [
          ...state.messages,
          {
            id: makeId("selector"),
            type: "selector",
            taskId,
            nodes: retrieval.retrieved_nodes,
          },
        ],
        isLoading: false,
      }));
      return;
    }

    useStudyStore.setState((state) => ({
      messages: [
        ...state.messages,
        { id: makeId("gen-prompt"), type: "generate_prompt", taskId },
      ],
      isLoading: false,
    }));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    useStudyStore.setState((state) => ({
      error: message,
      isLoading: false,
      messages: state.messages.filter((m) => m.id !== retrievalLoadingId),
    }));
  }
}
