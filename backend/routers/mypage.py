from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models import User, History, Miss, Cmd
from routers.auth import get_current_user
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

router = APIRouter()

# --- レスポンスモデル ---

class MissedCommandResponse(BaseModel):
    command: str
    total_miss: int

class HistoryResponse(BaseModel):
    id: int
    played_at: datetime
    score: int
    course: Optional[str]

    class Config:
        from_attributes = True

class MyPageResponse(BaseModel):
    name: str
    title: str
    play_count: int
    accuracy: Optional[float]
    last_play: Optional[str]
    missed_commands: List[MissedCommandResponse]
    histories: List[HistoryResponse]

# --- エンドポイント ---

@router.get("/stats", response_model=MyPageResponse)
async def get_mypage_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """マイページ用のユーザー統計情報を取得"""

    # プレイ履歴（新しい順）
    histories = (
        db.query(History)
        .filter(History.user_id == current_user.id)
        .order_by(History.played_at.desc())
        .all()
    )

    # 最終プレイ日
    last_play = None
    if histories:
        last_play = histories[0].played_at.strftime("%Y/%m/%d")

    # 正解率の計算
    # history内の全ミス数とプレイ回数から算出
    accuracy = None
    if histories:
        total_questions = 0
        total_misses = 0
        for h in histories:
            total_questions += h.score  # scoreを正解数として扱う
            miss_sum = (
                db.query(func.sum(Miss.miss_count))
                .filter(Miss.history_id == h.id)
                .scalar()
            ) or 0
            total_misses += miss_sum

        total_attempts = total_questions + total_misses
        if total_attempts > 0:
            accuracy = round((total_questions / total_attempts) * 100, 1)

    # コマンドごとのミス集計
    missed_commands = (
        db.query(
            Cmd.command,
            func.sum(Miss.miss_count).label("total_miss"),
        )
        .join(Miss, Miss.miss_command_id == Cmd.id)
        .join(History, History.id == Miss.history_id)
        .filter(History.user_id == current_user.id)
        .group_by(Cmd.command)
        .order_by(func.sum(Miss.miss_count).desc())
        .all()
    )

    return MyPageResponse(
        name=current_user.name,
        title=current_user.title,
        play_count=current_user.play_count,
        accuracy=accuracy,
        last_play=last_play,
        missed_commands=[
            MissedCommandResponse(command=cmd, total_miss=total)
            for cmd, total in missed_commands
        ],
        histories=[HistoryResponse.model_validate(h) for h in histories[:10]],
    )
