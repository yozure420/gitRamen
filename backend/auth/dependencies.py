from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from database import get_db
from models import User
from auth.jwt import decode_token

# auto_error=False にすることで、トークン未送信でも 403 ではなく None として受け取り、
# get_current_user 内で 401 を返す形に統一できる
security = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    """Authorization ヘッダーの Bearer トークンを検証し、対応するユーザーを返す。

    トークンが未送信・不正・期限切れ・存在しないユーザーの場合は 401 を返す。
    認証が必要なエンドポイントで Depends(get_current_user) として使う。
    """
    if credentials is None:
        # Authorization ヘッダーが送られていない
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = credentials.credentials
    payload = decode_token(token)
    if payload is None:
        # トークンの署名が不正か有効期限切れ
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user_id = payload.get("sub")
    if user_id is None:
        # トークンのペイロードに sub（ユーザー ID）が含まれていない
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        # トークンは正しいが、該当するユーザーが DB に存在しない（削除済みなど）
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user
