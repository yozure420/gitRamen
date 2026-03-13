from __future__ import annotations

from sqlalchemy import Integer, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import TYPE_CHECKING

from database import Base

if TYPE_CHECKING:
    from .history import History
    from .cmd import Cmd


class Miss(Base):
    __tablename__ = "miss"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    history_id: Mapped[int] = mapped_column(ForeignKey("history.id", ondelete="CASCADE"), nullable=False, index=True)
    miss_command_id: Mapped[int] = mapped_column(ForeignKey("command.id"), nullable=False, index=True)
    miss_count: Mapped[int] = mapped_column(Integer, default=0)

    history: Mapped["History"] = relationship(back_populates="misses")
    command: Mapped["Cmd"] = relationship(back_populates="miss_records")
