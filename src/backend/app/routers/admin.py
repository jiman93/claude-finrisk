from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import desc, func, select
from sqlalchemy.orm import Session as DbSession

from app.db.database import get_db
from app.models.participant import Participant
from app.models.session import Session as StudySession
from app.models.study_assignment import StudyAssignment
from app.models.task import Task
from app.schemas.admin import (
    ActivityEvent,
    ActivityFeedResponse,
    ParticipantListResponse,
    ParticipantRow,
    SessionDetailResponse,
    StudyOverview,
    TaskDetail,
    TaskFullDetail,
)

router = APIRouter(prefix="/api/admin", tags=["admin"])


# ── helpers ──


def _task_to_detail(t: Task) -> TaskDetail:
    return TaskDetail(
        task_id=t.id,
        phase=t.phase,
        mode=t.mode,
        ticker=t.ticker,
        query_text=t.query_text,
        started_at=t.started_at,
        completed_at=t.completed_at,
        time_on_task_seconds=t.time_on_task_seconds,
        retrieved_count=len(t.retrieved_nodes or []),
        selected_count=len(t.selected_node_ids or []),
        rejected_count=len(t.rejected_node_ids or []),
        retrieval_completed_at=t.retrieval_completed_at,
        generated_summary_preview=(t.generated_summary or "")[:200] or None,
        generation_completed_at=t.generation_completed_at,
        edited_summary_preview=(t.edited_summary or "")[:200] or None,
        characters_edited=t.characters_edited,
        edit_distance=t.edit_distance,
        edit_similarity=t.edit_similarity,
        flagged_spans_count=len(t.flagged_spans or []),
        edit_completed_at=t.edit_completed_at,
        first_edit_at=t.first_edit_at,
        feedback_responses=t.feedback_responses,
        feedback_submitted_at=t.feedback_submitted_at,
        llm_metrics=t.llm_metrics,
        pdf_view_duration_ms=t.pdf_view_duration_ms,
    )


# ── 1. Overview ──


@router.get("/overview", response_model=ParticipantListResponse)
def get_overview(db: DbSession = Depends(get_db)):
    assignments = (
        db.query(StudyAssignment)
        .order_by(StudyAssignment.participant_id)
        .all()
    )

    rows: list[ParticipantRow] = []
    for a in assignments:
        session = db.scalar(
            select(StudySession)
            .where(StudySession.participant_id == a.participant_id)
            .order_by(desc(StudySession.started_at))
            .limit(1)
        )

        phases_completed = 0
        total_time: int | None = None
        if session:
            stats = db.execute(
                select(
                    func.count(Task.completed_at),
                    func.sum(Task.time_on_task_seconds),
                ).where(Task.session_id == session.id)
            ).one()
            phases_completed = stats[0] or 0
            total_time = stats[1]

        rows.append(
            ParticipantRow(
                participant_id=a.participant_id,
                assignment_status=a.status,
                session_id=session.id if session else None,
                current_phase=session.current_phase if session else None,
                current_mode=session.current_mode if session else None,
                session_started_at=session.started_at if session else None,
                session_ended_at=session.ended_at if session else None,
                phases_completed=phases_completed,
                total_phases=len(a.phases) if a.phases else 2,
                total_time_seconds=total_time,
            )
        )

    total = len(assignments)
    not_started = sum(1 for a in assignments if a.status == "not_started")
    in_progress = sum(1 for a in assignments if a.status == "in_progress")
    completed = sum(1 for a in assignments if a.status == "completed")
    total_sessions = db.scalar(select(func.count()).select_from(StudySession)) or 0
    total_tasks = db.scalar(select(func.count()).select_from(Task)) or 0
    tasks_with_fb = (
        db.scalar(
            select(func.count())
            .select_from(Task)
            .where(Task.feedback_submitted_at.isnot(None))
        )
        or 0
    )
    avg_time = db.scalar(
        select(func.avg(Task.time_on_task_seconds)).where(
            Task.time_on_task_seconds.isnot(None)
        )
    )

    overview = StudyOverview(
        total_participants=total,
        not_started=not_started,
        in_progress=in_progress,
        completed=completed,
        completion_pct=round((completed / total * 100) if total > 0 else 0, 1),
        total_sessions=total_sessions,
        total_tasks=total_tasks,
        tasks_with_feedback=tasks_with_fb,
        avg_time_on_task_seconds=round(avg_time, 1) if avg_time else None,
    )

    return ParticipantListResponse(overview=overview, participants=rows)


