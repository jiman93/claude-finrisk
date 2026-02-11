from datetime import datetime

from pydantic import BaseModel, Field

from app.models.enums import GroupType, ModeType


class PhaseCheckpointRef(BaseModel):
    definition_id: str
    control_type: str
    label: str
    pipeline_position: str
    sort_order: int


class PhaseAssignment(BaseModel):
    phase: int = Field(ge=1, le=3)
    mode: ModeType
    ticker: str
    query: str
    checkpoints: list[PhaseCheckpointRef]


class ParticipantAssignmentResponse(BaseModel):
    participant_id: str
    group: GroupType
    phases: list[PhaseAssignment]
    status: str
    override: bool
    updated_at: datetime


class ParticipantAssignmentUpdate(BaseModel):
    """Payload for PUT /api/study/assignments/{participant_id}."""

    group: GroupType | None = None
    phases: list[PhaseAssignment]


class AllAssignmentsResponse(BaseModel):
    assignments: list[ParticipantAssignmentResponse]


class GenerateDefaultsResponse(BaseModel):
    generated_count: int
    assignments: list[ParticipantAssignmentResponse]
