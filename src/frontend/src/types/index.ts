export type Mode = "baseline" | "hitl_r" | "hitl_g" | "hitl_full";

export interface SessionState {
  session_id: string;
  participant_id: string;
  group: "A" | "B";
  current_phase: number;
  current_mode: Mode;
  current_task_id: string;
  current_ticker: string;
  current_query: string;
  started_at: string;
}

export interface RetrievalNode {
  node_id: string;
  title: string;
  page_index: number;
  relevant_content: string;
  from_traversal?: boolean;
}

export interface TraversalStep {
  depth: number;
  action: string;
  options?: string[];
  selected?: string[];
  count?: number;
}

export interface QueryResponse {
  status: string;
  task_id: string;
  retrieved_nodes: RetrievalNode[];
  retrieval_completed_at: string;
  retrieval_mode?: string;
  traversal_path?: TraversalStep[];
}

export interface GenerateResponse {
  task_id: string;
  summary: string;
  used_node_ids: string[];
  used_nodes?: RetrievalNode[];
  generation_completed_at: string;
}

export interface NextPhaseResponse {
  session_id: string;
  current_phase: number;
  current_mode: Mode;
  current_task_id: string;
  current_ticker: string;
  current_query: string;
}

export interface SelectNodesResponse {
  task_id: string;
  selected_node_ids: string[];
  rejected_node_ids: string[];
}

export interface FlaggedSpan {
  start: number;
  end: number;
  text: string;
  reason: string;
}

export interface EditSummaryResponse {
  task_id: string;
  edited_summary: string;
  characters_edited: number;
  hallucinations_flagged: number;
  edit_completed_at: string;
}

export interface SubmitFeedbackResponse {
  task_id: string;
  definition_id: string;
  feedback_submitted_at: string;
}

// ---------------------------------------------------------------------------
// Checkpoint / HITL Control Architecture types
// ---------------------------------------------------------------------------

export type CheckpointFieldType =
  | "text"
  | "textarea"
  | "select"
  | "multi_select"
  | "checkbox"
  | "radio"
  | "number"
  | "range"
  | "chips";

export interface CheckpointFieldDef {
  key: string;
  type: CheckpointFieldType;
  label: string;
  required: boolean;
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  min?: number;
  max?: number;
  default?: unknown;
}

export type CheckpointState =
  | "pending"
  | "offered"
  | "active"
  | "submitted"
  | "collapsed"
  | "skipped"
  | "failed"
  | "timed_out";

export type PipelinePosition =
  | "after_retrieval"
  | "after_generation"
  | "post_generation";

export interface CheckpointDefinition {
  id: string;
  control_type: string;
  label: string;
  description: string;
  field_schema: CheckpointFieldDef[];
  pipeline_position: PipelinePosition;
  sort_order: number;
  applicable_modes: string[];
  required: boolean;
  timeout_seconds: number | null;
  max_retries: number;
  circuit_breaker_threshold: number;
  circuit_breaker_window_minutes: number;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface CheckpointInstance {
  id: string;
  task_id: string;
  definition_id: string;
  control_type: string;
  label: string;
  state: CheckpointState;
  field_schema: CheckpointFieldDef[];
  payload: Record<string, unknown> | null;
  submit_result: Record<string, unknown> | null;
  required: boolean;
  timeout_seconds: number | null;
  attempt_count: number;
  max_retries: number;
  last_error: string | null;
  offered_at: string | null;
  submitted_at: string | null;
}

// ---------------------------------------------------------------------------
// Study Control Panel types
// ---------------------------------------------------------------------------

export type AssignmentStatus = "not_started" | "in_progress" | "completed";

export interface PhaseCheckpointRef {
  definition_id: string;
  control_type: string;
  label: string;
  pipeline_position: PipelinePosition;
  sort_order: number;
}

export interface PhaseAssignment {
  phase: number;
  mode: Mode;
  ticker: string;
  query: string;
  checkpoints: PhaseCheckpointRef[];
}

export interface ParticipantAssignment {
  participant_id: string;
  group: "A" | "B";
  phases: [PhaseAssignment, PhaseAssignment, PhaseAssignment];
  status: AssignmentStatus;
  override: boolean;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Session Ledger types
// ---------------------------------------------------------------------------

export interface LedgerQuery {
  text: string;
  submittedAt: string;
}

export interface LedgerChunk {
  id: string;
  index: number;
  title: string;
  pageRef: string;
  contentPreview: string;
  selected: boolean;
}

export interface LedgerRetrieval {
  totalRetrieved: number;
  totalSelected: number;
  chunks: LedgerChunk[];
  selectionEnabled: boolean;
}

export interface LedgerSummary {
  text: string;
  wasEdited: boolean;
  editCount?: number;
  additionCount?: number;
  deletionCount?: number;
  sourceNodes?: RetrievalNode[];
}

export interface LedgerFeedback {
  completeness?: number;
  accuracy?: number;
  citationHelpfulness?: string;
  perceivedControl?: number;
  featureUsefulness?: number;
  openFeedback?: string;
}

export type LedgerActiveStep =
  | "query"
  | "retrieval"
  | "generation"
  | "edit"
  | "questionnaire"
  | null;

export interface LedgerPhase {
  phase: number;
  mode: Mode;
  ticker: string;
  status: "completed" | "active" | "upcoming";
  query: LedgerQuery | null;
  retrieval: LedgerRetrieval | null;
  summary: LedgerSummary | null;
  feedback: LedgerFeedback | null;
  activeStep: LedgerActiveStep;
}

// ---------------------------------------------------------------------------
// Chat history / sidebar types
// ---------------------------------------------------------------------------

export interface ChatSnapshot {
  chatId: string;
  title: string;
  session: SessionState | null;
  messages: ChatMessage[];
  assignment: ParticipantAssignment;
  ledgerPhases: LedgerPhase[];
}

// ---------------------------------------------------------------------------
// Chat message types — stream-first architecture
// Every visual element is a message in the array. The renderer is a pure
// type-switch with zero injection logic; all flow decisions live in the store.
// ---------------------------------------------------------------------------

export type ChatMessage =
  // ── Structural ──
  | {
      id: string;
      type: "phase_start";
      phase: number;
      mode: Mode;
      ticker: string;
      query: string;
    }

