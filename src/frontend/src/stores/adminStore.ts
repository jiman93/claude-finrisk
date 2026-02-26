import { create } from "zustand";

import type {
  AdminActivityEvent,
  AdminActivityResponse,
  AdminOverviewResponse,
  AdminParticipantRow,
  AdminSessionDetail,
  AdminTaskFullDetail,
  StudyOverview,
} from "../types";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

async function request<T>(path: string): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
  });
  if (!response.ok) {
    let detail = "";
    try {
      const data = (await response.json()) as { detail?: string };
      detail = data.detail ? ` - ${data.detail}` : "";
    } catch {
      detail = "";
    }
    throw new Error(`Request failed: ${response.status}${detail}`);
  }
  return response.json() as Promise<T>;
}

export type AdminView = "overview" | "session" | "task";

interface AdminState {
  // Data
  overview: StudyOverview | null;
  participants: AdminParticipantRow[];
  selectedSession: AdminSessionDetail | null;
  selectedTask: AdminTaskFullDetail | null;
  activityFeed: AdminActivityEvent[];
  activityTotal: number;

  // UI
  currentView: AdminView;
  isLoading: boolean;
  error: string | null;
  autoRefresh: boolean;

  // Actions
  fetchOverview: () => Promise<void>;
  fetchSessionDetail: (sessionId: string) => Promise<void>;
  fetchTaskDetail: (taskId: string) => Promise<void>;
  fetchActivity: (limit?: number) => Promise<void>;
  setView: (view: AdminView) => void;
  goBack: () => void;
  toggleAutoRefresh: () => void;
}

export const useAdminStore = create<AdminState>((set, get) => ({
  overview: null,
  participants: [],
  selectedSession: null,
  selectedTask: null,
  activityFeed: [],
  activityTotal: 0,

  currentView: "overview",
  isLoading: false,
  error: null,
  autoRefresh: false,

  fetchOverview: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await request<AdminOverviewResponse>("/api/admin/overview");
      set({
        overview: data.overview,
        participants: data.participants,
        isLoading: false,
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unexpected error";
      set({ error: msg, isLoading: false });
    }
  },

  fetchSessionDetail: async (sessionId: string) => {
    set({ isLoading: true, error: null });
    try {
      const data = await request<AdminSessionDetail>(
        `/api/admin/sessions/${sessionId}`
      );
      set({ selectedSession: data, currentView: "session", isLoading: false });
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unexpected error";
      set({ error: msg, isLoading: false });
    }
  },

  fetchTaskDetail: async (taskId: string) => {
    set({ isLoading: true, error: null });
    try {
      const data = await request<AdminTaskFullDetail>(
        `/api/admin/tasks/${taskId}`
      );
      set({ selectedTask: data, currentView: "task", isLoading: false });
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unexpected error";
      set({ error: msg, isLoading: false });
    }
  },

  fetchActivity: async (limit = 50) => {
    try {
      const data = await request<AdminActivityResponse>(
        `/api/admin/activity?limit=${limit}`
      );
      set({ activityFeed: data.events, activityTotal: data.total_count });
    } catch {
      // Non-critical — silently fail
    }
  },

  setView: (view: AdminView) => set({ currentView: view }),

  goBack: () => {
    const { currentView } = get();
    if (currentView === "task")
      set({ currentView: "session", selectedTask: null });
    else if (currentView === "session")
      set({ currentView: "overview", selectedSession: null });
  },

  toggleAutoRefresh: () => set((s) => ({ autoRefresh: !s.autoRefresh })),
}));
