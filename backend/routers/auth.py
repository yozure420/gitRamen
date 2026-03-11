from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from db.models import get_db, User
from schemas.auth import UserRegister, UserLogin, TokenResponse, UserResponse
from auth.password import hash_password, verify_password
from auth.jwt import create_access_token, decode_token

router = APIRouter()
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


@router.post("/register", response_model=UserResponse)
async def register(data: UserRegister, db: Session = Depends(get_db)):
    """新規ユーザーを登録する。

    同じ名前が既に存在する場合は 400 を返す。
    成功時はパスワードを除いたユーザー情報を返す。
    """
    existing = db.query(User).filter(User.name == data.name).first()
    if existing:
        # 同名ユーザーが既に登録されている
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Name already registered",
        )
    hashed = hash_password(data.password)
    user = User(name=data.name, hashed_password=hashed)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=TokenResponse)
async def login(data: UserLogin, db: Session = Depends(get_db)):
    """ログインして JWT アクセストークンを返す。

    名前またはパスワードが一致しない場合は、どちらが誤りかを特定させないよう
    同一のエラーメッセージ（401）を返す。
    """
    user = db.query(User).filter(User.name == data.name).first()
    if user is None or not verify_password(data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid name or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    # sub にユーザー ID、name にユーザー名を埋め込んだ JWT を発行
    access_token = create_access_token(data={"sub": str(user.id), "name": user.name})
    return TokenResponse(access_token=access_token)


@router.get("/me", response_model=UserResponse)
async def me(current_user: User = Depends(get_current_user)):
    """現在ログイン中のユーザー情報を返す。

    有効なトークンを持つユーザーのみアクセスできる。
    """
    return current_user