  // ── Text ──
  | {
      id: string;
      type: "text";
      role: "system" | "user" | "assistant";
      content: string;
    }

  // ── Pipeline stages ──
  | {
      id: string;
      type: "loading";
      content: string;
    }
  | {
      id: string;
      type: "traversal_path";
      steps: TraversalStep[];
    }
  | {
      id: string;
      type: "retrieved_nodes";
      nodes: RetrievalNode[];
    }
  | {
      id: string;
      type: "selector";
      taskId: string;
      nodes: RetrievalNode[];
      submitted?: boolean;
      selectedCount?: number;
    }
  | {
      id: string;
      type: "generate_prompt";
      taskId: string;
    }
  | {
      id: string;
      type: "summary";
      summary: string;
      sourceNodes?: RetrievalNode[];
    }
  | {
      id: string;
      type: "editable_summary";
      taskId: string;
      summary: string;
      sourceNodes?: RetrievalNode[];
    }

  // ── Checkpoints (history — submitted/skipped cards stay in stream) ──
  | {
      id: string;
      type: "submitted_checkpoint";
      definitionId: string;
      label: string;
      state: "submitted" | "skipped";
      fields: Array<{ label: string; value: string }>;
    };

// ---------------------------------------------------------------------------
// Tail action types — rendered in pinned zone outside the scrollable stream
// ---------------------------------------------------------------------------

export type TailAction =
  | { type: "questionnaire_prompt" }
  | { type: "phase_advance"; nextPhase: number }
  | { type: "session_complete" };

// ---------------------------------------------------------------------------
// Admin Dashboard types
// ---------------------------------------------------------------------------

export interface StudyOverview {
  total_participants: number;
  not_started: number;
  in_progress: number;
  completed: number;
  completion_pct: number;
  total_sessions: number;
  total_tasks: number;
  tasks_with_feedback: number;
  avg_time_on_task_seconds: number | null;
}

export interface AdminParticipantRow {
  participant_id: string;
  group: "A" | "B";
  assignment_status: string;
  session_id: string | null;
  current_phase: number | null;
  current_mode: Mode | null;
  session_started_at: string | null;
  session_ended_at: string | null;
  phases_completed: number;
  total_time_seconds: number | null;
}

export interface AdminOverviewResponse {
  overview: StudyOverview;
  participants: AdminParticipantRow[];
}

export interface AdminTaskDetail {
  task_id: string;
  phase: number;
  mode: Mode;
  ticker: string;
  query_text: string;
  started_at: string;
  completed_at: string | null;
  time_on_task_seconds: number | null;
  retrieved_count: number;
  selected_count: number;
  rejected_count: number;
  retrieval_completed_at: string | null;
  generated_summary_preview: string | null;
  generation_completed_at: string | null;
  edited_summary_preview: string | null;
  characters_edited: number | null;
  edit_distance: number | null;
  edit_similarity: number | null;
  flagged_spans_count: number;
  edit_completed_at: string | null;
  first_edit_at: string | null;
  feedback_responses: Record<string, unknown> | null;
  feedback_submitted_at: string | null;
  llm_metrics: {
    generation?: { prompt_tokens: number; completion_tokens: number; duration_ms: number; model: string };
    navigation?: { prompt_tokens: number; completion_tokens: number; duration_ms: number; model: string; depth: number }[];
  } | null;
  pdf_view_duration_ms: number | null;
}

export interface AdminSessionDetail {
  session_id: string;
  participant_id: string;
  group: "A" | "B";
  current_phase: number;
  current_mode: Mode;
  started_at: string;
  ended_at: string | null;
  tasks: AdminTaskDetail[];
}

export interface AdminActivityEvent {
  timestamp: string;
  participant_id: string;
  event_type: string;
  phase: number | null;
  mode: Mode | null;
  ticker: string | null;
  detail: string;
}

export interface AdminActivityResponse {
  events: AdminActivityEvent[];
  total_count: number;
}

export interface AdminTaskFullDetail extends AdminTaskDetail {
  generated_summary: string | null;
  edited_summary: string | null;
  retrieved_nodes: Record<string, unknown>[] | null;
  selected_node_ids: string[] | null;
  rejected_node_ids: string[] | null;
  traversal_path: Record<string, unknown>[] | null;
  flagged_spans: Record<string, unknown>[] | null;
}
