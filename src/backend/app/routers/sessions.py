from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.participant import Participant
from app.models.session import Session as StudySession
from app.models.study_assignment import StudyAssignment
from app.models.task import Task
from app.schemas.session import NextPhaseResponse, SessionStartRequest, SessionStateResponse
from app.services.study_setup import get_group, get_ticker_sequence

router = APIRouter(prefix="/api/sessions", tags=["sessions"])


def _get_assignment(db: Session, participant_id: str) -> StudyAssignment:
    assignment = db.get(StudyAssignment, participant_id)
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found. Generate defaults first.")
    return assignment


def _build_session_state(db: Session, study_session: StudySession) -> SessionStateResponse:
    participant = db.get(Participant, study_session.participant_id)
    if not participant:
        raise HTTPException(status_code=404, detail="Participant not found")

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
        group=participant.group,
        current_phase=study_session.current_phase,
        current_mode=study_session.current_mode,
        current_task_id=current_task.id,
        current_ticker=current_task.ticker,
        current_query=current_task.query_text,
        started_at=study_session.started_at,
    )


def _ensure_participant(db: Session, participant_id: str) -> Participant:
    participant = db.get(Participant, participant_id)
    if participant:
        return participant

    group = get_group(participant_id)
    ticker_seq = get_ticker_sequence(participant_id)
    participant = Participant(
        id=participant_id,
        group=group,
        phase_tickers=ticker_seq,
    )
    db.add(participant)
    db.flush()
    return participant


def _create_task_for_phase(db: Session, study_session: StudySession, phase: int) -> Task:
    assignment = _get_assignment(db, study_session.participant_id)
    phase_config = assignment.phases[phase - 1]
    task = Task(
        session_id=study_session.id,
        phase=phase,
        mode=phase_config["mode"],
        ticker=phase_config["ticker"],
        query_text=phase_config["query"],
    )
    db.add(task)
    db.flush()
    return task


@router.post("/start", response_model=SessionStateResponse)
def start_session(payload: SessionStartRequest, db: Session = Depends(get_db)):
    participant = _ensure_participant(db, payload.participant_id)
    assignment = _get_assignment(db, payload.participant_id)
    first_phase = assignment.phases[0]

    study_session = StudySession(
        participant_id=participant.id,
        current_phase=1,
        current_mode=first_phase["mode"],
    )
    db.add(study_session)
    db.flush()
    _create_task_for_phase(db, study_session, phase=1)
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

    assignment = _get_assignment(db, study_session.participant_id)
    total_phases = len(assignment.phases)

    if study_session.current_phase >= total_phases:
        raise HTTPException(status_code=400, detail="Session already at final phase")

    study_session.current_phase += 1
    next_config = assignment.phases[study_session.current_phase - 1]
    study_session.current_mode = next_config["mode"]
    task = _create_task_for_phase(db, study_session, study_session.current_phase)
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
