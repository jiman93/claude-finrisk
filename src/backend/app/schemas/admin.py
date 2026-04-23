from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel

from app.models.enums import ModeType


# ── Overview stats ──


class StudyOverview(BaseModel):
    total_participants: int
    not_started: int
    in_progress: int
    completed: int
    completion_pct: float
    total_sessions: int
    total_tasks: int
    tasks_with_feedback: int
    avg_time_on_task_seconds: float | None


# ── Participant row ──


class ParticipantRow(BaseModel):
    participant_id: str
    assignment_status: str
    session_id: str | None
    current_phase: int | None
    current_mode: ModeType | None
    session_started_at: datetime | None
    session_ended_at: datetime | None
    phases_completed: int
    total_phases: int
    total_time_seconds: int | None


class ParticipantListResponse(BaseModel):
    overview: StudyOverview
    participants: list[ParticipantRow]


# ── Task detail (compact) ──


class TaskDetail(BaseModel):
    task_id: str
    phase: int
    mode: ModeType
    ticker: str
    query_text: str
    started_at: datetime
    completed_at: datetime | None
    time_on_task_seconds: int | None
    retrieved_count: int
    selected_count: int
    rejected_count: int
    retrieval_completed_at: datetime | None
    generated_summary_preview: str | None
    generation_completed_at: datetime | None
    edited_summary_preview: str | None
    characters_edited: int | None
    edit_distance: int | None
    edit_similarity: float | None
    flagged_spans_count: int
    edit_completed_at: datetime | None
    first_edit_at: datetime | None
    feedback_responses: dict | None
    feedback_submitted_at: datetime | None
    llm_metrics: dict | None
    pdf_view_duration_ms: int | None


# ── Session detail ──


class SessionDetailResponse(BaseModel):
    session_id: str
    participant_id: str
    current_phase: int
    current_mode: ModeType
    total_phases: int
    started_at: datetime
    ended_at: datetime | None
    tasks: list[TaskDetail]


# ── Activity feed ──


class ActivityEvent(BaseModel):
    timestamp: datetime
    participant_id: str
    event_type: str
    phase: int | None
    mode: ModeType | None
    ticker: str | None
    detail: str


class ActivityFeedResponse(BaseModel):
    events: list[ActivityEvent]
    total_count: int


# ── Task full detail (for deep-dive modal) ──


class TaskFullDetail(TaskDetail):
    generated_summary: str | None
    edited_summary: str | None
    retrieved_nodes: list[dict] | None
    selected_node_ids: list[str] | None
    rejected_node_ids: list[str] | None
    traversal_path: list[dict] | None
    flagged_spans: list[dict] | None
