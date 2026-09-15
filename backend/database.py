import os

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

# テストやローカル実行では環境変数 DATABASE_URL で差し替えられる
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./db/gitramen.db")
# check_same_thread は SQLite 専用のオプションなので、他の DB に差し替えても動くようにする
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)


class Base(DeclarativeBase):
    pass


def get_db():
    """データベースセッションの依存性注入用"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
