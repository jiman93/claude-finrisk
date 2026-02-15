import { create } from "zustand";

import {
  completeSession,
  completeTask,
  editSummaryTask,
  generateTask,
  nextPhase,
  queryTask,
  selectNodesTask,
  startSession,
  submitQuestionnaireTask,
} from "../api/client";
import { SEED_DEFINITIONS } from "../data/checkpointDefinitions";
import type {
  ChatMessage,
  ChatSnapshot,
  CheckpointInstance,
  Mode,
  ParticipantAssignment,
  PhaseAssignment,
  SessionState,
  TailAction,
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

  // Chat history
  activeChatId: string | null;
  chatSnapshots: Record<string, ChatSnapshot>;
  chatOrder: string[];

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
  submitEditedSummary: (taskId: string, editedText: string) => Promise<void>;
  startQuestionnaire: () => void;
  submitCheckpoint: (definitionId: string, data: Record<string, unknown>) => Promise<void>;
  skipCheckpoint: (definitionId: string) => void;

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

export const useStudyStore = create<StudyState>((set, get) => ({
  participantId: "P01",
  session: null,
  assignment: null,
  messages: [],
  isLoading: false,
  error: null,

  tailAction: null,
  activeCheckpoints: [],

  activeChatId: null,
  chatSnapshots: {},
  chatOrder: [],

  setParticipantId: (participantId) => set({ participantId }),

  setAssignment: (assignment) => set({ assignment }),

  // ── Start session and run phase 1 ──

  startAndRunCurrentPhase: async () => {
    const { participantId } = get();
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

      if (session.current_mode === "hitl_g" || session.current_mode === "hitl_full") {
        useStudyStore.setState((state) => ({
          messages: [
            ...state.messages,
            {
              id: makeId("edit"),
              type: "editable_summary",
              taskId,
              summary: generation.summary,
            },
          ],
          isLoading: false,
        }));
        return;
      }

      // Baseline / HITL-R: push summary then set tail action
      useStudyStore.setState((state) => ({
        messages: [
          ...state.messages,
          { id: makeId("summary"), type: "summary", summary: generation.summary },
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

    set({ isLoading: true, error: null, tailAction: null, activeCheckpoints: [] });

    try {
      await completeTask(session.current_task_id);
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

      set((state) => ({
        messages: [
          ...state.messages.map((m) =>
            m.type === "selector" && m.taskId === taskId
              ? { ...m, submitted: true }
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

  submitEditedSummary: async (taskId, editedText) => {
    set({ isLoading: true, error: null });
    try {
      const result = await editSummaryTask(taskId, editedText, []);
      set((state) => ({
        messages: [
          ...state.messages,
          {
            id: makeId("summary"),
            type: "summary",
            summary: result.edited_summary,
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

  submitCheckpoint: async (definitionId, data) => {
    const { session } = get();
    if (!session) return;

    // Persist mandatory post-task questionnaire for backend analysis.
    if (definitionId === "seed-questionnaire") {
      await submitQuestionnaireTask(session.current_task_id, data);
    }

    const fields = buildFieldSummary(definitionId, data);
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
          state: "submitted",
          fields,
        },
      ],
    }));

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
    const { session, messages } = get();
    const snapshot: ChatSnapshot = {
      chatId,
      title,
      session,
      messages: [...messages],
      assignment,
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
    });
  },
}));

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

async function completeCurrentTaskForProtocol() {
  const { session } = useStudyStore.getState();
  if (!session) return;
  try {
    await completeTask(session.current_task_id);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    useStudyStore.setState({ error: message });
  }
}

async function completeSessionIfFinalPhase() {
  const { session } = useStudyStore.getState();
  if (!session || session.current_phase < 3) return;
  try {
    await completeTask(session.current_task_id);
    await completeSession(session.session_id);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    useStudyStore.setState({ error: message });
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
    void completeCurrentTaskForProtocol();
    useStudyStore.setState({
      tailAction: { type: "phase_advance", nextPhase: session.current_phase + 1 },
    });
  } else {
    void completeSessionIfFinalPhase();
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
    void completeCurrentTaskForProtocol();
    useStudyStore.setState({
      tailAction: { type: "phase_advance", nextPhase: session.current_phase + 1 },
    });
  } else {
    void completeSessionIfFinalPhase();
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

  useStudyStore.setState((state) => ({
    isLoading: true,
    error: null,
    messages: [
      ...state.messages,
      { id: makeId("msg"), type: "text", role: "user", content: query },
      { id: retrievalLoadingId, type: "loading", content: "Searching document..." },
    ],
  }));

  try {
    const retrieval = await queryTask(taskId, query);
    useStudyStore.setState((state) => ({
      messages: [
        ...state.messages.filter((m) => m.id !== retrievalLoadingId),
        { id: makeId("nodes"), type: "retrieved_nodes", nodes: retrieval.retrieved_nodes },
      ],
    }));

    if (mode === "hitl_r" || mode === "hitl_full") {
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
