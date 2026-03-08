from .database import engine, Base
from .models import GameSession, CommandHistory, Leaderboard

def init_database():
    """データベースとテーブルを初期化"""
    Base.metadata.create_all(bind=engine)
    print("Database initialized successfully!")

if __name__ == "__main__":
    init_database()
