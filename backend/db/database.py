from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# SQLiteデータベースファイルのパス
SQLALCHEMY_DATABASE_URL = "sqlite:///./db/gitramen.db"

# エンジンの作成
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    connect_args={"check_same_thread": False}  # SQLite用の設定
)

# セッションの作成
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# ベースクラス
Base = declarative_base()

# データベース接続の依存性
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
