import type {
  CheckpointEventResponse,
  CompleteTaskResponse,
  EditSummaryResponse,
  FlaggedSpan,
  GenerateResponse,
  NextPhaseResponse,
  QueryResponse,
  QuestionnaireResponse,
  SelectNodesResponse,
  SessionState,
} from "../types";

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

export function startSession(participantId: string): Promise<SessionState> {
  return request<SessionState>("/api/sessions/start", {
    method: "POST",
    body: JSON.stringify({ participant_id: participantId }),
  });
}

export function queryTask(taskId: string, query?: string, lane?: string): Promise<QueryResponse> {
  return request<QueryResponse>(`/api/tasks/${taskId}/query`, {
    method: "POST",
    body: JSON.stringify({ query, lane }),
  });
}

export function generateTask(taskId: string): Promise<GenerateResponse> {
  return request<GenerateResponse>(`/api/tasks/${taskId}/generate`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export function nextPhase(sessionId: string): Promise<NextPhaseResponse> {
  return request<NextPhaseResponse>(`/api/sessions/${sessionId}/next-phase`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export function selectNodesTask(
  taskId: string,
  selectedNodeIds: string[],
  rejectedNodeIds: string[],
  selectionOrder: string[]
): Promise<SelectNodesResponse> {
  return request<SelectNodesResponse>(`/api/tasks/${taskId}/select-nodes`, {
    method: "POST",
    body: JSON.stringify({
      selected_node_ids: selectedNodeIds,
      rejected_node_ids: rejectedNodeIds,
      selection_order: selectionOrder,
    }),
  });
}

export function editSummaryTask(
  taskId: string,
  editedText: string,
  flaggedSpans: FlaggedSpan[]
): Promise<EditSummaryResponse> {
  return request<EditSummaryResponse>(`/api/tasks/${taskId}/edit-summary`, {
    method: "POST",
    body: JSON.stringify({
      edited_text: editedText,
      flagged_spans: flaggedSpans,
    }),
  });
}

export function completeTask(taskId: string): Promise<CompleteTaskResponse> {
  return request<CompleteTaskResponse>(`/api/tasks/${taskId}/complete`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export function completeSession(sessionId: string): Promise<{ status: string; session_id: string }> {
  return request<{ status: string; session_id: string }>(`/api/sessions/${sessionId}/complete`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export function submitCheckpointEvent(
  taskId: string,
  body: {
    checkpoint_instance_id: string;
    definition_id: string;
    event_type: string;
    payload?: Record<string, unknown> | null;
  }
): Promise<CheckpointEventResponse> {
  return request<CheckpointEventResponse>(`/api/tasks/${taskId}/checkpoint-events`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function submitQuestionnaire(
  taskId: string,
  body: {
    checkpoint_instance_id: string;
    confidence: number;
    citation_helpfulness?: string | null;
    notes?: string | null;
  }
): Promise<QuestionnaireResponse> {
  return request<QuestionnaireResponse>(`/api/tasks/${taskId}/questionnaire`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}
