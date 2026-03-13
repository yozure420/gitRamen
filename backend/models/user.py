from __future__ import annotations

from sqlalchemy import String, DateTime, Integer, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import func
from datetime import datetime
from typing import TYPE_CHECKING, List
import uuid

from database import Base

if TYPE_CHECKING:
    from .history import History


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(50), nullable=False, unique=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    title: Mapped[str] = mapped_column(String(50), default="一般人")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    play_count: Mapped[int] = mapped_column(Integer, default=0)

    histories: Mapped[List["History"]] = relationship(back_populates="user")
