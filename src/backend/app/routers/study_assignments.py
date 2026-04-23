from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.enums import GroupType
from app.models.study_assignment import StudyAssignment
from app.schemas.study_assignment import (
    AllAssignmentsResponse,
    GenerateDefaultsResponse,
    ParticipantAssignmentResponse,
    ParticipantAssignmentUpdate,
)
from app.services.assignment_service import generate_all_defaults, generate_default_assignment

router = APIRouter(prefix="/api/study/assignments", tags=["study-assignments"])


def _to_response(assignment: StudyAssignment) -> ParticipantAssignmentResponse:
    return ParticipantAssignmentResponse(
        participant_id=assignment.participant_id,
        phases=assignment.phases,
        status=assignment.status,
        override=assignment.override,
        updated_at=assignment.updated_at,
    )


def _upsert_defaults(db: Session) -> list[StudyAssignment]:
    """Generate default assignments into the database and return them."""
    defaults = generate_all_defaults()
    for d in defaults:
        sa = StudyAssignment(
            participant_id=d["participant_id"],
            group=GroupType.A,
            phases=d["phases"],
            status=d["status"],
            override=d["override"],
            updated_at=datetime.utcnow(),
        )
        db.add(sa)
    db.commit()
    return (
        db.query(StudyAssignment)
        .order_by(StudyAssignment.participant_id)
        .all()
    )


# NOTE: The generate-defaults route MUST be registered before the
# /{participant_id} route so FastAPI matches it as a literal path segment
# rather than interpreting "generate-defaults" as a participant_id.


@router.post("/generate-defaults", response_model=GenerateDefaultsResponse)
def regenerate_defaults(db: Session = Depends(get_db)):
    """Delete all existing assignments and regenerate from study_setup defaults."""
    db.query(StudyAssignment).delete()
    db.flush()
    assignments = _upsert_defaults(db)
    return GenerateDefaultsResponse(
        generated_count=len(assignments),
        assignments=[_to_response(a) for a in assignments],
    )


@router.get("", response_model=AllAssignmentsResponse)
def get_all_assignments(db: Session = Depends(get_db)):
    assignments = (
        db.query(StudyAssignment)
        .order_by(StudyAssignment.participant_id)
        .all()
    )
    if not assignments:
        assignments = _upsert_defaults(db)
    return AllAssignmentsResponse(
        assignments=[_to_response(a) for a in assignments]
    )


@router.get("/{participant_id}", response_model=ParticipantAssignmentResponse)
def get_assignment(participant_id: str, db: Session = Depends(get_db)):
    assignment = db.get(StudyAssignment, participant_id)
    if not assignment:
        # Auto-generate defaults if the table is empty, then retry
        existing_count = db.query(StudyAssignment).count()
        if existing_count == 0:
            _upsert_defaults(db)
            assignment = db.get(StudyAssignment, participant_id)
        if not assignment:
            raise HTTPException(status_code=404, detail="Assignment not found")
    return _to_response(assignment)


@router.put("/{participant_id}", response_model=ParticipantAssignmentResponse)
def update_assignment(
    participant_id: str,
    payload: ParticipantAssignmentUpdate,
    db: Session = Depends(get_db),
):
    assignment = db.get(StudyAssignment, participant_id)
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    assignment.phases = [phase.model_dump() for phase in payload.phases]
    assignment.override = True
    assignment.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(assignment)
    return _to_response(assignment)


@router.post("/{participant_id}/reset", response_model=ParticipantAssignmentResponse)
def reset_assignment(participant_id: str, db: Session = Depends(get_db)):
    """Reset a single participant assignment to computed defaults."""
    assignment = db.get(StudyAssignment, participant_id)
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    defaults = generate_default_assignment(participant_id)
    assignment.phases = defaults["phases"]
    assignment.override = False
    assignment.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(assignment)
    return _to_response(assignment)
