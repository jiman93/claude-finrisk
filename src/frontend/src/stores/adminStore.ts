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
const TOKEN_KEY = "finrisk_admin_token";

function getStoredToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY);
}

async function request<T>(path: string, token: string | null): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const response = await fetch(`${BASE_URL}${path}`, { headers });
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
  // Auth
  token: string | null;
  loginError: string | null;

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
  login: (password: string) => Promise<boolean>;
  logout: () => void;
  fetchOverview: () => Promise<void>;
  fetchSessionDetail: (sessionId: string) => Promise<void>;
  fetchTaskDetail: (taskId: string) => Promise<void>;
  fetchActivity: (limit?: number) => Promise<void>;
  setView: (view: AdminView) => void;
  goBack: () => void;
  toggleAutoRefresh: () => void;
}

export const useAdminStore = create<AdminState>((set, get) => ({
  token: getStoredToken(),
  loginError: null,

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

  login: async (password: string) => {
    set({ loginError: null });
    try {
      const response = await fetch(`${BASE_URL}/api/admin/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!response.ok) {
        set({ loginError: "Incorrect password" });
        return false;
      }
      const { token } = (await response.json()) as { token: string };
      sessionStorage.setItem(TOKEN_KEY, token);
      set({ token, loginError: null });
      return true;
    } catch {
      set({ loginError: "Connection error" });
      return false;
    }
  },

  logout: () => {
    sessionStorage.removeItem(TOKEN_KEY);
    set({ token: null, overview: null, participants: [], selectedSession: null, selectedTask: null });
  },

  fetchOverview: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await request<AdminOverviewResponse>("/api/admin/overview", get().token);
      set({ overview: data.overview, participants: data.participants, isLoading: false });
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unexpected error";
      set({ error: msg, isLoading: false });
    }
  },

  fetchSessionDetail: async (sessionId: string) => {
    set({ isLoading: true, error: null });
    try {
      const data = await request<AdminSessionDetail>(`/api/admin/sessions/${sessionId}`, get().token);
      set({ selectedSession: data, currentView: "session", isLoading: false });
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unexpected error";
      set({ error: msg, isLoading: false });
    }
  },

  fetchTaskDetail: async (taskId: string) => {
    set({ isLoading: true, error: null });
    try {
      const data = await request<AdminTaskFullDetail>(`/api/admin/tasks/${taskId}`, get().token);
      set({ selectedTask: data, currentView: "task", isLoading: false });
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unexpected error";
      set({ error: msg, isLoading: false });
    }
  },

  fetchActivity: async (limit = 50) => {
    try {
      const data = await request<AdminActivityResponse>(`/api/admin/activity?limit=${limit}`, get().token);
      set({ activityFeed: data.events, activityTotal: data.total_count });
    } catch {
      // Non-critical — silently fail
    }
  },

  setView: (view: AdminView) => set({ currentView: view }),

  goBack: () => {
    const { currentView } = get();
    if (currentView === "task") set({ currentView: "session", selectedTask: null });
    else if (currentView === "session") set({ currentView: "overview", selectedSession: null });
  },

  toggleAutoRefresh: () => set((s) => ({ autoRefresh: !s.autoRefresh })),
}));
