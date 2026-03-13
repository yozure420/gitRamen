from __future__ import annotations

from sqlalchemy import Integer, DateTime, String, ForeignKey, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import func
from datetime import datetime
from typing import TYPE_CHECKING, Optional, List
import uuid

from database import Base

if TYPE_CHECKING:
    from .user import User
    from .miss import Miss


class History(Base):
    __tablename__ = "history"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    played_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    score: Mapped[int] = mapped_column(Integer, default=0)
    course: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)

    user: Mapped["User"] = relationship(back_populates="histories")
    misses: Mapped[List["Miss"]] = relationship(back_populates="history")
