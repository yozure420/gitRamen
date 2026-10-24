from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field, field_validator

# bcrypt はパスワードの先頭 72 バイトしか使わないため、それより長いと後ろが無視される
BCRYPT_MAX_PASSWORD_BYTES = 72


class UserRegister(BaseModel):
    """新規ユーザー登録リクエストのスキーマ。

    name は 1〜50 文字、password は 8 文字以上かつ UTF-8 で 72 バイト以下のバリデーションを持つ。
    """

    name: str = Field(..., min_length=1, max_length=50)
    password: str = Field(..., min_length=8, max_length=100)

    @field_validator("password")
    @classmethod
    def _fit_bcrypt_limit(cls, value: str) -> str:
        if len(value.encode("utf-8")) > BCRYPT_MAX_PASSWORD_BYTES:
            raise ValueError(f"password must be at most {BCRYPT_MAX_PASSWORD_BYTES} bytes in UTF-8")
        return value


class UserLogin(BaseModel):
    """ログインリクエストのスキーマ。

    password の下限が 1 文字なのは、登録済みの短いパスワードでもログインできるようにするため。
    """

    name: str = Field(..., min_length=1, max_length=50)
    # 以前の登録上限（100 文字）で登録したユーザーも通しつつ、極端に長い入力でハッシュ照合が失敗（500）しないよう上限を設ける
    password: str = Field(..., min_length=1, max_length=100)


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
