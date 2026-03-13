from typing import Optional

from sqlalchemy.orm import Session

from models import User


def get_user_by_name(db: Session, name: str) -> Optional[User]:
    """名前でユーザーを検索する。"""
    return db.query(User).filter(User.name == name).first()


def create_user(db: Session, name: str, hashed_password: str) -> User:
    """新規ユーザーを作成して返す。"""
    user = User(name=name, hashed_password=hashed_password)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
