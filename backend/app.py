from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db, engine, Base
from models import User, History, Cmd, Miss
from pydantic import BaseModel
from typing import List, Optional
from routers.auth import router as auth_router
import random

# データベーステーブルを作成
Base.metadata.create_all(bind=engine)

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

@app.get("/api/commands/{command_id}", response_model=CommandResponse)
async def get_command(command_id: int, db: Session = Depends(get_db)):
    """特定のコマンドを取得"""
    command = db.query(Cmd).filter(Cmd.id == command_id).first()
    
    if not command:
        raise HTTPException(status_code=404, detail="Command not found")
    
    return command

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