# ── 2. Session detail ──


@router.get("/sessions/{session_id}", response_model=SessionDetailResponse)
def get_session_detail(session_id: str, db: DbSession = Depends(get_db)):
    session = db.get(StudySession, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    participant = db.get(Participant, session.participant_id)
    tasks = (
        db.query(Task)
        .where(Task.session_id == session_id)
        .order_by(Task.phase)
        .all()
    )

    assignment = db.get(StudyAssignment, session.participant_id)
    total_phases = len(assignment.phases) if assignment and assignment.phases else 2

    return SessionDetailResponse(
        session_id=session.id,
        participant_id=session.participant_id,
        current_phase=session.current_phase,
        current_mode=session.current_mode,
        total_phases=total_phases,
        started_at=session.started_at,
        ended_at=session.ended_at,
        tasks=[_task_to_detail(t) for t in tasks],
    )


# ── 3. Task full detail ──


@router.get("/tasks/{task_id}", response_model=TaskFullDetail)
def get_task_detail(task_id: str, db: DbSession = Depends(get_db)):
    task = db.get(Task, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    return TaskFullDetail(
        **_task_to_detail(task).model_dump(),
        generated_summary=task.generated_summary,
        edited_summary=task.edited_summary,
        retrieved_nodes=task.retrieved_nodes,
        selected_node_ids=task.selected_node_ids,
        rejected_node_ids=task.rejected_node_ids,
        traversal_path=task.traversal_path,
        flagged_spans=task.flagged_spans,
    )


# ── 4. Activity feed ──


@router.get("/activity", response_model=ActivityFeedResponse)
def get_activity(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: DbSession = Depends(get_db),
):
    events: list[ActivityEvent] = []

    # Session-level events
    sessions = db.query(StudySession).all()
    for s in sessions:
        events.append(
            ActivityEvent(
                timestamp=s.started_at,
                participant_id=s.participant_id,
                event_type="session_started",
                phase=1,
                mode=None,
                ticker=None,
                detail=f"{s.participant_id} started a session",
            )
        )
        if s.ended_at:
            events.append(
                ActivityEvent(
                    timestamp=s.ended_at,
                    participant_id=s.participant_id,
                    event_type="session_completed",
                    phase=None,
                    mode=None,
                    ticker=None,
                    detail=f"{s.participant_id} completed their session",
                )
            )

    # Task-level events
    tasks = db.query(Task).join(StudySession).all()
    for t in tasks:
        pid = t.session.participant_id if t.session else "?"

        if t.retrieval_completed_at:
            count = len(t.retrieved_nodes or [])
            events.append(
                ActivityEvent(
                    timestamp=t.retrieval_completed_at,
                    participant_id=pid,
                    event_type="retrieval_completed",
                    phase=t.phase,
                    mode=t.mode,
                    ticker=t.ticker,
                    detail=f"{pid} retrieved {count} chunks for {t.ticker} (phase {t.phase})",
                )
            )

        if t.generation_completed_at:
            events.append(
                ActivityEvent(
                    timestamp=t.generation_completed_at,
                    participant_id=pid,
                    event_type="generation_completed",
                    phase=t.phase,
                    mode=t.mode,
                    ticker=t.ticker,
                    detail=f"{pid} generated summary for {t.ticker} (phase {t.phase})",
                )
            )

        if t.edit_completed_at:
            events.append(
                ActivityEvent(
                    timestamp=t.edit_completed_at,
                    participant_id=pid,
                    event_type="edit_completed",
                    phase=t.phase,
                    mode=t.mode,
                    ticker=t.ticker,
                    detail=f"{pid} edited summary for {t.ticker} ({t.characters_edited or 0} chars changed)",
                )
            )

        if t.feedback_submitted_at:
            events.append(
                ActivityEvent(
                    timestamp=t.feedback_submitted_at,
                    participant_id=pid,
                    event_type="feedback_submitted",
                    phase=t.phase,
                    mode=t.mode,
                    ticker=t.ticker,
                    detail=f"{pid} submitted feedback for {t.ticker} (phase {t.phase})",
                )
            )

    events.sort(key=lambda e: e.timestamp, reverse=True)
    total = len(events)
    page = events[offset : offset + limit]
    return ActivityFeedResponse(events=page, total_count=total)
