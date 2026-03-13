from sqlalchemy import Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from typing import Optional

from database import Base


class Cmd(Base):
    """
    Gitコマンドテーブル
    course: 難易度レベル (1=初級, 2=中級, 3=上級, 4=誰が使うねん級)
    """
    __tablename__ = "command"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    command: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    course: Mapped[int] = mapped_column(Integer, nullable=False, default=1)


