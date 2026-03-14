from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db, engine, Base
from models import User, History, Cmd, Miss
from pydantic import BaseModel
from typing import List, Optional
from routers.auth import router as auth_router, get_current_user
import random


def ensure_schema() -> None:
    """Add missing columns for existing SQLite DBs (lightweight migration)."""
    with engine.connect() as conn:
        columns = conn.exec_driver_sql("PRAGMA table_info(command)").fetchall()
        column_names = {col[1] for col in columns}
        if "game_note" not in column_names:
            conn.exec_driver_sql("ALTER TABLE command ADD COLUMN game_note TEXT")
            conn.commit()

# データベーステーブルを作成
Base.metadata.create_all(bind=engine)
ensure_schema()

app = FastAPI(title="GitRamen API")
app.include_router(auth_router, prefix="/auth", tags=["auth"])

# CORS設定（フロントエンドからのアクセスを許可）
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # 開発環境
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Pydanticモデル ---
class CommandResponse(BaseModel):
    id: int
    command: str
    description: str
    game_note: Optional[str] = None
    course: int
    
    class Config:
        from_attributes = True

class CheckCommandRequest(BaseModel):
    user_input: str
    command_id: int

class CheckCommandResponse(BaseModel):
    is_correct: bool
    expected: str
    user_input: str

class MissEntry(BaseModel):
    command_id: int
    miss_count: int

class SaveHistoryRequest(BaseModel):
    course: int
    score: int = 0
    misses: List[MissEntry] = []

class MissedCommandResponse(BaseModel):
    cmd: str
    count: int

class UserStatsResponse(BaseModel):
    username: str
    title: str
    total_plays: int
    best_score: int
    last_play: Optional[str]
    missed_commands: List[MissedCommandResponse]

# --- エンドポイント ---

@app.get("/")
async def root():
    return {"message": "GitRamen API"}

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.get("/api/commands/random", response_model=List[CommandResponse])
async def get_random_commands(
    course: int = 1,
    count: int = 3,
    db: Session = Depends(get_db)
):
    """指定コースのコマンドをランダムに取得"""
    commands = db.query(Cmd).filter(Cmd.course == course).all()
    
    if not commands:
        raise HTTPException(status_code=404, detail=f"No commands found for course {course}")
    
    if len(commands) < count:
        count = len(commands)
    
    random_commands = random.sample(commands, count)
    return random_commands

@app.get("/api/commands/course", response_model=List[CommandResponse])
async def get_commands_by_course(
    course: int = 1,
    db: Session = Depends(get_db)
):
    """指定コースのコマンド一覧をID順で取得（ヘルプ表示用）"""
    commands = (
        db.query(Cmd)
        .filter(Cmd.course == course)
        .order_by(Cmd.id.asc())
        .all()
    )

    if not commands:
        raise HTTPException(status_code=404, detail=f"No commands found for course {course}")

    return commands

@app.get("/api/commands/{command_id}", response_model=CommandResponse)
async def get_command(command_id: int, db: Session = Depends(get_db)):
    """特定のコマンドを取得"""
    command = db.query(Cmd).filter(Cmd.id == command_id).first()
    
    if not command:
        raise HTTPException(status_code=404, detail="Command not found")
    
    return command

@app.post("/api/history", status_code=201)
async def save_history(
    request: SaveHistoryRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """ゲーム終了時に結果を保存する。History + Miss レコードを作成し play_count を更新する。"""
    history = History(user_id=current_user.id, course=str(request.course), score=request.score)
    db.add(history)
    db.flush()

    for entry in request.misses:
        if entry.miss_count > 0:
            miss = Miss(
                history_id=history.id,
                miss_command_id=entry.command_id,
                miss_count=entry.miss_count,
            )
            db.add(miss)

    current_user.play_count += 1
    db.commit()
    return {"ok": True}


@app.get("/api/users/me/stats", response_model=UserStatsResponse)
async def get_my_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """マイページ用の統計情報を返す。"""
    last_history = (
        db.query(History)
        .filter(History.user_id == current_user.id)
        .order_by(History.played_at.desc())
        .first()
    )
    last_play = (
        last_history.played_at.strftime("%Y/%m/%d") if last_history else None
    )

    best_score_row = (
        db.query(func.max(History.score))
        .filter(History.user_id == current_user.id)
        .scalar()
    )
    best_score = best_score_row if best_score_row is not None else 0

    miss_rows = (
        db.query(Cmd.command, func.sum(Miss.miss_count).label("total"))
        .join(Miss, Miss.miss_command_id == Cmd.id)
        .join(History, History.id == Miss.history_id)
        .filter(History.user_id == current_user.id)
        .group_by(Cmd.id)
        .order_by(func.sum(Miss.miss_count).desc())
        .limit(10)
        .all()
    )
    missed_commands = [MissedCommandResponse(cmd=row.command, count=row.total) for row in miss_rows]

    return UserStatsResponse(
        username=current_user.name,
        title=current_user.title,
        total_plays=current_user.play_count,
        best_score=best_score,
        last_play=last_play,
        missed_commands=missed_commands,
    )


@app.post("/api/commands/check", response_model=CheckCommandResponse)
async def check_command(
    request: CheckCommandRequest,
    db: Session = Depends(get_db)
):
    """ユーザーの入力コマンドが正解かチェック"""
    command = db.query(Cmd).filter(Cmd.id == request.command_id).first()
    
    if not command:
        raise HTTPException(status_code=404, detail="Command not found")
    
    # 入力の正規化（大文字小文字無視、前後の空白削除）
    user_input_normalized = request.user_input.strip().lower()
    expected_normalized = command.command.strip().lower()
    
    is_correct = user_input_normalized == expected_normalized
    
    return CheckCommandResponse(
        is_correct=is_correct,
        expected=command.command,
        user_input=request.user_input
    )