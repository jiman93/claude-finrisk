import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.database import Base


class ProtocolDeviation(Base):
    __tablename__ = "protocol_deviations"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    session_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("sessions.id"), nullable=False
    )
    participant_id: Mapped[str] = mapped_column(String(4), nullable=False)
    phase: Mapped[int | None] = mapped_column(Integer)
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=False), default=datetime.utcnow, nullable=False
    )
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    affected_metrics: Mapped[list[str] | None] = mapped_column(JSON)
