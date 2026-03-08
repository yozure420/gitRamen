from sqlalchemy import create_engine, Integer, String, DateTime, ForeignKey, Text, Uuid, func
from sqlalchemy.orm import sessionmaker, DeclarativeBase, Mapped, mapped_column, relationship
from datetime import datetime, timezone
import uuid
from typing import List, Optional

# --- 設定 ---
SQLALCHEMY_DATABASE_URL = "sqlite:///./db/gitramen.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class Base(DeclarativeBase):
    pass

# --- モデル定義 ---

class User(Base):
    __tablename__ = 'users'
    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(50), nullable=False, unique=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    title: Mapped[str] = mapped_column(String(50), default="一般人")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    play_count: Mapped[int] = mapped_column(Integer, default=0)

    # リレーション: 1人のユーザーは複数の履歴を持つ
    histories: Mapped[List["History"]] = relationship(back_populates="user")

class History(Base):
    __tablename__ = 'history'
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    played_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    score: Mapped[int] = mapped_column(Integer, default=0)
    course: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)

    # リレーション
    user: Mapped["User"] = relationship(back_populates="histories")
    misses: Mapped[List["Miss"]] = relationship(back_populates="history")

class Cmd(Base):
    __tablename__ = 'command'
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    command: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    course: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # リレーション
    miss_records: Mapped[List["Miss"]] = relationship(back_populates="command")

class Miss(Base):
    __tablename__ = 'miss'
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    history_id: Mapped[int] = mapped_column(ForeignKey("history.id", ondelete="CASCADE"), nullable=False, index=True)
    miss_command_id: Mapped[int] = mapped_column(ForeignKey("command.id"), nullable=False, index=True)
    miss_count: Mapped[int] = mapped_column(Integer, default=0)

    # リレーション
    history: Mapped["History"] = relationship(back_populates="misses")
    command: Mapped["Cmd"] = relationship(back_populates="miss_records")

# --- ユーティリティ ---

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# テーブル作成用（初期化時に一度実行）
def init_db():
    Base.metadata.create_all(bind=engine)