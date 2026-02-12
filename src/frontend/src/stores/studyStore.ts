import { create } from "zustand";

import {
  editSummaryTask,
  generateTask,
  nextPhase,
  queryTask,
  selectNodesTask,
  startSession,
} from "../api/client";
import type {
  ChatMessage,
  ChatSnapshot,
  Mode,
  ParticipantAssignment,
  SessionState,
} from "../types";

interface StudyState {
  // Active session state
  participantId: string;
  session: SessionState | null;
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;

  // Follow-up query tracking
  followUpCounts: Record<number, number>; // phase → count of follow-up queries

  // Chat history
  activeChatId: string | null;
  chatSnapshots: Record<string, ChatSnapshot>; // chatId → snapshot
  chatOrder: string[]; // most-recent-first ordering of chatIds

  // Active session actions
  setParticipantId: (participantId: string) => void;
  startAndRunCurrentPhase: () => Promise<void>;
  askQuery: (query: string) => Promise<void>;
  askFollowUp: (query: string) => Promise<void>;
  triggerGeneration: (taskId: string) => Promise<void>;
  advancePhase: () => Promise<void>;
  submitNodeSelection: (
    taskId: string,
    selectedIds: string[],
    rejectedIds: string[],
    order: string[]
  ) => Promise<void>;
  submitEditedSummary: (taskId: string, editedText: string) => Promise<void>;
  addMessage: (msg: ChatMessage) => void;

  // Chat history actions
  saveChat: (chatId: string, title: string, assignment: ParticipantAssignment) => void;
  loadChat: (chatId: string) => void;
  clearForNewChat: () => void;
}

function makeId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export const useStudyStore = create<StudyState>((set, get) => ({
  participantId: "P01",
  session: null,
  messages: [],
  isLoading: false,
  error: null,

  followUpCounts: {},

  activeChatId: null,
  chatSnapshots: {},
  chatOrder: [],

  setParticipantId: (participantId) => set({ participantId }),

  startAndRunCurrentPhase: async () => {
    const { participantId } = get();
    set({ isLoading: true, error: null, messages: [] });
    try {
      const session = await startSession(participantId);
      set({
        session,
        messages: [
          {
            id: makeId("msg"),
            type: "text",
            role: "system",
            content: `Session started for ${session.participant_id} (Group ${session.group}).`,
          },
          {
            id: makeId("msg"),
            type: "text",
            role: "system",
            content: `Phase ${session.current_phase} | Mode ${session.current_mode} | Ticker ${session.current_ticker}`,
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

  askQuery: async (query) => {
    const session = get().session;
    const normalizedQuery = query.trim();
    if (!session || !normalizedQuery) {
      return;
    }

    await runTaskFlow({
      taskId: session.current_task_id,
      query: normalizedQuery,
      mode: session.current_mode,
    });
  },

  askFollowUp: async (query) => {
    const session = get().session;
    const normalizedQuery = query.trim();
    if (!session || !normalizedQuery) return;

    // Increment follow-up count for current phase
    set((state) => ({
      followUpCounts: {
        ...state.followUpCounts,
        [session.current_phase]: (state.followUpCounts[session.current_phase] ?? 0) + 1,
      },
    }));

    await runTaskFlow({
      taskId: session.current_task_id,
      query: normalizedQuery,
      mode: session.current_mode,
    });
  },

  triggerGeneration: async (taskId) => {
    const session = get().session;
    if (!session) return;

    // Remove the generate_prompt message and start generation
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

      useStudyStore.setState((state) => ({
        messages: [
          ...state.messages,
          { id: makeId("summary"), type: "summary", summary: generation.summary },
        ],
        isLoading: false,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unexpected error";
      useStudyStore.setState((state) => ({
        error: message,
        isLoading: false,
        messages: state.messages.filter((m) => m.id !== generationLoadingId),
      }));
    }
  },

  advancePhase: async () => {
    const { session } = get();
    if (!session) {
      return;
    }

    set({ isLoading: true, error: null });
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
            id: makeId("msg"),
            type: "text",
            role: "system",
            content: `Transitioned to Phase ${next.current_phase} (${next.current_mode}).`,
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

  submitNodeSelection: async (taskId, selectedIds, rejectedIds, order) => {
    const session = get().session;
    if (!session) return;

    set({ isLoading: true });

    try {
      await selectNodesTask(taskId, selectedIds, rejectedIds, order);

      // Show a "Generate Summary" button instead of auto-generating
      set((state) => ({
        messages: [
          ...state.messages,
          { id: makeId("gen-prompt"), type: "generate_prompt", taskId },
        ],
        isLoading: false,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unexpected error";
      set({ error: message, isLoading: false });
    }
  },

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
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unexpected error";
      set({ error: message, isLoading: false });
    }
  },

  addMessage: (msg) => {
    set((state) => ({
      messages: [...state.messages, msg],
    }));
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
      isLoading: false,
      error: null,
    });
  },

  clearForNewChat: () => {
    set({
      activeChatId: null,
      session: null,
      messages: [],
      isLoading: false,
      error: null,
      participantId: "P01",
      followUpCounts: {},
    });
  },
}));

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

    // For HITL-R and HITL-Full: show chunk selector (user must select then submit)
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

    // For baseline and HITL-G: show a "Generate Summary" button instead of auto-generating
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
