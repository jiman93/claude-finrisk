from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, JSON, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.database import Base
from app.models.enums import GroupType


class StudyAssignment(Base):
    __tablename__ = "study_assignments"

    participant_id: Mapped[str] = mapped_column(String(4), primary_key=True)
    group: Mapped[GroupType] = mapped_column(Enum(GroupType), nullable=False)
    phases: Mapped[list] = mapped_column(JSON, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="not_started", nullable=False)
    override: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=False), default=datetime.utcnow, nullable=False
    )
