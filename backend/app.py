from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from db.database import get_db, engine
from db.models import Base, GameSession, CommandHistory, Leaderboard
from datetime import datetime

# データベーステーブルを作成
Base.metadata.create_all(bind=engine)

app = FastAPI(title="GitRamen API")

# CORS設定（フロントエンドからのアクセスを許可）
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # 開発環境
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "GitRamen API"}

@app.get("/health")
async def health():
    return {"status": "ok"}

# ゲームセッション開始
@app.post("/api/game/start")
async def start_game(player_name: str = None, db: Session = Depends(get_db)):
    session = GameSession(player_name=player_name)
    db.add(session)
    db.commit()
    db.refresh(session)
    return {"session_id": session.id, "started_at": session.started_at}

# コマンド記録
@app.post("/api/game/command")
async def record_command(
    session_id: int,
    command: str,
    is_correct: bool,
    lane: int = None,
    db: Session = Depends(get_db)
):
    cmd = CommandHistory(
        session_id=session_id,
        command=command,
        is_correct=is_correct,
        lane=lane
    )
    db.add(cmd)
    db.commit()
    return {"status": "recorded"}

# ゲーム終了
@app.post("/api/game/end")
async def end_game(session_id: int, score: int, level: int, db: Session = Depends(get_db)):
    session = db.query(GameSession).filter(GameSession.id == session_id).first()
    if session:
        session.ended_at = datetime.utcnow()
        session.score = score
        session.level = level
        session.is_completed = True
        db.commit()
        
        # リーダーボードに追加
        if session.player_name:
            leaderboard_entry = Leaderboard(
                player_name=session.player_name,
                score=score,
                level_reached=level
            )
            db.add(leaderboard_entry)
            db.commit()
        
        return {"status": "game_ended", "score": score}
    return {"status": "session_not_found"}

# リーダーボード取得
@app.get("/api/leaderboard")
async def get_leaderboard(limit: int = 10, db: Session = Depends(get_db)):
    entries = db.query(Leaderboard).order_by(Leaderboard.score.desc()).limit(limit).all()
    return [
        {
            "player_name": e.player_name,
            "score": e.score,
            "level": e.level_reached,
            "created_at": e.created_at
        }
        for e in entries
    ]