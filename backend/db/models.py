from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base

class GameSession(Base):
    """ゲームセッション"""
    __tablename__ = "game_sessions"

    id = Column(Integer, primary_key=True, index=True)
    player_name = Column(String, nullable=True)
    started_at = Column(DateTime, default=datetime.utcnow)
    ended_at = Column(DateTime, nullable=True)
    score = Column(Integer, default=0)
    level = Column(Integer, default=1)
    is_completed = Column(Boolean, default=False)
    
    # リレーション
    commands = relationship("CommandHistory", back_populates="session")


class CommandHistory(Base):
    """コマンド履歴"""
    __tablename__ = "command_history"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("game_sessions.id"))
    command = Column(String, nullable=False)
    is_correct = Column(Boolean, default=False)
    executed_at = Column(DateTime, default=datetime.utcnow)
    lane = Column(Integer, nullable=True)  # どのレーンに対するコマンドか
    
    # リレーション
    session = relationship("GameSession", back_populates="commands")


class Leaderboard(Base):
    """リーダーボード（スコアランキング）"""
    __tablename__ = "leaderboard"

    id = Column(Integer, primary_key=True, index=True)
    player_name = Column(String, nullable=False)
    score = Column(Integer, nullable=False)
    level_reached = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)
