from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.enums import GroupType, ModeType
from app.models.participant import Participant
from app.models.session import Session as StudySession
from app.models.study_assignment import StudyAssignment
from app.models.task import Task
from app.schemas.session import NextPhaseResponse, SessionStartRequest, SessionStateResponse
from app.services.assignment_service import generate_default_assignment
from app.services.study_setup import QUERIES

router = APIRouter(prefix="/api/sessions", tags=["sessions"])


def _get_or_create_assignment(db: Session, participant_id: str) -> StudyAssignment:
    assignment = db.get(StudyAssignment, participant_id)
    if assignment:
        return assignment
    d = generate_default_assignment(participant_id)
    assignment = StudyAssignment(
        participant_id=d["participant_id"],
        group=GroupType.A,
        phases=d["phases"],
        status=d["status"],
        override=False,
        updated_at=datetime.utcnow(),
    )
    db.add(assignment)
    db.flush()
    return assignment


def _ensure_participant(db: Session, participant_id: str) -> Participant:
    participant = db.get(Participant, participant_id)
    if participant:
        return participant

    assignment = _get_or_create_assignment(db, participant_id)
    tickers = [p["ticker"] for p in assignment.phases]
    # Pad to 3 entries for backward-compat with DB NOT NULL columns
    while len(tickers) < 3:
        tickers.append(tickers[-1])

    participant = Participant(
        id=participant_id,
        group=GroupType.A,
        phase1_ticker=tickers[0],
        phase2_ticker=tickers[1],
        phase3_ticker=tickers[2],
    )
    db.add(participant)
    db.flush()
    return participant


def _build_session_state(db: Session, study_session: StudySession) -> SessionStateResponse:
    current_task = db.scalar(
        select(Task)
        .where(Task.session_id == study_session.id, Task.phase == study_session.current_phase)
        .order_by(Task.started_at.desc())
    )
    if not current_task:
        raise HTTPException(status_code=404, detail="Current task not found")

    return SessionStateResponse(
        session_id=study_session.id,
        participant_id=study_session.participant_id,
        current_phase=study_session.current_phase,
        current_mode=study_session.current_mode,
        current_task_id=current_task.id,
        current_ticker=current_task.ticker,
        current_query=current_task.query_text,
        started_at=study_session.started_at,
    )


def _create_task_for_phase(
    db: Session, study_session: StudySession, phase: int, assignment: StudyAssignment
) -> Task:
    phase_data = assignment.phases[phase - 1]
    ticker = phase_data["ticker"]
    query = QUERIES[ticker]
    task = Task(
        session_id=study_session.id,
        phase=phase,
        mode=study_session.current_mode,
        ticker=ticker,
        query_text=query,
    )
    db.add(task)
    db.flush()
    return task


@router.post("/start", response_model=SessionStateResponse)
def start_session(payload: SessionStartRequest, db: Session = Depends(get_db)):
    participant = _ensure_participant(db, payload.participant_id)
    assignment = _get_or_create_assignment(db, payload.participant_id)

    first_phase = assignment.phases[0]
    study_session = StudySession(
        participant_id=participant.id,
        current_phase=1,
        current_mode=ModeType(first_phase["mode"]),
    )
    db.add(study_session)
    db.flush()
    _create_task_for_phase(db, study_session, phase=1, assignment=assignment)
    db.commit()
    db.refresh(study_session)
    return _build_session_state(db, study_session)


@router.get("/{session_id}", response_model=SessionStateResponse)
def get_session(session_id: str, db: Session = Depends(get_db)):
    study_session = db.get(StudySession, session_id)
    if not study_session:
        raise HTTPException(status_code=404, detail="Session not found")
    return _build_session_state(db, study_session)


@router.post("/{session_id}/next-phase", response_model=NextPhaseResponse)
def next_phase(session_id: str, db: Session = Depends(get_db)):
    study_session = db.get(StudySession, session_id)
    if not study_session:
        raise HTTPException(status_code=404, detail="Session not found")

    assignment = _get_or_create_assignment(db, study_session.participant_id)
    max_phases = len(assignment.phases)

    if study_session.current_phase >= max_phases:
        raise HTTPException(status_code=400, detail="Session already at final phase")

    study_session.current_phase += 1
    next_phase_data = assignment.phases[study_session.current_phase - 1]
    study_session.current_mode = ModeType(next_phase_data["mode"])
    task = _create_task_for_phase(db, study_session, study_session.current_phase, assignment)
    db.commit()
    return NextPhaseResponse(
        session_id=study_session.id,
        current_phase=study_session.current_phase,
        current_mode=study_session.current_mode,
        current_task_id=task.id,
        current_ticker=task.ticker,
        current_query=task.query_text,
    )


@router.post("/{session_id}/complete")
def complete_session(session_id: str, db: Session = Depends(get_db)):
    study_session = db.get(StudySession, session_id)
    if not study_session:
        raise HTTPException(status_code=404, detail="Session not found")
    study_session.ended_at = datetime.utcnow()
    db.commit()
    return {"status": "completed", "session_id": session_id}
