import type {
  EditSummaryResponse,
  FlaggedSpan,
  GenerateResponse,
  NextPhaseResponse,
  QueryResponse,
  SelectNodesResponse,
  SessionState,
  SubmitFeedbackResponse,
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

export function queryTask(taskId: string, query?: string): Promise<QueryResponse> {
  return request<QueryResponse>(`/api/tasks/${taskId}/query`, {
    method: "POST",
    body: JSON.stringify({ query }),
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
  flaggedSpans: FlaggedSpan[],
  firstEditAtMs?: number | null
): Promise<EditSummaryResponse> {
  return request<EditSummaryResponse>(`/api/tasks/${taskId}/edit-summary`, {
    method: "POST",
    body: JSON.stringify({
      edited_text: editedText,
      flagged_spans: flaggedSpans,
      first_edit_at_ms: firstEditAtMs ?? null,
    }),
  });
}

export function patchPdfDuration(taskId: string, pdfViewDurationMs: number): Promise<void> {
  return request<void>(`/api/tasks/${taskId}/pdf-duration`, {
    method: "PATCH",
    body: JSON.stringify({ pdf_view_duration_ms: pdfViewDurationMs }),
  });
}

export function submitFeedbackTask(
  taskId: string,
  definitionId: string,
  responses: Record<string, unknown>,
  pdfViewDurationMs?: number
): Promise<SubmitFeedbackResponse> {
  return request<SubmitFeedbackResponse>(`/api/tasks/${taskId}/submit-feedback`, {
    method: "POST",
    body: JSON.stringify({
      definition_id: definitionId,
      responses,
      pdf_view_duration_ms: pdfViewDurationMs || null,
    }),
  });
}
