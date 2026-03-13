from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class UserRegister(BaseModel):
    """新規ユーザー登録リクエストのスキーマ。

    name は 1〜50 文字、password は 8〜100 文字のバリデーションを持つ。
    """

    name: str = Field(..., min_length=1, max_length=50)
    password: str = Field(..., min_length=8, max_length=100)


class UserLogin(BaseModel):
    """ログインリクエストのスキーマ。

    password の下限が 1 文字なのは、登録済みの短いパスワードでもログインできるようにするため。
    """

    name: str = Field(..., min_length=1, max_length=50)
    # ログイン時はパスワード長の上限チェックをしない（DB と照合するだけ）
    password: str = Field(..., min_length=1)


class TokenResponse(BaseModel):
    """ログイン成功時に返すトークンのスキーマ。"""

    access_token: str
    # OAuth2 の慣習に従い、常に "bearer" を返す
    token_type: str = "bearer"


class UserResponse(BaseModel):
    """ユーザー情報レスポンスのスキーマ。パスワードは含まない。"""

    id: UUID
    name: str
    title: str
    created_at: datetime

    class Config:
        # SQLAlchemy の ORM オブジェクトを直接渡せるようにする
        from_attributes = True
