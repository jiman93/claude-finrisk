from sqlalchemy import Enum, JSON, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.database import Base
from app.models.enums import GroupType


class Participant(Base):
    __tablename__ = "participants"

    id: Mapped[str] = mapped_column(String(4), primary_key=True)
    group: Mapped[GroupType] = mapped_column(Enum(GroupType), nullable=False)
    phase_tickers: Mapped[list] = mapped_column(JSON, nullable=False)
