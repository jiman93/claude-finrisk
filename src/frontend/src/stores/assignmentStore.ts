import { create } from "zustand";

import type { ParticipantAssignment, PhaseAssignment } from "../types";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

async function request<T>(path: string, init: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
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

interface AssignmentState {
  assignments: ParticipantAssignment[];
  selectedParticipantId: string | null;
  isLoading: boolean;
  error: string | null;

  fetchAssignments: () => Promise<void>;
  selectParticipant: (id: string | null) => void;
  updateAssignment: (
    participantId: string,
    phases: PhaseAssignment[]
  ) => Promise<void>;
  resetAssignment: (participantId: string) => Promise<void>;
  regenerateDefaults: () => Promise<void>;
}

export const useAssignmentStore = create<AssignmentState>((set) => ({
  assignments: [],
  selectedParticipantId: null,
  isLoading: false,
  error: null,

  fetchAssignments: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await request<{ assignments: ParticipantAssignment[] }>(
        "/api/study/assignments",
        { method: "GET" }
      );
      set({ assignments: data.assignments, isLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unexpected error";
      set({ error: message, isLoading: false });
    }
  },

  selectParticipant: (id) => set({ selectedParticipantId: id }),

  updateAssignment: async (participantId, phases) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await request<ParticipantAssignment>(
        `/api/study/assignments/${participantId}`,
        { method: "PUT", body: JSON.stringify({ phases }) }
      );
      set((state) => ({
        assignments: state.assignments.map((a) =>
          a.participant_id === participantId ? updated : a
        ),
        isLoading: false,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unexpected error";
      set({ error: message, isLoading: false });
    }
  },

  resetAssignment: async (participantId) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await request<ParticipantAssignment>(
        `/api/study/assignments/${participantId}/reset`,
        { method: "POST", body: JSON.stringify({}) }
      );
      set((state) => ({
        assignments: state.assignments.map((a) =>
          a.participant_id === participantId ? updated : a
        ),
        isLoading: false,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unexpected error";
      set({ error: message, isLoading: false });
    }
  },

  regenerateDefaults: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await request<{
        generated_count: number;
        assignments: ParticipantAssignment[];
      }>("/api/study/assignments/generate-defaults", {
        method: "POST",
        body: JSON.stringify({}),
      });
      set({ assignments: data.assignments, isLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unexpected error";
      set({ error: message, isLoading: false });
    }
  },
}));
