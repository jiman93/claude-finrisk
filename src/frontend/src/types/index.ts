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
    }
  | {
      id: string;
      type: "editable_summary";
      taskId: string;
      summary: string;
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
